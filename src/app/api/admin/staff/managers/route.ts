import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";

export async function GET() {
    try {
        const departments = [
            { key: "finance", label: "المالية", permission: PERMISSIONS.MANAGE_FINANCE },
            { key: "users", label: "المستخدمين", permission: PERMISSIONS.MANAGE_USERS },
            { key: "transport", label: "النقل", permission: PERMISSIONS.MANAGE_DRIVERS },
            { key: "support", label: "الدعم الفني", permission: PERMISSIONS.MANAGE_SUPPORT },
            { key: "security", label: "الأمن", permission: PERMISSIONS.MANAGE_ACCESS },
        ];

        const now = new Date();
        const OFFLINE_THRESHOLD = 2 * 60 * 1000; // 2 minutes without heartbeat

        const results = await Promise.all(
            departments.map(async (dept) => {
                const managers = await db.user.findMany({
                    where: {
                        userRoles: {
                            some: {
                                role: {
                                    rolePermissions: {
                                        some: {
                                            permission: { key: dept.permission },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        lastActiveAt: true,
                        currentAdminStatus: true,
                    },
                });

                return {
                    department: dept.label,
                    managers: managers.map(m => {
                        let status = "OFFLINE";
                        if (m.lastActiveAt && (now.getTime() - m.lastActiveAt.getTime() < OFFLINE_THRESHOLD)) {
                            status = m.currentAdminStatus || "ONLINE";
                        }
                        return {
                            id: m.id,
                            name: m.name || `${m.firstName || ""} ${m.lastName || ""}`.trim() || "غير معروف",
                            status,
                        };
                    }),
                };
            })
        );

        return NextResponse.json({ success: true, departments: results });
    } catch (error) {
        console.error("Managers fetch error:", error);
        return NextResponse.json({ success: false, error: "تعذر جلب بيانات المديرين" }, { status: 500 });
    }
}
