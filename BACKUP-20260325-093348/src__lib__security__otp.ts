import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/service";

export class SecurityOTPService {
  /**
   * Generates a 6-digit OTP for a specific financial action, valid for 120 seconds.
   * Invalidates any previously unexpired OTPs for this user and action.
   */
  static async generateOTP(
    userId: string,
    actionType: "WITHDRAWAL" | "DEPOSIT" | "TRANSFER" | "NEW_DEVICE",
    referenceId?: string,
    metadata?: { amount?: number; currency?: string; target?: string }
  ): Promise<{ code: string; expiresAt: Date }> {
    // 1. Invalidate previous OTPs to ensure only the latest is valid
    await db.securityOTP.updateMany({
      where: {
        userId,
        actionType,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      data: { isUsed: true },
    });

    // 2. Generate secure 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 120 * 1000); // 120 seconds

    // 3. Store the OTP
    await db.securityOTP.create({
      data: {
        userId,
        code,
        actionType,
        referenceId,
        expiresAt,
      },
    });

    // 4. Send Real Email
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (user?.email) {
      const actionName = 
          actionType === "WITHDRAWAL" ? "سحب رصيد" : 
          actionType === "DEPOSIT" ? "إيداع رصيد" : "إرسال حوالة";
          
      let transactionDetailsHtml = "";
      if (metadata && metadata.amount !== undefined) {
        transactionDetailsHtml = `
          <div style="background: #edf2f7; border-right: 4px solid #4299e1; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #2b6cb0; font-size: 16px;">تفاصيل المعاملة:</h3>
            <ul style="list-style: none; padding: 0; margin: 0; font-size: 15px;">
              <li style="margin-bottom: 8px;"><strong>المبلغ:</strong> <span style="font-weight: bold; color: #d53f8c;">${metadata.amount.toLocaleString("ar-SY")}</span> ${metadata.currency || "SYP"}</li>
              ${metadata.target ? `<li style="margin-bottom: 8px;"><strong>الوجهة:</strong> ${metadata.target}</li>` : ""}
            </ul>
          </div>
        `;
      }

      const emailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #2b6cb0;">رمز تحقق لعملية ${actionName}</h2>
          <p>مرحباً <strong>${user.name || "عميلنا العزيز"}</strong>،</p>
          <p>لقد طلبت المتابعة في عملية ${actionName} على حسابك في Metalix24.</p>
          ${transactionDetailsHtml}
          <p>لإتمام العملية بنجاح، يرجى إدخال رمز التحقق التالي:</p>
          <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
             <span style="font-size: 28px; font-weight: bold; font-family: monospace; letter-spacing: 5px;">${code}</span>
          </div>
          <p style="color: #e53e3e; font-size: 14px;"><strong>ملاحظة هامة:</strong> هذا الرمز صالح لمدة <strong>120 ثانية</strong> فقط ولعملية واحدة حصراً.</p>
          <p style="font-size: 12px; color: #718096; margin-top: 30px;">إذا لم تقم بطلب هذا الرمز، يرجى تغيير كلمة المرور الخاصة بك فوراً.</p>
        </div>
      `;

      await sendEmail(
        user.email,
        `رمز أمان عملية (${actionName}) - Metalix24`,
        emailHtml
      );
    }

    return { code, expiresAt };
  }

  /**
   * Verifies an OTP code for a specific user and action type.
   * Fails if expired, already used, or invalid.
   */
  static async verifyOTP(
    userId: string,
    actionType: "WITHDRAWAL" | "DEPOSIT" | "TRANSFER" | "NEW_DEVICE",
    code: string,
    referenceId?: string
  ): Promise<boolean> {
    const otp = await db.securityOTP.findFirst({
      where: {
        userId,
        actionType,
        code,
        isUsed: false,
        expiresAt: { gt: new Date() }, // Not expired
        ...(referenceId ? { referenceId } : {}),
      },
    });

    if (!otp) {
      return false; // Invalid or expired
    }

    // Invalidate the OTP so it can't be used again
    await db.securityOTP.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    return true;
  }
}
