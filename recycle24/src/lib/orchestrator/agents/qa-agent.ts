/**
 * 🧪 QA AGENT — AI-Powered Test Generator
 *
 * Reads source files and generates vitest tests automatically.
 * Focuses on:
 * - Utility functions
 * - API route handlers
 * - Business logic
 *
 * Results: New test files written to src/test/ + AgentReport.
 */

import { BaseAgent } from "./base-agent";
import type { AgentTaskRecord as AgentTask } from "../types";
import { askAI, listProjectFiles, readProjectFile, writeProjectFile, PROJECT_ROOT } from "../ai-client";
import * as path from "path";
import * as fs from "fs";

import prisma from "../prisma";

export class QAAgent extends BaseAgent {
  constructor() {
    super("QAAgent", "TASK_MANAGER");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "RUN_TESTS":
        return this.generateAndRunTests();
      default:
        return { message: `QAAgent: unhandled ${task.type}` };
    }
  }

  private async generateAndRunTests() {
    console.log(`[QAAgent] 🧪 Generating AI-powered tests...`);
    const results = { testsGenerated: 0, filesSkipped: 0, timestamp: new Date().toISOString() };

    // Target utility and lib files that are likely testable
    const targetFiles = listProjectFiles("src/lib")
      .filter((f) =>
        f.endsWith(".ts") &&
        !f.includes("orchestrator") &&
        !f.includes(".d.ts")
      )
      .slice(0, 2);

    for (const file of targetFiles) {
      try {
        const content = readProjectFile(file);
        if (!content || content.length < 100) {
          results.filesSkipped++;
          continue;
        }

        // Check if test already exists
        const testPath = file.replace("src/lib/", "src/test/").replace(".ts", ".test.ts");
        const testFullPath = path.join(PROJECT_ROOT, testPath);
        if (fs.existsSync(testFullPath)) {
          results.filesSkipped++;
          continue;
        }

        const prompt = `
You are a QA Engineer writing vitest tests for a Next.js app called Metalix24.

Source file: ${file}
\`\`\`typescript
${content.slice(0, 6000)}
\`\`\`

Write comprehensive vitest unit tests for all exported functions.
Requirements:
- Use import { describe, it, expect, vi, beforeEach } from 'vitest'
- Mock Prisma: vi.mock('@/lib/db', () => ({ db: { ... } }))
- Test happy path AND error cases
- Use descriptive test names in English
- Do not test private/internal functions

Return ONLY the complete test file TypeScript code (no explanation, no markdown):`;

        const testCode = await askAI(prompt);

        if (testCode && testCode.length > 100) {
          // Clean up any markdown wrapper
          const clean = testCode.replace(/^```typescript\n?/, "").replace(/```$/, "");
          writeProjectFile(testPath, clean);
          results.testsGenerated++;

          await prisma.agentReport.create({
            data: {
              agentName: "QAAgent",
              taskType: "RUN_TESTS",
              severity: "INFO",
              category: "testing",
              file,
              message: `Test file generated: ${testPath}`,
              suggestion: `Run: npx vitest run ${testPath}`,
              autoFixed: true,
            },
          });

          console.log(`[QAAgent] ✅ Test generated: ${testPath}`);
        }
      } catch (err) {
        console.warn(`[QAAgent] ⚠️  Failed ${file}:`, err instanceof Error ? err.message : err);
      }
    }

    console.log(`[QAAgent] ✅ QA complete: ${results.testsGenerated} tests generated.`);
    return results;
  }
}
