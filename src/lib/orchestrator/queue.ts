/**
 * 📬 SUPREME ORCHESTRATOR — Database-Backed Message Queue
 * Layer 3: Communication Bus
 *
 * This module provides a persistent, DB-backed task queue using Prisma.
 * It replaces the need for external services like RabbitMQ or Redis
 * in the project's current infrastructure phase.
 */

import orchestratorPrisma from "./prisma";

const prisma = orchestratorPrisma;

import type { TaskType, TaskStatus, TaskPayload } from "./types";
export type { TaskType } from "./types";

// --- SQLite Retry Wrapper ---
// SQLite only allows one writer at a time. Retry on P1008 / lock timeout.
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 5, baseDelay = 800): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      if (error?.code === "P1008" || error?.message?.includes("timed out")) {
        attempt++;
        const delay = baseDelay * Math.pow(1.5, attempt) + Math.random() * 500;
        await new Promise((r) => setTimeout(r, Math.round(delay)));
      } else {
        throw error;
      }
    }
  }
  return await operation();
}

// --- Enqueue: Add a new task to the queue ---
export async function enqueueTask(
  type: TaskType,
  payload: TaskPayload = {},
  priority: number = 0,
  maxRetries: number = 3
) {
  const task = await withRetry(() =>
    prisma.agentTask.create({
      data: {
        type,
        priority,
        status: "PENDING",
        payload: JSON.stringify(payload),
        maxRetries,
      },
    })
  );
  console.log(`[QUEUE] ✅ Task enqueued: ${type} (ID: ${task.id})`);
  return task;
}

// --- Agent Task Routing Map ---
// Ensures agents only claim tasks they are designed to handle
const AGENT_TASK_ROUTING: Record<string, TaskType[]> = {
  TaskManagerAgent: ["CLEANUP"],
  SecurityAgent: ["SECURITY_SCAN", "INCIDENT_RESPONSE"],
  RecoveryAgent: ["RECOVERY_CHECK", "SYSTEM_HEALTH_CHECK"],
  PerformanceAgent: ["PERFORMANCE_AUDIT"],
  AuctionAgent: ["AUCTION_CLOSE", "AUCTION_START"],
  AccountLockAgent: ["ACCOUNT_SECURITY_AUDIT"],
  WalletCleanupAgent: ["WALLET_CLEANUP"],
  PriceAlertAgent: ["PRICE_ALERT_CHECK"],
  CodeReviewAgent: ["CODE_REVIEW"],
  DatabaseAgent: ["DB_AUDIT"],
  APIAgent: ["API_AUDIT"],
  BackendAgent: ["BACKEND_AUDIT"],
  FrontendAgent: ["FRONTEND_AUDIT"],
  UIUXAgent: ["UX_AUDIT"],
  QAAgent: ["RUN_TESTS"],
  DashboardAgent: ["DASHBOARD_AUDIT"],
  DevOpsAgent: ["DEVOPS_CHECK"],
  AIReviewAgent: ["AI_REVIEW"],
  QualityGateAgent: ["QUALITY_GATE"],
};

// --- Dequeue: Claim the next available pending task ---
export async function dequeueTask(agentId: string, agentName: string) {
  const allowedTasks = AGENT_TASK_ROUTING[agentName];
  if (!allowedTasks || allowedTasks.length === 0) return null;

  // Atomically find the highest priority pending task and claim it
  const task = await withRetry(() =>
    prisma.agentTask.findFirst({
      where: {
        status: "PENDING",
        type: { in: allowedTasks },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    })
  );

  if (!task) return null;

  // Mark it as IN_PROGRESS — another agent may have claimed it first (race condition)
  try {
    const claimedTask = await withRetry(() =>
      prisma.agentTask.update({
        where: { id: task.id, status: "PENDING" }, // Optimistic lock
        data: {
          status: "IN_PROGRESS",
          assignedToId: agentId,
          startedAt: new Date(),
        },
      })
    );
    console.log(`[QUEUE] 🔄 Task claimed: ${claimedTask.type} by Agent ${agentId}`);
    return claimedTask;
  } catch {
    // Another agent claimed this task first — this is expected in concurrent execution
    return null;
  }
}

// --- Complete: Mark a task as successfully done ---
export async function completeTask(taskId: string, result: unknown = {}) {
  const task = await withRetry(() =>
    prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        result: JSON.stringify(result),
        completedAt: new Date(),
      },
    })
  );
  console.log(`[QUEUE] ✔️  Task completed: ${taskId}`);
  return task;
}

// --- Fail: Mark a task as failed and handle retries ---
export async function failTask(taskId: string, error: string) {
  const task = await withRetry(() =>
    prisma.agentTask.findUnique({ where: { id: taskId } })
  );
  if (!task) return null;

  const canRetry = task.retryCount < task.maxRetries;

  const updated = await withRetry(() =>
    prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: canRetry ? "PENDING" : "FAILED",
        retryCount: task.retryCount + 1,
        error,
        assignedToId: canRetry ? null : task.assignedToId,
        startedAt: canRetry ? null : task.startedAt,
      },
    })
  );

  if (canRetry) {
    console.log(
      `[QUEUE] ♻️  Task ${taskId} re-queued for retry (${updated.retryCount}/${task.maxRetries})`
    );
  } else {
    console.log(`[QUEUE] ❌ Task ${taskId} permanently failed after ${task.maxRetries} retries.`);
  }
  return updated;
}

// --- Get Queue Stats ---
export async function getQueueStats() {
  const [pending, inProgress, completed, failed] = await Promise.all([
    withRetry(() => prisma.agentTask.count({ where: { status: "PENDING" } })),
    withRetry(() => prisma.agentTask.count({ where: { status: "IN_PROGRESS" } })),
    withRetry(() => prisma.agentTask.count({ where: { status: "COMPLETED" } })),
    withRetry(() => prisma.agentTask.count({ where: { status: "FAILED" } })),
  ]);
  return { pending, inProgress, completed, failed };
}
