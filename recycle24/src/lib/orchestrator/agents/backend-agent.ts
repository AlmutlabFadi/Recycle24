/**
 * ⚙️ BACKEND AGENT — AI-Powered Server Action Improver
 *
 * Reviews all server actions and backend utilities:
 * - Adds proper error handling
 * - Improves type safety
 * - Fixes security vulnerabilities
 * - Optimizes database queries
 *
 * Results visible in: AgentReport + improved server action files.
 */

import { BaseAgent } from "./base-agent";
import type { AgentTaskRecord as AgentTask } from "../types";
import { analyzeAndImproveFile, listProjectFiles, writeProjectFile } from "../ai-client";

import prisma from "../prisma";

export class BackendAgent extends BaseAgent {
  constructor() {
    super("BackendAgent", "TASK_MANAGER");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "BACKEND_AUDIT":
        return this.runBackendAudit();
      default:
        return { message: `BackendAgent: unhandled ${task.type}` };
    }
  }

  private async runBackendAudit() {
    console.log(`[BackendAgent] ⚙️  Starting AI backend audit...`);
    const results = { filesAudited: 0, filesImproved: 0, timestamp: new Date().toISOString() };

    // Focus on server actions and lib files
    const backendFiles = [
      ...listProjectFiles("src/lib").filter(
        (f) => !f.includes("orchestrator") && !f.includes("security") && f.endsWith(".ts")
      ),
    ].slice(0, 2);

    for (const file of backendFiles) {
      try {
        results.filesAudited++;

        const aiResult = await analyzeAndImproveFile(
          file,
          "Senior Backend Engineer specializing in Next.js 14 and Prisma",
          `Improve this backend utility/service file for the Metalix24 scrap metal platform. Focus on:
          1. Add proper try/catch error handling to all async functions
          2. Improve TypeScript types (no implicit any)
          3. Add input validation where data comes from external sources
          4. Optimize Prisma queries (use select to avoid over-fetching)
          5. Ensure transactions are used for multi-step operations
          Only make improvements that are safe and conservative.`
        );

        if (!aiResult) continue;

        writeProjectFile(file, aiResult.improved);
        results.filesImproved++;

        await prisma.agentReport.create({
          data: {
            agentName: "BackendAgent",
            taskType: "BACKEND_AUDIT",
            severity: "INFO",
            category: "backend",
            file,
            message: aiResult.summary,
            autoFixed: true,
          },
        });

        console.log(`[BackendAgent] ✅ Improved: ${file} — ${aiResult.summary}`);
      } catch (err) {
        console.warn(`[BackendAgent] ⚠️  Failed ${file}:`, err instanceof Error ? err.message : err);
      }
    }

    console.log(`[BackendAgent] ✅ Backend audit: ${results.filesAudited} audited, ${results.filesImproved} improved.`);
    return results;
  }
}
