import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type NotificationType = "INFO" | "URGENT" | "SUCCESS" | "WARNING";

export class NotificationService {
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
    metadata?: Prisma.InputJsonValue;
  }) {
    const notification = await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
        metadata: metadata ?? undefined,
      },
    });

    const { sseManager } = await import("@/lib/realtime/sse-server");
    sseManager.sendToUser(userId, {
      type: "NOTIFICATION",
      notification,
    });

    return notification;
  }

  static async getForUser(userId: string, limit: number = 20) {
    return await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  static async markAsRead(notificationId: string, userId: string) {
    return await db.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return await db.notification.updateMany({
      where: { userId },
      data: { isRead: true },
    });
  }

  static async getUnreadCount(userId: string) {
    return await db.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }
}