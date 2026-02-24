/**
 * 🗄️ DATABASE AGENT — AI-Powered Schema & Query Optimizer
 *
 * Analyzes the Prisma schema and queries for:
 * - Missing indices
 * - N+1 query patterns
 * - Schema improvements
 * - Orphaned relations
 *
 * Results visible in: AgentReport table in Prisma Studio.
 */

import { BaseAgent } from "./base-agent";
import type { AgentTaskRecord as AgentTask } from "../types";
import { askAI, readProjectFile } from "../ai-client";

import prisma from "../prisma";

export class DatabaseAgent extends BaseAgent {
  constructor() {
    super("DatabaseAgent", "TASK_MANAGER");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "DB_AUDIT":
        return this.runDatabaseAudit();
      default:
        return { message: `DatabaseAgent: unhandled ${task.type}` };
    }
  }

  private async runDatabaseAudit() {
    console.log(`[DatabaseAgent] 🗄️  Running AI database audit...`);
    const results = { issuesFound: 0, suggestions: 0, timestamp: new Date().toISOString() };

    const schema = readProjectFile("prisma/schema.prisma");
    if (!schema) {
      console.warn(`[DatabaseAgent] ⚠️  Could not read schema.prisma`);
      return results;
    }

    const prompt = `
You are a Database Architect specializing in Prisma ORM + SQLite/PostgreSQL.
Analyze this Prisma schema for the Metalix24 scrap metal trading platform.

Schema:
\`\`\`prisma
${schema.slice(0, 12000)}
\`\`\`

Find and report:
1. Missing database indices on frequently queried fields
2. Relations that could cause N+1 queries
3. Field types that should be changed (e.g., String for amounts instead of Float)
4. Missing cascade deletes or updates
5. Models that should have soft-delete (deletedAt DateTime?)

Respond ONLY with JSON array:
[
  {
    "severity": "WARNING|ERROR|CRITICAL",
    "category": "index|relation|type|cascade|soft-delete",
    "model": "ModelName",
    "field": "fieldName",
    "message": "describe the issue",
    "suggestion": "what to do to fix it"
  }
]`;

    try {
      const raw = await askAI(prompt);
      let issues: Array<{
        severity: string;
        category: string;
        model: string;
        field: string;
        message: string;
        suggestion: string;
      }> = [];

      // Extract JSON from response
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        issues = JSON.parse(match[0]);
      }

      for (const issue of (Array.isArray(issues) ? issues : [])) {
        await prisma.agentReport.create({
          data: {
            agentName: "DatabaseAgent",
            taskType: "DB_AUDIT",
            severity: issue.severity ?? "INFO",
            category: issue.category ?? "db",
            file: "prisma/schema.prisma",
            message: `[${issue.model}.${issue.field}] ${issue.message}`,
            suggestion: issue.suggestion,
            autoFixed: false,
          },
        });
        results.issuesFound++;
        console.log(`[DatabaseAgent] 📋 ${issue.severity}: ${issue.model}.${issue.field} — ${issue.message}`);
      }

      // Also check actual DB stats
      const [totalAgentReports, totalAuctions, totalUsers] = await Promise.all([
        prisma.agentReport.count(),
        prisma.auction.count(),
        prisma.user.count(),
      ]);

      await prisma.agentReport.create({
        data: {
          agentName: "DatabaseAgent",
          taskType: "DB_AUDIT",
          severity: "INFO",
          category: "stats",
          message: `DB Stats: ${totalUsers} users, ${totalAuctions} auctions, ${totalAgentReports} agent reports`,
          autoFixed: false,
        },
      });
      results.suggestions++;
    } catch (err) {
      console.warn(`[DatabaseAgent] ⚠️  AI audit error:`, err instanceof Error ? err.message : err);
    }

    console.log(`[DatabaseAgent] ✅ DB audit done: ${results.issuesFound} issues logged.`);
    return results;
  }
}
