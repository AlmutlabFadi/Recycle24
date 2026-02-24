import { db } from "@/lib/db";

export enum SecurityEvent {
  LOGIN = "LOGIN",
  FAILED_LOGIN = "FAILED_LOGIN",
  LOGOUT = "LOGOUT",
  API_ABUSE = "API_ABUSE",
  ADMIN_ACTION = "ADMIN_ACTION",
  SENSITIVE_ACCESS = "SENSITIVE_ACCESS",
  SYSTEM_ERROR = "SYSTEM_ERROR",
  CONTAINMENT_ACTION = "CONTAINMENT_ACTION",
  AUTH_COMPROMISE = "AUTH_COMPROMISE",
}

export enum SecurityLevel {
  INFO = "INFO",
  WARN = "WARN",
  CRITICAL = "CRITICAL",
  AUDIT = "AUDIT",
}

interface LogEntry {
  level: SecurityLevel;
  event: SecurityEvent | string;
  details?: Record<string, unknown>;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export const SecurityLogger = {
  async log(entry: LogEntry) {
    try {
      const timestamp = new Date().toISOString();
      console.log(`[SECURITY][${entry.level}][${entry.event}] ${timestamp}`, entry.details || "");

      await db.securityLog.create({
        data: {
          level: entry.level,
          event: entry.event,
          details: JSON.stringify(entry.details || {}),
          userId: entry.userId,
          ip: entry.ip,
          userAgent: entry.userAgent,
        },
      });

    } catch (error) {
      console.error("Failed to write security log:", error);
    }
  },

  info(event: SecurityEvent | string, details?: Record<string, unknown>, userId?: string, ip?: string) {
    return this.log({ level: SecurityLevel.INFO, event, details, userId, ip });
  },

  warn(event: SecurityEvent | string, details?: Record<string, unknown>, userId?: string, ip?: string) {
    return this.log({ level: SecurityLevel.WARN, event, details, userId, ip });
  },

  critical(event: SecurityEvent | string, details?: Record<string, unknown>, userId?: string, ip?: string) {
    return this.log({ level: SecurityLevel.CRITICAL, event, details, userId, ip });
  },

  audit(event: SecurityEvent | string, details?: Record<string, unknown>, userId?: string, ip?: string) {
    return this.log({ level: SecurityLevel.AUDIT, event, details, userId, ip });
  },
};
