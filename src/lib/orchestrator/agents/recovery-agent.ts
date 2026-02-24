/**
 * 🔄 SUPREME ORCHESTRATOR — Recovery & Self-Healing Agent
 * Layer 5: Recovery & Self-Healing
 *
 * The Watchdog. Responsible for:
 * - Detecting agents that have missed their heartbeat (gone OFFLINE)
 * - Re-queuing tasks that were stuck IN_PROGRESS on a dead agent
 * - Logging recovery incidents to the SecurityLog
 */

import { BaseAgent } from "./base-agent";
import { markOfflineAgents } from "../core";
import type { AgentTaskRecord as AgentTask } from "../types";

import prisma from "../prisma";

// If a task has been IN_PROGRESS for more than 5 minutes, consider it stuck
const STUCK_TASK_TIMEOUT_MS = 5 * 60 * 1000;

export class RecoveryAgent extends BaseAgent {
  constructor() {
    super("RecoveryAgent", "RECOVERY");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "RECOVERY_CHECK":
        return this.runRecoveryCheck();
      default:
        return { message: `RecoveryAgent: unhandled task type ${task.type}` };
    }
  }

  private async runRecoveryCheck() {
    console.log(`[RecoveryAgent] 🔄 Running system recovery check...`);
    const results = {
      offlineAgentsFound: 0,
      stuckTasksRequeued: 0,
      timestamp: new Date().toISOString(),
    };

    // 1. Mark agents that missed their heartbeat as OFFLINE
    const offlineAgents = await markOfflineAgents();
    results.offlineAgentsFound = offlineAgents.length;

    if (offlineAgents.length > 0) {
      for (const agent of offlineAgents) {
        await prisma.securityLog.create({
          data: {
            level: "WARN",
            event: "AGENT_OFFLINE_DETECTED",
            details: JSON.stringify({
              agentName: agent.name,
              agentType: agent.type,
              lastSeen: agent.lastHeartbeat,
            }),
            ip: "ORCHESTRATOR",
          },
        });
        console.log(`[RecoveryAgent] ⚠️  Agent offline: ${agent.name}. Logged incident.`);
      }
    }

    // 2. Find tasks stuck IN_PROGRESS for too long (orphaned tasks from crashed agents)
    const stuckThreshold = new Date(Date.now() - STUCK_TASK_TIMEOUT_MS);
    const stuckTasks = await prisma.agentTask.findMany({
      where: {
        status: "IN_PROGRESS",
        startedAt: { lt: stuckThreshold },
      },
    });

    for (const task of stuckTasks) {
      // Re-queue by resetting status to PENDING
      await prisma.agentTask.update({
        where: { id: task.id },
        data: {
          status: "PENDING",
          assignedToId: null,
          startedAt: null,
          retryCount: { increment: 1 },
          error: "Task was orphaned due to agent failure. Re-queued by RecoveryAgent.",
        },
      });
      results.stuckTasksRequeued++;
      console.log(`[RecoveryAgent] ♻️  Re-queued orphaned task: ${task.type} (${task.id})`);
    }

    console.log(
      `[RecoveryAgent] ✅ Recovery check complete: ${results.offlineAgentsFound} agents offline, ${results.stuckTasksRequeued} tasks re-queued.`
    );
    return results;
  }
}
