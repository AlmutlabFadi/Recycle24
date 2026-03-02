import { db } from "@/lib/db";
import { JsonValue } from "@prisma/client/runtime/library";

export type NotificationType = "INFO" | "URGENT" | "SUCCESS" | "WARNING";

export class NotificationService {
  /**
   * Create a notification for a user.
   */
  static async create({
    userId,
    title,
    message,
    type = "INFO",
    link,
    metadata,
  }: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
    metadata?: any;
  }) {
    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
        metadata: metadata as JsonValue,
      },
    });

    // Trigger Real-time event (SSE)
    const { sseManager } = await import("@/lib/realtime/sse-server");
    sseManager.sendToUser(userId, {
      type: "NOTIFICATION",
      notification,
    });
    
    return notification;
  }

  /**
   * Get notifications for a specific user.
   */
  static async getForUser(userId: string, limit: number = 20) {
    return await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Mark a specific notification as read.
   */
  static async markAsRead(notificationId: string, userId: string) {
    return await db.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications for a user as read.
   */
  static async markAllAsRead(userId: string) {
    return await db.notification.updateMany({
      where: { userId },
      data: { isRead: true },
    });
  }

  /**
   * Get unread notification count for a user.
   */
  static async getUnreadCount(userId: string) {
    return await db.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }
}
