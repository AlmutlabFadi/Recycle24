/**
 * 🔌 API AGENT — AI-Powered API Security Auditor
 *
 * Scans all API routes for:
 * - Missing authentication checks
 * - Missing input validation  
 * - Missing error handling
 * - Rate limiting gaps
 * Then uses Gemini to write the improved version.
 *
 * Results visible in: AgentReport table + improved API files on disk.
 */

import { BaseAgent } from "./base-agent";
import type { AgentTaskRecord as AgentTask } from "../types";
import { analyzeAndImproveFile, listProjectFiles } from "../ai-client";

import prisma from "../prisma";

export class APIAgent extends BaseAgent {
  constructor() {
    super("APIAgent", "SECURITY");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "API_AUDIT":
        return this.runAPIAudit();
      default:
        return { message: `APIAgent: unhandled ${task.type}` };
    }
  }

  private async runAPIAudit() {
    console.log(`[APIAgent] 🔌 Starting AI API security audit...`);
    const results = { routesAudited: 0, issuesFixed: 0, timestamp: new Date().toISOString() };

    const apiFiles = listProjectFiles("src/app/api").filter(
      (f) => f.endsWith("route.ts") || f.endsWith("route.tsx")
    ).slice(0, 2); // 6 routes per cycle

    for (const file of apiFiles) {
      try {
        results.routesAudited++;

        const aiResult = await analyzeAndImproveFile(
          file,
          "Senior API Security Engineer",
          `Audit this Next.js API route for the Metalix24 platform. Fix:
          1. Missing getServerSession() authentication check (use authOptions from @/lib/auth)
          2. Missing try/catch with proper NextResponse.json({error:...}, {status: 500})
          3. Input validation (check required fields exist before using them)
          4. Proper HTTP status codes (401 for unauth, 400 for bad input, 404 for not found)
          5. Remove any hardcoded credentials or sensitive data
          Only fix real issues. Keep the same functionality.`
        );

        if (!aiResult) continue;

        writeToFile(file, aiResult.improved);
        results.issuesFixed++;

        await prisma.agentReport.create({
          data: {
            agentName: "APIAgent",
            taskType: "API_AUDIT",
            severity: "INFO",
            category: "api-security",
            file,
            message: aiResult.summary,
            autoFixed: true,
          },
        });

        console.log(`[APIAgent] 🔒 Secured: ${file} — ${aiResult.summary}`);
      } catch (err) {
        console.warn(`[APIAgent] ⚠️  Failed ${file}:`, err instanceof Error ? err.message : err);
      }
    }

    console.log(`[APIAgent] ✅ API audit complete: ${results.routesAudited} routes, ${results.issuesFixed} improved.`);
    return results;
  }
}

// Import writeProjectFile here to avoid circular dependency
import { writeProjectFile as writeToFile } from "../ai-client";
