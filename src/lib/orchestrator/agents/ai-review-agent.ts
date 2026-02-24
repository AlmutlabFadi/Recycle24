/**
 * 🤖 AI REVIEW AGENT — AI-Powered AI Feature Auditor
 *
 * Reviews all AI-related code in the project:
 * - Audits Gemini/AI prompts for quality
 * - Checks for hallucination risks
 * - Validates AI response handling
 * - Suggests better prompts
 * - Monitors Gemini API usage
 *
 * Results: AgentReport with AI quality improvements.
 */

import { BaseAgent } from "./base-agent";
import type { AgentTaskRecord as AgentTask } from "../types";
import { askAI, listProjectFiles, readProjectFile } from "../ai-client";

import prisma from "../prisma";

export class AIReviewAgent extends BaseAgent {
  constructor() {
    super("AIReviewAgent", "TASK_MANAGER");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "AI_REVIEW":
        return this.runAIReview();
      default:
        return { message: `AIReviewAgent: unhandled ${task.type}` };
    }
  }

  private async runAIReview() {
    console.log(`[AIReviewAgent] 🤖 Starting AI code review...`);
    const results = { filesReviewed: 0, issuesFound: 0, timestamp: new Date().toISOString() };

    // Find files that use AI/Gemini
    const allFiles = listProjectFiles("src");
    const aiFiles = allFiles.filter((f) => {
      const content = readProjectFile(f);
      return content && (
        content.includes("generativeai") ||
        content.includes("askAI") ||
        content.includes("generateContent") ||
        content.includes("getGenerativeModel")
      );
    }).slice(0, 2);

    for (const file of aiFiles) {
      try {
        const content = readProjectFile(file);
        if (!content) continue;

        results.filesReviewed++;

        const prompt = `
You are an AI Systems Engineer reviewing AI/LLM code for Metalix24.

File: ${file}
\`\`\`typescript
${content.slice(0, 6000)}
\`\`\`

Review the AI/Gemini usage for:
1. Prompt injection vulnerabilities (user input going directly into prompts)
2. Missing response validation (assuming AI always returns valid format)
3. No retry logic for API failures
4. Hardcoded model names (should be configurable)
5. Missing token/cost controls
6. Prompts that could cause hallucinations
7. Missing timeout handling

Respond JSON array:
[{"severity": "INFO|WARNING|ERROR|CRITICAL", "issue": "...", "suggestion": "..."}]`;

        const raw = await askAI(prompt);
        const match = raw.match(/\[[\s\S]*?\]/);
        if (!match) continue;

        const issues: Array<{ severity: string; issue: string; suggestion: string }> =
          JSON.parse(match[0]);

        for (const issue of (Array.isArray(issues) ? issues : []).slice(0, 4)) {
          await prisma.agentReport.create({
            data: {
              agentName: "AIReviewAgent",
              taskType: "AI_REVIEW",
              severity: issue.severity ?? "INFO",
              category: "ai-quality",
              file,
              message: issue.issue,
              suggestion: issue.suggestion,
              autoFixed: false,
            },
          });
          results.issuesFound++;
          console.log(`[AIReviewAgent] 🧠 ${issue.severity}: ${issue.issue}`);
        }
      } catch (err) {
        console.warn(`[AIReviewAgent] ⚠️  Failed ${file}:`, err instanceof Error ? err.message : err);
      }
    }

    // Also log agent system stats
    const totalReports = await prisma.agentReport.count();
    const criticalReports = await prisma.agentReport.count({ where: { severity: "CRITICAL" } });

    await prisma.agentReport.create({
      data: {
        agentName: "AIReviewAgent",
        taskType: "AI_REVIEW",
        severity: criticalReports > 0 ? "WARNING" : "INFO",
        category: "ai-stats",
        message: `System AI health: ${totalReports} total reports, ${criticalReports} critical issues`,
        suggestion: criticalReports > 0 ? "Review and address CRITICAL reports immediately" : "System healthy",
        autoFixed: false,
      },
    });

    console.log(`[AIReviewAgent] ✅ AI review: ${results.filesReviewed} files, ${results.issuesFound} issues.`);
    return results;
  }
}
