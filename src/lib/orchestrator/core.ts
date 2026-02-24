/**
 * 🧠 SUPREME ORCHESTRATOR — Hive Brain Core
 * Layer 1: Orchestrator Core
 *
 * The central control center. Manages agent registration, heartbeats,
 * and overall system health. This is the "consciousness" of the hive.
 */

import orchestratorPrisma from "./prisma";
import { getQueueStats } from "./queue";

const prisma = orchestratorPrisma;


// An agent is considered OFFLINE if no heartbeat in the last 2 minutes
const HEARTBEAT_TIMEOUT_MS = 2 * 60 * 1000;

export type AgentType =
  | "TASK_MANAGER"
  | "SECURITY"
  | "RECOVERY"
  | "PERFORMANCE";

// --- SQLite Retry Wrapper ---
// SQLite only allows one writer at a time. This helper automatically retries
// database operations if a timeout (P1008 / lock) occurs.
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 5, baseDelay = 1000): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      if (error?.code === "P1008" || error?.message?.includes("timed out")) {
        attempt++;
        const delay = baseDelay * Math.pow(1.5, attempt) + Math.random() * 500;
        console.warn(`[CORE] ⏳ SQLite busy (attempt ${attempt}/${maxRetries}). Retrying in ${Math.round(delay)}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }
  return await operation(); // Final attempt, will throw if it fails again
}

// --- Register an Agent with the Hive ---
export async function registerAgent(name: string, type: AgentType) {
  const agent = await withRetry(() =>
    prisma.agent.upsert({
      where: { name },
      update: {
        status: "IDLE",
        lastHeartbeat: new Date(),
      },
      create: {
        name,
        type,
        status: "IDLE",
        lastHeartbeat: new Date(),
      },
    })
  );
  console.log(`[CORE] 🤖 Agent registered: [${type}] ${name} (ID: ${agent.id})`);
  return agent;
}

// --- Beat: Update agent heartbeat to signal it's alive ---
export async function heartbeat(agentId: string) {
  return withRetry(() =>
    prisma.agent.update({
      where: { id: agentId },
      data: { lastHeartbeat: new Date() },
    })
  );
}

// --- Update Agent Status ---
export async function setAgentStatus(
  agentId: string,
  status: "IDLE" | "WORKING" | "OFFLINE" | "FAILED"
) {
  return withRetry(() =>
    prisma.agent.update({
      where: { id: agentId },
      data: { status },
    })
  );
}

// --- Get all registered agents ---
export async function getAllAgents() {
  return prisma.agent.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      tasks: {
        where: { status: "IN_PROGRESS" },
        take: 5,
      },
    },
  });
}

// --- GSOCC System Status Report ---
export async function getSystemStatus() {
  const agents = await getAllAgents();
  const queueStats = await getQueueStats();
  const now = new Date();

  const enrichedAgents = agents.map((agent) => {
    const timeSinceHeartbeat = now.getTime() - agent.lastHeartbeat.getTime();
    const isOnline = timeSinceHeartbeat < HEARTBEAT_TIMEOUT_MS;
    return {
      ...agent,
      isOnline,
      timeSinceHeartbeat: Math.floor(timeSinceHeartbeat / 1000),
    };
  });

  return {
    timestamp: now.toISOString(),
    agents: enrichedAgents,
    queue: queueStats,
    summary: {
      totalAgents: agents.length,
      onlineAgents: enrichedAgents.filter((a) => a.isOnline).length,
      offlineAgents: enrichedAgents.filter((a) => !a.isOnline).length,
    },
  };
}

// --- Find agents that have gone OFFLINE (missed heartbeat) ---
export async function detectOfflineAgents() {
  const threshold = new Date(Date.now() - HEARTBEAT_TIMEOUT_MS);
  return prisma.agent.findMany({
    where: {
      lastHeartbeat: { lt: threshold },
      status: { not: "OFFLINE" },
    },
  });
}

// --- Mark stale agents as OFFLINE ---
export async function markOfflineAgents() {
  const offline = await detectOfflineAgents();
  for (const agent of offline) {
    await prisma.agent.update({
      where: { id: agent.id },
      data: { status: "OFFLINE" },
    });
    console.log(`[CORE] ⚠️  Agent went OFFLINE: ${agent.name}`);
  }
  return offline;
}
