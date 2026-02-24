/**
 * 🚀 DEVOPS AGENT — AI-Powered Build & Deployment Manager
 *
 * Monitors project health from a DevOps perspective:
 * - Checks build configuration
 * - Audits package.json for vulnerabilities
 * - Generates GitHub Actions CI/CD pipeline
 * - Validates environment variable setup
 * - Creates deployment readiness report
 *
 * Results: AgentReport + generated DevOps files.
 */

import { BaseAgent } from "./base-agent";
import type { AgentTaskRecord as AgentTask } from "../types";
import { askAI, readProjectFile, writeProjectFile } from "../ai-client";
import { execSync } from "child_process";

import prisma from "../prisma";

export class DevOpsAgent extends BaseAgent {
  constructor() {
    super("DevOpsAgent", "TASK_MANAGER");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "DEVOPS_CHECK":
        return this.runDevOpsCheck();
      default:
        return { message: `DevOpsAgent: unhandled ${task.type}` };
    }
  }

  private async runDevOpsCheck() {
    console.log(`[DevOpsAgent] 🚀 Running DevOps health check...`);
    const results = { checksRun: 0, issuesFound: 0, filesGenerated: 0, timestamp: new Date().toISOString() };

    // 1. Check package.json for issues
    const packageJson = readProjectFile("package.json");
    const envExample = readProjectFile(".env.example");

    if (packageJson) {
      results.checksRun++;

      const prompt = `
You are a DevOps Engineer auditing a Next.js 14 project called Metalix24.

package.json:
\`\`\`json
${packageJson.slice(0, 4000)}
\`\`\`

.env.example:
\`\`\`
${envExample?.slice(0, 2000) ?? "Not found"}
\`\`\`

Identify DevOps issues:
1. Missing important scripts (test, lint, build, type-check)
2. Dependencies that should be devDependencies
3. Missing .env.example variables
4. Node.js version not specified
5. Missing important config files

Respond JSON array:
[{"severity": "INFO|WARNING|ERROR", "category": "scripts|deps|env|config", "issue": "...", "suggestion": "..."}]`;

      try {
        const raw = await askAI(prompt);
        const match = raw.match(/\[[\s\S]*?\]/);
        if (match) {
          const issues: Array<{ severity: string; category: string; issue: string; suggestion: string }> =
            JSON.parse(match[0]);

          for (const issue of (Array.isArray(issues) ? issues : []).slice(0, 5)) {
            await prisma.agentReport.create({
              data: {
                agentName: "DevOpsAgent",
                taskType: "DEVOPS_CHECK",
                severity: issue.severity ?? "INFO",
                category: `devops-${issue.category}`,
                file: "package.json",
                message: issue.issue,
                suggestion: issue.suggestion,
                autoFixed: false,
              },
            });
            results.issuesFound++;
            console.log(`[DevOpsAgent] 📋 ${issue.severity}: ${issue.issue}`);
          }
        }
      } catch (err) {
        console.warn(`[DevOpsAgent] ⚠️  AI audit error:`, err instanceof Error ? err.message : err);
      }
    }

    // 2. Generate GitHub Actions CI/CD if not exists
    const ciExists = readProjectFile(".github/workflows/ci.yml");
    if (!ciExists) {
      const ciPipeline = `name: CI/CD Pipeline — Metalix24

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Prisma Client
        run: npx prisma generate
        env:
          DATABASE_URL: \${{ secrets.DATABASE_URL }}
      
      - name: TypeScript Type Check
        run: npx tsc --noEmit
      
      - name: Run Tests
        run: npm test
        env:
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
      
      - name: Build
        run: npm run build
        env:
          DATABASE_URL: \${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: \${{ secrets.NEXTAUTH_SECRET }}
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}

  deploy:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to Production
        run: echo "Add your deployment step here (Vercel, Railway, etc.)"
`;

      writeProjectFile(".github/workflows/ci.yml", ciPipeline);
      results.filesGenerated++;

      await prisma.agentReport.create({
        data: {
          agentName: "DevOpsAgent",
          taskType: "DEVOPS_CHECK",
          severity: "INFO",
          category: "devops-cicd",
          file: ".github/workflows/ci.yml",
          message: "Generated GitHub Actions CI/CD pipeline",
          suggestion: "Add secrets: DATABASE_URL, NEXTAUTH_SECRET, GEMINI_API_KEY to GitHub repository",
          autoFixed: true,
        },
      });

      console.log(`[DevOpsAgent] 🔧 GitHub Actions CI/CD generated!`);
    }

    // 3. Check for audit vulnerabilities
    try {
      execSync("npm audit --json > /dev/null 2>&1", { cwd: process.cwd(), stdio: "pipe" });
    } catch {
      await prisma.agentReport.create({
        data: {
          agentName: "DevOpsAgent",
          taskType: "DEVOPS_CHECK",
          severity: "WARNING",
          category: "devops-security",
          message: "npm audit detected vulnerabilities",
          suggestion: "Run: npm audit fix",
          autoFixed: false,
        },
      });
      results.issuesFound++;
    }

    results.checksRun++;
    console.log(`[DevOpsAgent] ✅ DevOps check: ${results.checksRun} checks, ${results.issuesFound} issues, ${results.filesGenerated} files generated.`);
    return results;
  }
}
