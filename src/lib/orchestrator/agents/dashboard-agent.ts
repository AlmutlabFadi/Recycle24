/**
 * 📊 DASHBOARD AGENT — AI-Powered Dashboard Improver
 *
 * Scans dashboard and admin pages:
 * - Connects hardcoded values to real APIs
 * - Improves KPI layouts
 * - Adds real-time data refresh
 * - Verifies GSOCC dashboard accuracy
 *
 * Results: AgentReport + improved dashboard components.
 */

import { BaseAgent } from "./base-agent";
import type { AgentTaskRecord as AgentTask } from "../types";
import { askAI, listProjectFiles, readProjectFile } from "../ai-client";

import prisma from "../prisma";

export class DashboardAgent extends BaseAgent {
  constructor() {
    super("DashboardAgent", "TASK_MANAGER");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "DASHBOARD_AUDIT":
        return this.runDashboardAudit();
      default:
        return { message: `DashboardAgent: unhandled ${task.type}` };
    }
  }

  private async runDashboardAudit() {
    console.log(`[DashboardAgent] 📊 Starting AI dashboard audit...`);
    const results = { pagesAudited: 0, issuesFound: 0, timestamp: new Date().toISOString() };

    // Get real stats to validate against
    const [userCount, auctionCount, dealCount, reportCount] = await Promise.all([
      prisma.user.count(),
      prisma.auction.count(),
      prisma.deal.count(),
      prisma.agentReport.count(),
    ]);

    const dbStats = { userCount, auctionCount, dealCount, reportCount };

    // Find dashboard-related pages
    const dashboardFiles = listProjectFiles("src/app", [".tsx"])
      .filter((f) =>
        (f.includes("dashboard") || f.includes("gsocc") || f.includes("admin")) &&
        f.endsWith("page.tsx")
      )
      .slice(0, 2);

    for (const file of dashboardFiles) {
      try {
        const content = readProjectFile(file);
        if (!content || content.length < 100) continue;

        results.pagesAudited++;

        const prompt = `
You are a Dashboard Engineer reviewing a Next.js admin dashboard for Metalix24.
Current DB Stats: ${JSON.stringify(dbStats)}

File: ${file}
\`\`\`tsx
${content.slice(0, 6000)}
\`\`\`

Find issues:
1. Hardcoded numbers that should come from real API calls
2. Missing data refresh intervals (dashboards should auto-refresh)
3. Missing loading skeletons while data fetches
4. KPI cards showing wrong or missing metrics
5. Charts without real data connections

Respond JSON array:
[{"severity": "INFO|WARNING|ERROR", "issue": "...", "suggestion": "..."}]`;

        const raw = await askAI(prompt);
        const match = raw.match(/\[[\s\S]*?\]/);
        if (!match) continue;

        const issues: Array<{ severity: string; issue: string; suggestion: string }> =
          JSON.parse(match[0]);

        for (const issue of (Array.isArray(issues) ? issues : []).slice(0, 4)) {
          await prisma.agentReport.create({
            data: {
              agentName: "DashboardAgent",
              taskType: "DASHBOARD_AUDIT",
              severity: issue.severity ?? "INFO",
              category: "dashboard",
              file,
              message: issue.issue,
              suggestion: issue.suggestion,
              autoFixed: false,
            },
          });
          results.issuesFound++;
          console.log(`[DashboardAgent] 📋 ${file}: ${issue.issue}`);
        }
      } catch (err) {
        console.warn(`[DashboardAgent] ⚠️  Failed ${file}:`, err instanceof Error ? err.message : err);
      }
    }

    console.log(`[DashboardAgent] ✅ Dashboard audit: ${results.pagesAudited} pages, ${results.issuesFound} issues.`);
    return results;
  }
}
