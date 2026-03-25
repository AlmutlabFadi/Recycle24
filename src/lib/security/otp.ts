import { sendEmail } from "@/lib/email/service";

export class SecurityOTPService {
  /**
   * OTP persistence is not supported by the current Prisma schema.
   * This method fails closed by design until a real OTP model is implemented.
   */
  static async generateOTP(
    userId: string,
    actionType: "WITHDRAWAL" | "DEPOSIT" | "TRANSFER" | "NEW_DEVICE",
    referenceId?: string,
    metadata?: { amount?: number; currency?: string; target?: string }
  ): Promise<{ code: string; expiresAt: Date }> {
    void userId;
    void actionType;
    void referenceId;
    void metadata;
    void sendEmail;

    throw new Error(
      "Security OTP is not available: Prisma schema does not contain a securityOTP model."
    );
  }

  /**
   * Verification must fail closed until persistent OTP storage exists.
   */
  static async verifyOTP(
    userId: string,
    actionType: "WITHDRAWAL" | "DEPOSIT" | "TRANSFER" | "NEW_DEVICE",
    code: string,
    referenceId?: string
  ): Promise<boolean> {
    void userId;
    void actionType;
    void code;
    void referenceId;

    return false;
  }
}
