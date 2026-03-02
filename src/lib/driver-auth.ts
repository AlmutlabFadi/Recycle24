import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type DriverGuardResult =
    | { ok: true; userId: string; driverId: string }
    | { ok: false; status: 401 | 403 | 404; error: string };

export async function requireDriverSession(): Promise<
    | { ok: true; userId: string; userType?: string | null; role?: string | null }
    | { ok: false; status: 401; error: string }
> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return { ok: false, status: 401, error: "UNAUTHORIZED" };
    }

    const user = session.user as { id: string; userType?: string | null; role?: string | null };
    return { ok: true, userId: user.id, userType: user.userType, role: user.role };
}

export async function requireDriverProfile(): Promise<DriverGuardResult> {
    const session = await requireDriverSession();
    if (!session.ok) return session;

    if (session.userType !== "DRIVER") {
        return { ok: false, status: 403, error: "FORBIDDEN" };
    }

    const driver = await db.driver.findUnique({
        where: { userId: session.userId },
        select: { id: true, status: true },
    });

    if (!driver) {
        return { ok: false, status: 404, error: "DRIVER_PROFILE_MISSING" };
    }

    if (driver.status === "SUSPENDED") {
        return { ok: false, status: 403, error: "DRIVER_SUSPENDED" };
    }

    return { ok: true, userId: session.userId, driverId: driver.id };
}
