
import { db } from "@/lib/db";
import { SecurityLogger, SecurityEvent } from "./logger";

export const Containment = {
  /**
   * Lock a user account immediately.
   * This prevents login and kills active sessions (middleware check required).
   */
  async lockUser(userId: string, reason: string, adminId?: string) {
    try {
      await db.user.update({
        where: { id: userId },
        data: {
            isLocked: true,
            lockReason: reason
        },
      });

      // Log the containment action
      await SecurityLogger.critical(
        SecurityEvent.CONTAINMENT_ACTION,
        { action: "LOCK_USER", targetUserId: userId, reason, adminId },
        adminId
      );

      // In a real production app with Redis, we would also:
      // await redis.del(`session:${userId}`);
      
      return { success: true, message: "User locked successfully." };
    } catch (error) {
      await SecurityLogger.info(SecurityEvent.SYSTEM_ERROR, { error: "Failed to lock user", userId });
      throw error;
    }
  },

  /**
   * Unlock a user account.
   */
  async unlockUser(userId: string, adminId: string) {
    await db.user.update({
      where: { id: userId },
      data: { isLocked: false, lockReason: null },
    });

    await SecurityLogger.warn(
      SecurityEvent.ADMIN_ACTION,
      { action: "UNLOCK_USER", targetUserId: userId },
      adminId
    );
  }
};
