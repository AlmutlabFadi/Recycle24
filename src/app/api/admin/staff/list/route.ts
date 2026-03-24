import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

export async function GET() {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        const users = await db.user.findMany({
            where: {
                userRoles: {
                    some: {} // Has at least one role
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                userType: true,
                role: true,
                currentAdminStatus: true,
                lastActiveAt: true,
                userRoles: {
                    select: {
                        role: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                name: "asc"
            }
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error("Staff list fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
