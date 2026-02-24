/**
 * ✨ UIUX AGENT — AI-Powered User Experience Improver
 *
 * Focuses on user experience across the platform:
 * - Ensures consistent design language
 * - Checks page-level UX flows
 * - Adds micro-interactions and feedback
 * - Improves form validation messages
 * - Checks mobile responsiveness
 *
 * Results: AgentReport + improved page files.
 */

import { BaseAgent } from "./base-agent";
import type { AgentTaskRecord as AgentTask } from "../types";
import { askAI, listProjectFiles, readProjectFile } from "../ai-client";

import prisma from "../prisma";

export class UIUXAgent extends BaseAgent {
  constructor() {
    super("UIUXAgent", "TASK_MANAGER");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "UX_AUDIT":
        return this.runUXAudit();
      default:
        return { message: `UIUXAgent: unhandled ${task.type}` };
    }
  }

  private async runUXAudit() {
    console.log(`[UIUXAgent] ✨ Starting AI UX audit...`);
    const results = { pagesAudited: 0, issuesFound: 0, timestamp: new Date().toISOString() };

    // Audit page files for UX issues (non-destructive — log only)
    const pageFiles = listProjectFiles("src/app", [".tsx"])
      .filter((f) => f.endsWith("page.tsx"))
      .slice(0, 2);

    for (const file of pageFiles) {
      try {
        const content = readProjectFile(file);
        if (!content || content.length < 100) continue;

        results.pagesAudited++;

        const prompt = `
You are a UX/UI expert reviewing a Next.js page for Metalix24, an Arabian scrap metal trading platform (RTL, Arabic UI).

File: ${file}
Code:
\`\`\`tsx
${content.slice(0, 8000)}
\`\`\`

Identify UX issues. Respond with JSON array:
[
  {
    "severity": "INFO|WARNING|ERROR",
    "issue": "short description of UX problem",
    "suggestion": "concrete fix"
  }
]`;

        const raw = await askAI(prompt);
        const match = raw.match(/\[[\s\S]*?\]/);

        if (!match) continue;

        const issues: Array<{ severity: string; issue: string; suggestion: string }> =
          JSON.parse(match[0]);

        for (const issue of (Array.isArray(issues) ? issues : []).slice(0, 3)) {
          await prisma.agentReport.create({
            data: {
              agentName: "UIUXAgent",
              taskType: "UX_AUDIT",
              severity: issue.severity ?? "INFO",
              category: "ux",
              file,
              message: issue.issue,
              suggestion: issue.suggestion,
              autoFixed: false,
            },
          });
          results.issuesFound++;
          console.log(`[UIUXAgent] 💡 ${file}: ${issue.issue}`);
        }
      } catch (err) {
        console.warn(`[UIUXAgent] ⚠️  Failed ${file}:`, err instanceof Error ? err.message : err);
      }
    }

    console.log(`[UIUXAgent] ✅ UX audit: ${results.pagesAudited} pages, ${results.issuesFound} issues found.`);
    return results;
  }
}
