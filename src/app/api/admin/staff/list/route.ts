import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS, bootstrapAccessControl } from "@/lib/rbac";

export async function GET() {
    try {
        const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);
        if (!access.ok) {
            return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
        }

        // Auto-bootstrap if atomic roles are missing
        const atomicRoleCount = await db.role.count({ where: { name: { startsWith: "__PERM_" } } });
        if (atomicRoleCount === 0) {
            console.log("Atomic roles missing. Bootstrapping...");
            await bootstrapAccessControl();
        }

        const users = await (db.user.findMany as any)({
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
                adminAccessEnabled: true,
                lastActiveAt: true,
                userRoles: {
                    select: {
                        role: {
                            select: {
                                id: true,
                                name: true,
                                rolePermissions: {
                                    select: {
                                        permission: {
                                            select: {
                                                id: true,
                                                key: true,
                                                label: true
                                            }
                                        }
                                    }
                                }
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
