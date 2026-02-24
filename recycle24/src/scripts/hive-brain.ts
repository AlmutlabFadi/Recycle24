/**
 * 🧠 HIVE BRAIN — Supreme Orchestrator Runner v3.0
 *
 * 20 autonomous AI agents running in parallel:
 * - 4 Infrastructure agents (monitoring & recovery)
 * - 4 Business Logic agents (auctions, wallets, accounts, alerts)
 * - 12 AI Development agents (powered by Gemini — write, build, audit, deploy)
 *
 * Usage: npm run orchestrator
 */

import { TaskManagerAgent } from "@/lib/orchestrator/agents/task-manager";
import { SecurityAgent } from "@/lib/orchestrator/agents/security-agent";
import { RecoveryAgent } from "@/lib/orchestrator/agents/recovery-agent";
import { PerformanceAgent } from "@/lib/orchestrator/agents/performance-agent";
// Business Logic Layer
import { AuctionAgent } from "@/lib/orchestrator/agents/auction-agent";
import { AccountLockAgent } from "@/lib/orchestrator/agents/account-lock-agent";
import { WalletCleanupAgent } from "@/lib/orchestrator/agents/wallet-cleanup-agent";
import { PriceAlertAgent } from "@/lib/orchestrator/agents/price-alert-agent";
// AI Development Layer — Phase 1
import { CodeReviewAgent } from "@/lib/orchestrator/agents/code-review-agent";
import { DatabaseAgent } from "@/lib/orchestrator/agents/database-agent";
import { APIAgent } from "@/lib/orchestrator/agents/api-agent";
import { BackendAgent } from "@/lib/orchestrator/agents/backend-agent";
// AI Development Layer — Phase 2
import { FrontendAgent } from "@/lib/orchestrator/agents/frontend-agent";
import { UIUXAgent } from "@/lib/orchestrator/agents/uiux-agent";
import { QAAgent } from "@/lib/orchestrator/agents/qa-agent";
import { DashboardAgent } from "@/lib/orchestrator/agents/dashboard-agent";
// AI Development Layer — Phase 3
import { DevOpsAgent } from "@/lib/orchestrator/agents/devops-agent";
import { AIReviewAgent } from "@/lib/orchestrator/agents/ai-review-agent";
import { QualityGateAgent } from "@/lib/orchestrator/agents/quality-gate-agent";
import { getSystemStatus } from "@/lib/orchestrator/core";

const ASCII_BANNER = `
╔══════════════════════════════════════════════════════════════════╗
║     🧠  SUPREME ORCHESTRATOR — HIVE BRAIN v3.0                  ║
║     Metalix24 / Recycle24  ·  20 Autonomous AI Agents           ║
║     🛡️ Infrastructure  💼 Business  🤖 AI Development           ║
╚══════════════════════════════════════════════════════════════════╝
`;

async function bootstrap() {
  console.log(ASCII_BANNER);
  console.log(`[HIVE] 🕐 ${new Date().toISOString()}`);
  console.log(`[HIVE] 🚀 Spawning 20 agents...`);

  const agents = [
    // 🛡️ Layer 1: Infrastructure
    new TaskManagerAgent(),
    new SecurityAgent(),
    new RecoveryAgent(),
    new PerformanceAgent(),
    // 💼 Layer 2: Business Logic
    new AuctionAgent(),
    new AccountLockAgent(),
    new WalletCleanupAgent(),
    new PriceAlertAgent(),
    // 🤖 Layer 3: AI Development — Phase 1 (Analysis)
    new CodeReviewAgent(),
    new DatabaseAgent(),
    new APIAgent(),
    new BackendAgent(),
    // 🎨 Layer 4: AI Development — Phase 2 (Frontend & Quality)
    new FrontendAgent(),
    new UIUXAgent(),
    new QAAgent(),
    new DashboardAgent(),
    // 🚀 Layer 5: AI Development — Phase 3 (DevOps & Intelligence)
    new DevOpsAgent(),
    new AIReviewAgent(),
    new QualityGateAgent(),
  ];

  // Start agents SEQUENTIALLY to avoid overwhelming SQLite with 20 simultaneous connections
  for (const agent of agents) {
    await agent.start();
    await new Promise((r) => setTimeout(r, 100)); // 100ms spacing between registrations
  }


  console.log(`\n[HIVE] ✅ All ${agents.length} agents are ONLINE.\n`);
  console.log(`[HIVE] 🛡️  Infrastructure: TaskManager | Security | Recovery | Performance`);
  console.log(`[HIVE] 💼 Business:        Auction | AccountLock | WalletCleanup | PriceAlert`);
  console.log(`[HIVE] 🤖 AI Dev P1:      CodeReview | Database | API | Backend`);
  console.log(`[HIVE] 🎨 AI Dev P2:      Frontend | UIUX | QA | Dashboard`);
  console.log(`[HIVE] 🚀 AI Dev P3:      DevOps | AIReview | QualityGate\n`);

  try {
    const status = await getSystemStatus();
    console.log(`[HIVE] 📊 System Status:`, JSON.stringify(status.summary, null, 2));
  } catch (e) {
    console.warn(`[HIVE] Could not fetch status:`, e);
  }

  const shutdown = async (signal: string) => {
    console.log(`\n[HIVE] 🛑 ${signal} received — shutting down all ${agents.length} agents...`);
    await Promise.all(agents.map((a) => a.stop()));
    console.log(`[HIVE] ✅ All agents stopped. Hive Brain v3.0 exiting.`);
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  console.log(`[HIVE] 💓 Hive Brain v3.0 running — 20 agents active. Press Ctrl+C to stop.`);
  setInterval(() => {}, 60 * 60 * 1000);
}

bootstrap().catch((err) => {
  console.error(`[HIVE] 💥 FATAL:`, err);
  process.exit(1);
});
