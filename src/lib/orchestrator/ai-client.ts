/**
 * 🤖 THE HIVE BRAIN MULTI-PROVIDER AI ROUTER
 *
 * Routes tasks to the optimal AI model based on context size and task complexity.
 * - OpenAI GPT-4o: Critical tasks (Security/QA/Architecture)
 * - Moonshot Kimi: Huge files (>12k chars) requiring massive context
 * - Zhipu GLM-4 Free: Routine tasks (Linting, simple reviews) to save costs
 * - Google Gemini 2.0 Flash: General workhorse (Round-Robin 3 keys)
 *
 * Includes automatic failover and rate limit handling.
 */

import * as fs from "fs";
import * as path from "path";

export const PROJECT_ROOT = path.resolve(
  process.cwd().includes("recycle24") ? process.cwd() : path.join(process.cwd(), "recycle24")
);

// --- KEY MANAGEMENT & ROUND-ROBIN ---
function getKeys(prefix: string): string[] {
  return [
    process.env[`${prefix}_1`],
    process.env[`${prefix}_2`],
    process.env[`${prefix}_3`],
    process.env[prefix], // Fallback to unnumbered key
  ].filter(Boolean) as string[];
}

const keys = {
  gemini: getKeys("GEMINI_API_KEY"),
  kimi: getKeys("KIMI_API_KEY"),
  glm: getKeys("GLM_API_KEY"),
  openai: getKeys("OPENAI_API_KEY"),
};

let indices = { gemini: 0, kimi: 0, glm: 0, openai: 0 };

function getNextKey(provider: "gemini" | "kimi" | "glm" | "openai"): string | null {
  const providerKeys = keys[provider];
  if (!providerKeys.length) return null;
  
  const key = providerKeys[indices[provider] % providerKeys.length];
  indices[provider]++;
  return key;
}

// --- GLOBAL RATE LIMITERS ---
// To prevent 429s even with round-robin, we ensure a minimal gap between requests
// for each provider.
const lastCallTimes = { gemini: 0, kimi: 0, glm: 0, openai: 0 };

async function enforceRateLimit(provider: keyof typeof lastCallTimes, minDelayMs: number) {
  const now = Date.now();
  const elapsed = now - lastCallTimes[provider];
  if (elapsed < minDelayMs) {
    const wait = minDelayMs - elapsed;
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastCallTimes[provider] = Date.now();
}

// --- PROVIDER ABSTRACTIONS ---

async function callOpenAICompatible(
  provider: "kimi" | "glm" | "openai",
  url: string,
  model: string,
  prompt: string,
  minDelayMs: number = 0
): Promise<string> {
  const apiKey = getNextKey(provider);
  if (!apiKey) throw new Error(`[AI-ROUTER] ❌ No keys for ${provider}`);

  if (minDelayMs > 0) await enforceRateLimit(provider, minDelayMs);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) {
      throw Object.assign(new Error(`[${provider.toUpperCase()}] Rate limited`), { isRateLimit: true });
    }
    throw new Error(`[${provider.toUpperCase()}] API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data?.choices?.[0]?.message?.content ?? "";
}

async function callOpenAI(prompt: string): Promise<string> {
  return callOpenAICompatible("openai", "https://api.openai.com/v1/chat/completions", "gpt-4o", prompt);
}

async function callKimi(prompt: string): Promise<string> {
  // Free tier is ~3 RPM, so 20s gap
  return callOpenAICompatible("kimi", "https://api.moonshot.cn/v1/chat/completions", "moonshot-v1-128k", prompt, 20000);
}

async function callGLM(prompt: string): Promise<string> {
  // Free tier allows decently fast requests
  return callOpenAICompatible("glm", "https://open.bigmodel.cn/api/paas/v4/chat/completions", "glm-4-flash", prompt, 2000);
}

// Gemini specific REST API
async function callGemini(prompt: string): Promise<string> {
  const apiKey = getNextKey("gemini");
  if (!apiKey) throw new Error(`[AI-ROUTER] ❌ No keys for gemini`);

  // With 3 keys, we can go faster. 15 RPM each = 45 RPM total -> ~1.3s gap overall
  await enforceRateLimit("gemini", 1500);

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) {
       console.warn(`[GEMINI] Rate limited. Will try fallback or next key...`);
       throw Object.assign(new Error("Rate Limit"), { isRateLimit: true });
    }
    throw new Error(`[GEMINI] API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// --- INTELLIGENT ROUTER ---
export async function askAI(prompt: string, contextSize: number = 0, agentRole: string = "General"): Promise<string> {
  const roleUpper = agentRole.toUpperCase();
  const isCritical = roleUpper.includes("SECURITY") || roleUpper.includes("DEVOPS") || roleUpper.includes("QA");
  const isRoutine = roleUpper.includes("LINT") || roleUpper.includes("FORMAT") || roleUpper.includes("REVIEW");

  console.log(`\n[AI-ROUTER] 🚦 Task: ${agentRole} | Size: ~${Math.round(contextSize/4)} tokens`);

  // STRATEGY 1: Huge context (> 12k chars) -> Kimi
  if (contextSize > 12000 && keys.kimi.length > 0) {
    console.log(`[AI-ROUTER] 🔀 Strategy: Huge Context -> Kimi (1M Context Window)`);
    try { 
      return await callKimi(prompt); 
    } catch (e: any) { 
      if (!e.isRateLimit) console.warn(`[KIMI] Failed, falling back...`, e.message); 
      else console.warn(`[KIMI] Rate Limited. Falling back...`);
    }
  }

  // STRATEGY 2: Critical Task -> OpenAI GPT-4o
  if (isCritical && keys.openai.length > 0) {
    console.log(`[AI-ROUTER] 🔀 Strategy: Critical Task -> OpenAI GPT-4o`);
    try { 
      return await callOpenAI(prompt); 
    } catch (e: any) { 
      console.warn(`[OPENAI] Failed, falling back...`, e.message); 
    }
  }

  // STRATEGY 3: Routine Task -> GLM-4 Free (Saves Gemini Quota)
  if (isRoutine && keys.glm.length > 0) {
    console.log(`[AI-ROUTER] 🔀 Strategy: Routine Task -> Zhipu GLM-4 Free`);
    try { 
      return await callGLM(prompt); 
    } catch (e: any) { 
      if (!e.isRateLimit) console.warn(`[GLM] Failed, falling back...`, e.message); 
    }
  }

  // STRATEGY 4: General Workhorse -> Gemini 2.0 Flash (Round-Robin with 3 retries max)
  console.log(`[AI-ROUTER] 🔀 Strategy: Primary -> Gemini 2.0 Flash (Round-Robin)`);
  
  if (keys.gemini.length > 0) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await callGemini(prompt);
      } catch (err: any) {
        if (err.isRateLimit) {
           console.log(`[GEMINI] Trying another key...`);
           continue; 
        }
        break; // Stop retrying on non-429 errors
      }
    }
  }

  // STRATEGY 5: Absolute Final Fallback -> GLM-4 (if it wasn't already tried)
  if (!isRoutine && keys.glm.length > 0) {
    console.log(`[AI-ROUTER] 🔀 Strategy: Final Fallback -> Zhipu GLM-4 Free`);
    try { 
      return await callGLM(prompt); 
    } catch (e) {}
  }

  throw new Error("[AI-ROUTER] ❌ All available models failed to process the request.");
}

// --- FILE HELPERS ---
export function readProjectFile(relativePath: string): string | null {
  try {
    const fullPath = path.join(PROJECT_ROOT, relativePath);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, "utf-8");
  } catch {
    return null;
  }
}

export function writeProjectFile(relativePath: string, content: string): boolean {
  try {
    const fullPath = path.join(PROJECT_ROOT, relativePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content, "utf-8");
    return true;
  } catch (err) {
    console.error(`[AI-CLIENT] ❌ Failed to write ${relativePath}:`, err);
    return false;
  }
}

export function listProjectFiles(dir: string, extensions: string[] = [".ts", ".tsx"]): string[] {
  const results: string[] = [];
  const fullDir = path.join(PROJECT_ROOT, dir);
  function walk(current: string) {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fp = path.join(current, entry.name);
      if (entry.isDirectory()) {
         if (!["node_modules", ".next", ".git", "dist"].includes(entry.name)) walk(fp);
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
         results.push(path.relative(PROJECT_ROOT, fp));
      }
    }
  }
  walk(fullDir);
  return results;
}

export async function analyzeAndImproveFile(
  filePath: string,
  agentRole: string,
  specificInstructions: string
): Promise<{ improved: string; summary: string } | null> {
  const content = readProjectFile(filePath);
  if (!content) return null;

  // Cap increased to 150k chars because Kimi handles up to 1M (128k tokens).
  // This allows the AI to see entire large files without breaking them.
  const codeToSend = content.length > 150000 ? content.slice(0, 150000) : content;

  const prompt = `You are a highly critical, senior ${agentRole} auditing a production Next.js 14 app.
File: ${filePath}
Instructions: ${specificInstructions}

CRITICAL REQUIREMENT: Find at least ONE meaningful improvement (bugs, type unsafety, unhandled boundaries, N+1 queries, missing checks, security flaws). DO NOT return code unchanged. Re-write the code to be state-of-the-art and robust.

Return EXACTLY the new code inside a single markdown code block. Do NOT use JSON.
At the very top of your returned code block, add a single comment line starting with "// SUMMARY: " explaining what you fixed.

Current Code:
\`\`\`typescript
${codeToSend}
\`\`\`
`;

  try {
    const raw = await askAI(prompt, codeToSend.length, agentRole);
    return parseAIResponse(raw);
  } catch (err: any) {
    console.error(`[AI-ROUTER] ❌ File task failed (${filePath}): ${err.message}`);
    return null;
  }
}

function parseAIResponse(raw: string): { improved: string; summary: string } | null {
  try {
    const match = raw.match(/```(?:typescript|tsx|ts|js)?\s*([\s\S]*?)```/);
    let codeStr = match ? match[1].trim() : "";

    if (!codeStr) {
       if (raw.includes("import ") || raw.includes("export ") || raw.includes("function ")) {
         codeStr = raw.trim();
       } else {
         return null;
       }
    }

    const summaryMatch = codeStr.match(/^\/\/\s*SUMMARY:\s*(.*)$/m);
    const summary = summaryMatch ? summaryMatch[1].trim() : "Auto-fixed and hardened by AI.";
    const improved = codeStr.replace(/^\/\/\s*SUMMARY:\s*.*$\n?/m, "").trim();

    return { improved, summary };
  } catch {
    return null;
  }
}
