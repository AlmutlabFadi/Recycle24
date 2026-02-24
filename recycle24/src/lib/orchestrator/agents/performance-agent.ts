/**
 * 📊 SUPREME ORCHESTRATOR — Performance Monitor Agent
 * Layer 4: Performance Monitoring
 *
 * Monitors the system health from the Orchestrator's perspective:
 * - Queue depth and throughput
 * - Agent availability
 * - Logs critical bottlenecks
 */

import { BaseAgent } from "./base-agent";
import { getSystemStatus } from "../core";
import type { AgentTaskRecord as AgentTask } from "../types";

import prisma from "../prisma";

// Thresholds
const QUEUE_BACKLOG_WARN_THRESHOLD = 20;
const OFFLINE_AGENT_WARN_THRESHOLD = 1;

export class PerformanceAgent extends BaseAgent {
  constructor() {
    super("PerformanceAgent", "PERFORMANCE");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "SYSTEM_HEALTH_CHECK":
        return this.runHealthCheck();
      case "PERFORMANCE_AUDIT":
        return this.runAudit();
      default:
        return { message: `PerformanceAgent: unhandled task type ${task.type}` };
    }
  }

  private async runHealthCheck() {
    console.log(`[PerformanceAgent] 📊 Running system health check...`);

    const status = await getSystemStatus();
    const { queue, summary } = status;

    let level: "INFO" | "WARN" | "CRITICAL" = "INFO";
    const issues: string[] = [];

    // Check queue depth
    if (queue.pending > QUEUE_BACKLOG_WARN_THRESHOLD) {
      level = "WARN";
      issues.push(`High task queue depth: ${queue.pending} pending tasks.`);
    }

    // Check agent availability
    if (summary.offlineAgents >= OFFLINE_AGENT_WARN_THRESHOLD) {
      level = summary.offlineAgents >= 2 ? "CRITICAL" : "WARN";
      issues.push(`${summary.offlineAgents} agent(s) are OFFLINE.`);
    }

    // Check for stuck tasks
    if (queue.inProgress > summary.onlineAgents * 3) {
      level = "WARN";
      issues.push(
        `High in-progress task count (${queue.inProgress}) vs online agents (${summary.onlineAgents}).`
      );
    }

    if (issues.length > 0) {
      await prisma.securityLog.create({
        data: {
          level,
          event: "PERFORMANCE_ALERT",
          details: JSON.stringify({ issues, status: { queue, summary } }),
          ip: "ORCHESTRATOR",
        },
      });
      console.log(`[PerformanceAgent] ⚠️  Alert [${level}]: ${issues.join(" | ")}`);
    } else {
      console.log(`[PerformanceAgent] ✅ System health is NOMINAL.`);
    }

    return { level, issues, queue, summary };
  }

  private async runAudit() {
    console.log(`[PerformanceAgent] 🔎 Running full performance audit...`);
    const status = await getSystemStatus();

    // For more detailed metrics we could add process.memoryUsage() or os module checks
    return {
      auditedAt: new Date().toISOString(),
      systemStatus: status,
    };
  }
}
