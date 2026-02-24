/**
 * 📋 SUPREME ORCHESTRATOR — Task Manager Agent
 * Layer 2: Agent Execution Layer
 *
 * The dispatcher. Responsible for:
 * - Scheduling periodic system-wide tasks (like health checks, scans)
 * - Routing tasks to specialized agents via the Queue
 */

import { BaseAgent } from "./base-agent";
import { enqueueTask, getQueueStats } from "../queue";
import type { AgentTaskRecord as AgentTask } from "../types";

const SCHEDULE_INTERVAL_MS = 60 * 1000; // 1 minute

export class TaskManagerAgent extends BaseAgent {
  private schedulerTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super("TaskManagerAgent", "TASK_MANAGER");
  }

  override async start() {
    await super.start();
    this.startScheduler();
  }

  override async stop() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
    }
    await super.stop();
  }

  // Periodically enqueue system-wide tasks
  private startScheduler() {
    console.log(`[TaskManagerAgent] 📅 Scheduler started. Enqueuing initial tasks...`);
    this.runScheduledTasks(); // Run immediately on start

    this.schedulerTimer = setInterval(() => {
      this.runScheduledTasks();
    }, SCHEDULE_INTERVAL_MS);
  }

  private async runScheduledTasks() {
    const stats = await getQueueStats();

    // Don't flood the queue if there's already a backlog
    if (stats.pending > 15) {
      console.log(`[TaskManagerAgent] ⏳ Queue has ${stats.pending} pending tasks. Skipping scheduling.`);
      return;
    }

    console.log(`[TaskManagerAgent] 📤 Scheduling routine tasks...`);
    await Promise.allSettled([
      // 🛡️ Monitoring tasks
      enqueueTask("SECURITY_SCAN", { trigger: "scheduled" }, 5),
      enqueueTask("SYSTEM_HEALTH_CHECK", { trigger: "scheduled" }, 3),
      enqueueTask("RECOVERY_CHECK", { trigger: "scheduled" }, 8),
      // 💼 Business logic tasks (highest priority)
      enqueueTask("AUCTION_CLOSE", { trigger: "scheduled" }, 9),
      enqueueTask("AUCTION_START", { trigger: "scheduled" }, 9),
      enqueueTask("ACCOUNT_SECURITY_AUDIT", { trigger: "scheduled" }, 7),
      enqueueTask("PRICE_ALERT_CHECK", { trigger: "scheduled" }, 4),
      enqueueTask("WALLET_CLEANUP", { trigger: "scheduled" }, 2),
      // 🤖 AI Development tasks (medium priority — run continuously in background)
      enqueueTask("CODE_REVIEW", { trigger: "scheduled" }, 3),
      enqueueTask("DB_AUDIT", { trigger: "scheduled" }, 4),
      enqueueTask("API_AUDIT", { trigger: "scheduled" }, 4),
      enqueueTask("BACKEND_AUDIT", { trigger: "scheduled" }, 3),
      enqueueTask("FRONTEND_AUDIT", { trigger: "scheduled" }, 2),
      enqueueTask("UX_AUDIT", { trigger: "scheduled" }, 2),
      enqueueTask("RUN_TESTS", { trigger: "scheduled" }, 2),
      enqueueTask("DASHBOARD_AUDIT", { trigger: "scheduled" }, 2),
      enqueueTask("DEVOPS_CHECK", { trigger: "scheduled" }, 3),
      enqueueTask("AI_REVIEW", { trigger: "scheduled" }, 2),
      enqueueTask("QUALITY_GATE", { trigger: "scheduled" }, 6), // quality gate = higher priority
    ]);
  }


  // Handle tasks specifically assigned to the Task Manager
  async handleTask(task: AgentTask): Promise<unknown> {
    const payload = task.payload ? JSON.parse(task.payload) : {};

    switch (task.type) {
      case "CLEANUP":
        return this.handleCleanup(payload);
      default:
        return { message: `TaskManager: task type ${task.type} acknowledged.` };
    }
  }

  private async handleCleanup(payload: Record<string, unknown>) {
    console.log(`[TaskManagerAgent] 🗑️  Running cleanup...`, payload);
    // Future: Clean up old/completed tasks from the DB periodically
    return { cleaned: true, timestamp: new Date().toISOString() };
  }
}
