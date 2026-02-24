/**
 * 🎨 FRONTEND AGENT — AI-Powered Component Improver
 *
 * Scans React/Next.js components and pages:
 * - Adds missing loading states and skeletons
 * - Fixes missing error boundaries
 * - Improves accessibility (aria labels, keyboard nav)
 * - Adds empty state UI when lists are empty
 *
 * Results: AgentReport + improved component files on disk.
 */

import { BaseAgent } from "./base-agent";
import type { AgentTaskRecord as AgentTask } from "../types";
import { analyzeAndImproveFile, listProjectFiles, writeProjectFile } from "../ai-client";

import prisma from "../prisma";

export class FrontendAgent extends BaseAgent {
  constructor() {
    super("FrontendAgent", "TASK_MANAGER");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "FRONTEND_AUDIT":
        return this.runFrontendAudit();
      default:
        return { message: `FrontendAgent: unhandled ${task.type}` };
    }
  }

  private async runFrontendAudit() {
    console.log(`[FrontendAgent] 🎨 Starting AI frontend audit...`);
    const results = { filesAudited: 0, filesImproved: 0, timestamp: new Date().toISOString() };

    // Pick component files
    const componentFiles = listProjectFiles("src/components", [".tsx", ".ts"])
      .filter((f) => f.endsWith(".tsx"))
      .slice(0, 2);

    for (const file of componentFiles) {
      try {
        results.filesAudited++;

        const aiResult = await analyzeAndImproveFile(
          file,
          "Senior React/Next.js Frontend Engineer",
          `Improve this React component for the Metalix24 Arabic scrap metal platform. Focus on:
          1. Add loading prop support and skeleton fallback if fetching data
          2. Add empty state UI when arrays are empty (use a friendly Arabic message like "لا توجد بيانات")
          3. Add error boundary or error display
          4. Fix missing key props in lists
          5. Improve accessibility: add aria-label to icon buttons, ensure proper heading hierarchy
          Keep RTL support intact. Don't change design/styles unless fixing accessibility.`
        );

        if (!aiResult) continue;

        writeProjectFile(file, aiResult.improved);
        results.filesImproved++;

        await prisma.agentReport.create({
          data: {
            agentName: "FrontendAgent",
            taskType: "FRONTEND_AUDIT",
            severity: "INFO",
            category: "frontend",
            file,
            message: aiResult.summary,
            autoFixed: true,
          },
        });

        console.log(`[FrontendAgent] ✅ Improved: ${file} — ${aiResult.summary}`);
      } catch (err) {
        console.warn(`[FrontendAgent] ⚠️  Failed ${file}:`, err instanceof Error ? err.message : err);
      }
    }

    console.log(`[FrontendAgent] ✅ Frontend audit: ${results.filesAudited} files, ${results.filesImproved} improved.`);
    return results;
  }
}
