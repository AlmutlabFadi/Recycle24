import { createHash, randomInt } from "node:crypto";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/service";

type OTPActionType = "WITHDRAWAL" | "DEPOSIT" | "TRANSFER" | "NEW_DEVICE";

type OTPMetadata = {
  amount?: number;
  currency?: string;
  target?: string;
};

type OTPUser = {
  email: string;
  name: string | null;
};

const OTP_TTL_SECONDS = 120;
const OTP_LENGTH = 6;

function normalizeReferenceId(referenceId?: string) {
  const normalized = referenceId?.trim();

  return normalized && normalized.length > 0 ? normalized : null;
}

function generateNumericOTP(length: number) {
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += String(randomInt(0, 10));
  }

  return code;
}

function buildOTPEmail(params: {
  actionType: OTPActionType;
  code: string;
  expiresAt: Date;
  metadata?: OTPMetadata;
}) {
  const details: string[] = [];

  if (typeof params.metadata?.amount === "number") {
    const currency = params.metadata.currency ? ` ${params.metadata.currency}` : "";
    details.push(`المبلغ: ${params.metadata.amount.toLocaleString()}${currency}`);
  }

  if (params.metadata?.target) {
    details.push(`الوجهة/الطريقة: ${params.metadata.target}`);
  }

  const detailsBlock =
    details.length > 0 ? `<br><br>تفاصيل العملية:<br>- ${details.join("<br>- ")}` : "";

  return {
    subject: `رمز التحقق لعملية ${params.actionType}`,
    html: `رمز التحقق الخاص بك هو: <strong>${params.code}</strong><br><br>ينتهي هذا الرمز في: ${params.expiresAt.toISOString()}${detailsBlock}<br><br>إذا لم تطلب هذه العملية، تجاهل هذه الرسالة فورًا.`,
  };
}

async function getUserEmail(userId: string): Promise<OTPUser> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
    },
  });

  if (!user?.email) {
    throw new Error("OTP delivery failed: user email is not available.");
  }

  return {
    email: user.email,
    name: user.name,
  };
}

export class SecurityOTPService {
  static async generateOTP(
    userId: string,
    actionType: OTPActionType,
    referenceId?: string,
    metadata?: OTPMetadata
  ): Promise<{ code: string; expiresAt: Date }> {
    const normalizedReferenceId = normalizeReferenceId(referenceId);
    const code = generateNumericOTP(OTP_LENGTH);
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    const user = await getUserEmail(userId);

    await db.$transaction(async (tx) => {
      await tx.securityOTP.updateMany({
        where: {
          userId,
          actionType,
          isUsed: false,
          expiresAt: {
            gt: new Date(),
          },
          ...(normalizedReferenceId
            ? { referenceId: normalizedReferenceId }
            : { referenceId: null }),
        },
        data: {
          isUsed: true,
        },
      });

      await tx.securityOTP.create({
        data: {
          id: cryptoRandomId(),
          userId,
          code,
          actionType,
          referenceId: normalizedReferenceId,
          isUsed: false,
          expiresAt,
        },
      });
    });

    const email = buildOTPEmail({
      actionType,
      code,
      expiresAt,
      metadata,
    });

    await sendEmail(user.email, email.subject, email.html);

    return { code, expiresAt };
  }

  static async verifyOTP(
    userId: string,
    actionType: OTPActionType,
    code: string,
    referenceId?: string
  ): Promise<boolean> {
    const normalizedCode = code.trim();
    const normalizedReferenceId = normalizeReferenceId(referenceId);

    if (!/^\d{6}$/.test(normalizedCode)) {
      return false;
    }

    const now = new Date();

    const otpRecord = await db.securityOTP.findFirst({
      where: {
        userId,
        actionType,
        code: normalizedCode,
        isUsed: false,
        expiresAt: {
          gt: now,
        },
        ...(normalizedReferenceId
          ? { referenceId: normalizedReferenceId }
          : { referenceId: null }),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
      },
    });

    if (!otpRecord) {
      return false;
    }

    const updateResult = await db.securityOTP.updateMany({
      where: {
        id: otpRecord.id,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    return updateResult.count === 1;
  }
}

function cryptoRandomId() {
  return createHash("sha256")
    .update(`${Date.now()}-${Math.random()}-${randomInt(100000, 999999)}`)
    .digest("hex")
    .slice(0, 32);
}