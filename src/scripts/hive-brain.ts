/**
 * 🧠 HIVE BRAIN — Supreme Orchestrator Runner v3.0
 *
 * Agents are started sequentially to avoid overwhelming SQLite connections.
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

type Agent = { start(): Promise<void>; stop(): Promise<void>; constructor: { name: string } };

const ASCII_BANNER = `
╔══════════════════════════════════════════════════════════════════╗
║     🧠  SUPREME ORCHESTRATOR — HIVE BRAIN v3.0                  ║
║     Metalix24 / Recycle24  ·  Autonomous AI Agents              ║
║     🛡️ Infrastructure  💼 Business  🤖 AI Development           ║
╚══════════════════════════════════════════════════════════════════╝
`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function bootstrap() {
  console.log(ASCII_BANNER);
  console.log(`[HIVE] 🕐 ${new Date().toISOString()}`);

  const agents: Agent[] = [
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

    // 🤖 Layer 3: AI Development — Phase 1
    new CodeReviewAgent(),
    new DatabaseAgent(),
    new APIAgent(),
    new BackendAgent(),

    // 🎨 Layer 4: AI Development — Phase 2
    new FrontendAgent(),
    new UIUXAgent(),
    new QAAgent(),
    new DashboardAgent(),

    // 🚀 Layer 5: AI Development — Phase 3
    new DevOpsAgent(),
    new AIReviewAgent(),
    new QualityGateAgent(),
  ];

  console.log(`[HIVE] 🚀 Spawning ${agents.length} agents...`);

  // Start agents SEQUENTIALLY to avoid overwhelming SQLite with simultaneous connections
  for (const agent of agents) {
    await agent.start();
    await sleep(100);
  }

  console.log(`\n[HIVE] ✅ All ${agents.length} agents are ONLINE.\n`);

  try {
    const status = await getSystemStatus();
    console.log(`[HIVE] 📊 System Status:`, JSON.stringify(status.summary, null, 2));
  } catch (e) {
    console.warn(`[HIVE] Could not fetch status:`, e);
  }

  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\n[HIVE] 🛑 ${signal} received — shutting down all ${agents.length} agents...`);

    const results = await Promise.allSettled(agents.map((a) => a.stop()));
    const failed = results
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => r.status === "rejected")
      .map(({ r, i }) => ({
        agent: agents[i]?.constructor?.name ?? `Agent#${i}`,
        error: (r as PromiseRejectedResult).reason,
      }));

    if (failed.length) {
      console.error(`[HIVE] ⚠️ Some agents failed to stop:`, failed);
    } else {
      console.log(`[HIVE] ✅ All agents stopped cleanly.`);
    }

    process.exit(failed.length ? 1 : 0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    console.error("[HIVE] 💥 unhandledRejection:", reason);
  });

  process.on("uncaughtException", (err) => {
    console.error("[HIVE] 💥 uncaughtException:", err);
  });

  console.log(`[HIVE] 💓 Hive Brain v3.0 running — ${agents.length} agents active. Press Ctrl+C to stop.`);

  // Health tick بدل noop keep-alive
  setInterval(async () => {
    try {
      const status = await getSystemStatus();
      console.log(`[HIVE] ❤️ Health:`, JSON.stringify(status.summary));
    } catch (e) {
      console.warn(`[HIVE] ❤️ Health check failed:`, e);
    }
  }, 60_000);
}

bootstrap().catch((err) => {
  console.error(`[HIVE] 💥 FATAL:`, err);
  process.exit(1);
});