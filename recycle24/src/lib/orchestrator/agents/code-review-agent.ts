/**
 * 🔍 CODE REVIEW AGENT — AI-Powered Code Quality
 *
 * Scans the codebase using ESLint + TypeScript + Gemini AI.
 * Finds bugs, dead code, bad patterns, and writes improvements.
 * Results visible in: AgentReport table in Prisma Studio.
 */

import { BaseAgent } from "./base-agent";
import type { AgentTaskRecord as AgentTask } from "../types";
import { analyzeAndImproveFile, listProjectFiles, readProjectFile, writeProjectFile } from "../ai-client";
import { execSync } from "child_process";

import prisma from "../prisma";

// Focus areas for code review
const REVIEW_TARGETS = [
  "src/lib",
  "src/app/api",
];

export class CodeReviewAgent extends BaseAgent {
  constructor() {
    super("CodeReviewAgent", "TASK_MANAGER");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "CODE_REVIEW":
        return this.runCodeReview();
      default:
        return { message: `CodeReviewAgent: unhandled ${task.type}` };
    }
  }

  private async runCodeReview() {
    console.log(`[CodeReviewAgent] 🔍 Starting AI-powered code review...`);
    const results = { filesReviewed: 0, issuesFound: 0, filesImproved: 0, timestamp: new Date().toISOString() };

    // Step 1: Run ESLint to get a quick list of issues
    let lintOutput = "";
    try {
      execSync("npx eslint src --ext .ts,.tsx --format json --max-warnings 0 > /tmp/eslint-out.json 2>&1", {
        cwd: process.cwd(), stdio: "pipe",
      });
    } catch (e: unknown) {
      lintOutput = (e as { stdout?: Buffer }).stdout?.toString() ?? "";
    }

    // Log lint summary
    if (lintOutput) {
      await prisma.agentReport.create({
        data: {
          agentName: "CodeReviewAgent",
          taskType: "CODE_REVIEW",
          severity: "INFO",
          category: "lint",
          message: `ESLint scan complete`,
          suggestion: "Review individual file reports for details",
        },
      });
    }

    // Step 2: AI-review each file in review targets
    for (const dir of REVIEW_TARGETS) {
      const files = listProjectFiles(dir).slice(0, 2); // Review 5 files per cycle to avoid rate limits

      for (const file of files) {
        try {
          results.filesReviewed++;
          const original = readProjectFile(file);
          if (!original || original.length < 50) continue;

          const aiResult = await analyzeAndImproveFile(
            file,
            "Senior TypeScript/React Engineer",
            `Review this file strictly. Fix: 
            1. Missing error handling (add try/catch where needed)
            2. TypeScript type improvements (avoid 'any')
            3. Unused variables or imports
            4. Performance issues
            5. Security vulnerabilities
            If no issues found, return the code unchanged. Be conservative - only fix clear problems.`
          );

          if (!aiResult) continue;

          const hasChanges = aiResult.improved !== original && aiResult.improved.length > 100;

          if (hasChanges) {
            writeProjectFile(file, aiResult.improved);
            results.filesImproved++;

            await prisma.agentReport.create({
              data: {
                agentName: "CodeReviewAgent",
                taskType: "CODE_REVIEW",
                severity: "INFO",
                category: "code-quality",
                file,
                message: aiResult.summary,
                codeAfter: aiResult.improved.slice(0, 500),
                autoFixed: true,
              },
            });

            console.log(`[CodeReviewAgent] ✏️  Improved: ${file} — ${aiResult.summary}`);
            results.issuesFound++;
          }
        } catch (err) {
          console.warn(`[CodeReviewAgent] ⚠️  Skipped ${file}:`, err instanceof Error ? err.message : err);
        }
      }
    }

    console.log(`[CodeReviewAgent] ✅ Review done: ${results.filesReviewed} reviewed, ${results.filesImproved} improved.`);
    return results;
  }
}
