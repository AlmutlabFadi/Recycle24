/**
 * 🧩 SUPREME ORCHESTRATOR — Shared Types
 *
 * Defines the core data structures used across the Orchestrator system.
 * These mirror the Prisma models for Agent and AgentTask, providing
 * type safety without a direct dependency on the generated Prisma client,
 * which requires `prisma generate` to be run after schema changes.
 */

export interface AgentRecord {
  id: string;
  name: string;
  type: string;
  status: string;
  lastHeartbeat: Date;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentTaskRecord {
  id: string;
  type: string;
  priority: number;
  status: string;
  payload: string | null;
  result: string | null;
  error: string | null;
  assignedToId: string | null;
  retryCount: number;
  maxRetries: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AgentStatus = "IDLE" | "WORKING" | "OFFLINE" | "FAILED";

export type TaskType =
  | "SECURITY_SCAN"
  | "SYSTEM_HEALTH_CHECK"
  | "RECOVERY_CHECK"
  | "PERFORMANCE_AUDIT"
  | "INCIDENT_RESPONSE"
  | "CLEANUP"
  // Business Logic Tasks
  | "AUCTION_CLOSE"
  | "AUCTION_START"
  | "ACCOUNT_SECURITY_AUDIT"
  | "WALLET_CLEANUP"
  | "PRICE_ALERT_CHECK"
  // AI Development Tasks — Phase 1
  | "CODE_REVIEW"
  | "DB_AUDIT"
  | "API_AUDIT"
  | "BACKEND_AUDIT"
  // AI Development Tasks — Phase 2
  | "FRONTEND_AUDIT"
  | "UX_AUDIT"
  | "RUN_TESTS"
  | "DASHBOARD_AUDIT"
  // AI Development Tasks — Phase 3
  | "DEVOPS_CHECK"
  | "AI_REVIEW"
  | "QUALITY_GATE";

export type TaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface TaskPayload {
  [key: string]: unknown;
}
