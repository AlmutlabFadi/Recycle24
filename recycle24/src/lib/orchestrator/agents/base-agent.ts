/**
 * 🤖 SUPREME ORCHESTRATOR — Base Agent (Abstract)
 * Layer 2: Agent Execution Layer
 *
 * All agents inherit from this class. Provides:
 * - The polling loop (Event Loop for checking tasks)
 * - Heartbeat reporting
 * - Error handling and self-recovery
 */

import { heartbeat, registerAgent, setAgentStatus } from "../core";
import { dequeueTask, completeTask, failTask } from "../queue";
import type { AgentType } from "../core";
import type { AgentTaskRecord as AgentTask } from "../types";

const POLL_INTERVAL_MS = 5000; // 5 seconds
const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds

export abstract class BaseAgent {
  protected agentId: string | null = null;
  protected name: string;
  protected type: AgentType;
  private isRunning = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(name: string, type: AgentType) {
    this.name = name;
    this.type = type;
  }

  // --- Abstract: Each agent implements its own task execution logic ---
  abstract handleTask(task: AgentTask): Promise<unknown>;

  // --- Start the agent's main event loop ---
  async start() {
    console.log(`[${this.name}] 🚀 Starting...`);

    const agent = await registerAgent(this.name, this.type);
    this.agentId = agent.id;
    this.isRunning = true;

    // Start heartbeat reporter
    this.heartbeatTimer = setInterval(async () => {
      if (this.agentId) {
        await heartbeat(this.agentId);
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Start the polling loop
    this.runLoop();

    console.log(`[${this.name}] ✅ Online and polling for tasks every ${POLL_INTERVAL_MS / 1000}s`);
  }

  // --- Stop the agent gracefully ---
  async stop() {
    console.log(`[${this.name}] 🛑 Shutting down...`);
    this.isRunning = false;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    if (this.agentId) {
      await setAgentStatus(this.agentId, "OFFLINE");
    }
  }

  // --- The Core Polling Loop ---
  private async runLoop() {
    while (this.isRunning) {
      await this.pollAndExecute();
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  // --- Poll the queue and execute the next available task ---
  private async pollAndExecute() {
    if (!this.agentId) return;

    try {
      const task = await dequeueTask(this.agentId, this.name);
      if (!task) return; // No tasks available, go back to sleep

      console.log(`[${this.name}] 🎯 Executing task: ${task.type} (${task.id})`);
      await setAgentStatus(this.agentId, "WORKING");

      const result = await this.handleTask(task);

      await completeTask(task.id, result);
      await setAgentStatus(this.agentId, "IDLE");
      console.log(`[${this.name}] ✅ Task done: ${task.type}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[${this.name}] ❌ Task error: ${error}`);

      // Agent stays IDLE after an error; failTask handles re-queuing
      if (this.agentId) {
        await setAgentStatus(this.agentId, "IDLE");
      }
    }
  }
}
