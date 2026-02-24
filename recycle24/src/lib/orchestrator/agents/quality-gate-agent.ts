/**
 * 🏆 QUALITY GATE AGENT — Master Aggregator & Release Manager
 *
 * The final gatekeeper before deployment:
 * - Aggregates all AgentReport data
 * - Calculates project health score
 * - Generates RELEASE_REPORT.md with Go/No-Go decision
 * - Tracks progress over time
 *
 * Results: RELEASE_REPORT.md + AgentReport health summary.
 */

import { BaseAgent } from "./base-agent";
import type { AgentTaskRecord as AgentTask } from "../types";
import { askAI, writeProjectFile } from "../ai-client";

import prisma from "../prisma";

export class QualityGateAgent extends BaseAgent {
  constructor() {
    super("QualityGateAgent", "TASK_MANAGER");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "QUALITY_GATE":
        return this.runQualityGate();
      default:
        return { message: `QualityGateAgent: unhandled ${task.type}` };
    }
  }

  private async runQualityGate() {
    console.log(`[QualityGateAgent] 🏆 Running quality gate assessment...`);
    const now = new Date();
    const results = { score: 0, decision: "UNKNOWN", timestamp: now.toISOString() };

    // Aggregate all reports from last 24 hours
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [critical, errors, warnings, infos, autoFixed, total] = await Promise.all([
      prisma.agentReport.count({ where: { severity: "CRITICAL", createdAt: { gte: since } } }),
      prisma.agentReport.count({ where: { severity: "ERROR", createdAt: { gte: since } } }),
      prisma.agentReport.count({ where: { severity: "WARNING", createdAt: { gte: since } } }),
      prisma.agentReport.count({ where: { severity: "INFO", createdAt: { gte: since } } }),
      prisma.agentReport.count({ where: { autoFixed: true, createdAt: { gte: since } } }),
      prisma.agentReport.count({ where: { createdAt: { gte: since } } }),
    ]);

    // Get by category
    const byCategory = await prisma.agentReport.groupBy({
      by: ["category"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    });

    // Get agent activity
    const agentActivity = await prisma.agent.findMany({
      select: { name: true, status: true, lastHeartbeat: true },
    });

    // Calculate health score (0-100)
    let score = 100;
    score -= critical * 20;  // -20 per critical
    score -= errors * 5;     // -5 per error
    score -= warnings * 2;   // -2 per warning
    score += autoFixed * 3;  // +3 per auto-fix
    score = Math.max(0, Math.min(100, score));

    const decision = score >= 80 ? "✅ GO — Ready to deploy" :
                     score >= 60 ? "⚠️  CONDITIONAL — Fix errors first" :
                     "❌ NO-GO — Critical issues must be resolved";

    results.score = score;
    results.decision = decision;

    // Generate release report with AI
    const reportData = {
      score, decision, total, critical, errors, warnings, infos, autoFixed,
      byCategory: byCategory.map((c: { category: string; _count: { id: number } }) => ({ category: c.category, count: c._count.id })),
      agents: agentActivity.length,
    };

    const aiSummary = await askAI(`
You are the QA Director of Metalix24, an Arabian scrap metal trading platform.
Write a concise executive deployment readiness report in ENGLISH based on this data:
${JSON.stringify(reportData, null, 2)}

Format the report in Markdown with:
- Executive Summary
- Key Metrics table  
- Critical Issues (if any)
- Recommendation
Keep it under 500 words.`).catch(() => "AI summary unavailable");

    const report = `# 🏆 METALIX24 — Quality Gate Report
## ${now.toISOString()}

## Score: ${score}/100 — ${decision}

## Last 24h Summary
| Metric | Count |
|--------|-------|
| Total Reports | ${total} |
| 🔴 Critical | ${critical} |
| 🟠 Errors | ${errors} |
| 🟡 Warnings | ${warnings} |
| 🟢 Info | ${infos} |
| ✅ Auto-Fixed | ${autoFixed} |

## Active Agents: ${agentActivity.length}
${agentActivity.map(a => `- **${a.name}**: ${a.status}`).join("\n")}

## Issues by Category
${byCategory.map((c: { category: string; _count: { id: number } }) => `- **${c.category}**: ${c._count.id} reports`).join("\n")}

## AI Executive Summary
${aiSummary}
`;

    writeProjectFile("RELEASE_REPORT.md", report);

    // Log quality gate result
    await prisma.agentReport.create({
      data: {
        agentName: "QualityGateAgent",
        taskType: "QUALITY_GATE",
        severity: score >= 80 ? "INFO" : score >= 60 ? "WARNING" : "CRITICAL",
        category: "quality-gate",
        message: `Quality Score: ${score}/100 — ${decision}`,
        suggestion: critical > 0 ? "Fix CRITICAL issues before deploying" : "Project ready for deployment",
        autoFixed: false,
      },
    });

    console.log(`[QualityGateAgent] 🏆 Quality Gate: ${score}/100 — ${decision}`);
    console.log(`[QualityGateAgent] 📄 RELEASE_REPORT.md generated.`);
    return results;
  }
}
