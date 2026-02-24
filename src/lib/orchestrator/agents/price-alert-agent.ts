/**
 * 🔔 BUSINESS AGENT — Price Alert Agent
 * 
 * Checks active PriceAlerts and fires notifications when the target
 * price condition is met. Uses SecurityLog as notification channel for now
 * (can be extended to Telegram/WhatsApp/Email).
 * 
 * Visible Effect: PriceAlert.isActive becomes false when triggered.
 * A log entry appears in SecurityLog with notification details.
 */

import { BaseAgent } from "./base-agent";
import type { AgentTaskRecord as AgentTask } from "../types";

import prisma from "../prisma";

// Simulated current metal prices (in SYP per kg)
// In production, these would be fetched from a live market data API
const CURRENT_PRICES: Record<string, number> = {
  IRON: 12500,
  COPPER: 98000,
  ALUMINUM: 45000,
  PLASTIC: 8500,
  CARDBOARD: 3200,
  BRASS: 75000,
  STEEL: 18000,
  ZINC: 52000,
  MIXED: 15000,
};

export class PriceAlertAgent extends BaseAgent {
  constructor() {
    super("PriceAlertAgent", "TASK_MANAGER");
  }

  async handleTask(task: AgentTask): Promise<unknown> {
    switch (task.type) {
      case "PRICE_ALERT_CHECK":
        return this.checkPriceAlerts();
      default:
        return { message: `PriceAlertAgent: unhandled task type ${task.type}` };
    }
  }

  private async checkPriceAlerts() {
    console.log(`[PriceAlertAgent] 📈 Checking price alerts...`);

    const activeAlerts = await prisma.priceAlert.findMany({
      where: { isActive: true },
      include: {
        user: { select: { id: true, email: true, phone: true, name: true } },
      },
    });

    const results = {
      checkedAlerts: activeAlerts.length,
      triggeredAlerts: 0,
      timestamp: new Date().toISOString(),
    };

    for (const alert of activeAlerts) {
      const currentPrice = CURRENT_PRICES[alert.metal];
      if (!currentPrice) continue;

      const isTriggered =
        (alert.condition === "ABOVE" && currentPrice >= alert.targetPrice) ||
        (alert.condition === "BELOW" && currentPrice <= alert.targetPrice);

      if (!isTriggered) continue;

      // Deactivate the alert (prevent re-triggering)
      await prisma.priceAlert.update({
        where: { id: alert.id },
        data: { isActive: false },
      });

      // Log notification (can be extended to actual push/SMS/email)
      await prisma.securityLog.create({
        data: {
          level: "INFO",
          event: "ADMIN_ACTION",
          userId: alert.userId,
          details: JSON.stringify({
            action: "PRICE_ALERT_TRIGGERED",
            alertId: alert.id,
            metal: alert.metal,
            condition: alert.condition,
            targetPrice: alert.targetPrice,
            currentPrice,
            notifiedUser: alert.user.email || alert.user.phone,
            message: `🔔 تنبيه سعر: ${alert.metal} وصل إلى ${currentPrice.toLocaleString()} ل.س (هدفك: ${alert.targetPrice.toLocaleString()} ل.س)`,
          }),
          ip: "ORCHESTRATOR",
        },
      });

      results.triggeredAlerts++;
      console.log(
        `[PriceAlertAgent] 🔔 Alert FIRED: ${alert.metal} @ ${currentPrice} (target: ${alert.condition} ${alert.targetPrice}) → User: ${alert.user.email || alert.user.phone}`
      );
    }

    console.log(
      `[PriceAlertAgent] ✅ Checked ${results.checkedAlerts} alerts, triggered ${results.triggeredAlerts}.`
    );

    return results;
  }
}
