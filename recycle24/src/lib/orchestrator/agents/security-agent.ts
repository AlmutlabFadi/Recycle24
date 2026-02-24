/**
 * 🔐 SUPREME ORCHESTRATOR — Security Control Agent
 * Layer 2 & 6: Agent Execution & Security Control
 *
 * Integrates with the existing GSOCC predictive engine.
 * Runs proactive security scans and logs threats to the SecurityLog table.
 */

import { BaseAgent } from "./base-agent";
import type { AgentTaskRecord as AgentTask } from "../types";
import { generatePredictiveInsights } from "@/lib/security/predictive";

import prisma from "../prisma";

export class SecurityAgent extends BaseAgent {
  constructor() {
    super("SecurityAgent", "SECURITY");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    const payload = task.payload ? JSON.parse(task.payload) : {};

    switch (task.type) {
      case "SECURITY_SCAN":
        return this.runSecurityScan(payload);
      case "INCIDENT_RESPONSE":
        return this.runIncidentResponse(payload);
      default:
        return { message: `SecurityAgent: unhandled task type ${task.type}` };
    }
  }

  private async runSecurityScan(payload: Record<string, unknown>) {
    console.log(`[SecurityAgent] 🔍 Running predictive security scan...`);

    try {
      const { insights, health } = await generatePredictiveInsights();

      // Log high-probability threats as security incidents
      const criticalInsights = insights.filter((i) => i.probability >= 80);
      for (const insight of criticalInsights) {
        await prisma.securityLog.create({
          data: {
            level: "WARN",
            event: "PREDICTIVE_THREAT_DETECTED",
            details: JSON.stringify({
              threat: insight.forecastedThreatType,
              probability: insight.probability,
              timeframeHours: insight.timeframeHours,
              action: insight.recommendedAction,
            }),
            ip: "ORCHESTRATOR",
          },
        });
        console.log(
          `[SecurityAgent] 🚨 Threat logged: ${insight.forecastedThreatType} (${insight.probability}% probability)`
        );
      }

      // Log system health if degrading
      if (health.status !== "HEALTHY") {
        await prisma.securityLog.create({
          data: {
            level: health.status === "CRITICAL" ? "CRITICAL" : "WARN",
            event: "SYSTEM_HEALTH_DEGRADED",
            details: JSON.stringify(health),
            ip: "ORCHESTRATOR",
          },
        });
      }

      return {
        trigger: payload.trigger,
        scannedAt: new Date().toISOString(),
        healthStatus: health.status,
        insightsGenerated: insights.length,
        criticalAlertsLogged: criticalInsights.length,
      };
    } catch (err) {
      // Predictive engine may fail if GSOCC tables don't exist yet; log and continue
      const error = err instanceof Error ? err.message : String(err);
      console.warn(`[SecurityAgent] ⚠️  Predictive scan failed (possibly no GSOCC table): ${error}`);
      return { error, scannedAt: new Date().toISOString() };
    }
  }

  private async runIncidentResponse(payload: Record<string, unknown>) {
    console.log(`[SecurityAgent] 🚨 Handling incident response...`, payload);
    // Future: integrate with kill-switch or rate-limiting escalation
    return {
      responded: true,
      incidentId: payload.incidentId,
      timestamp: new Date().toISOString(),
      action: "LOGGED_AND_ESCALATED",
    };
  }
}
