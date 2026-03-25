import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, PERMISSIONS, bootstrapAccessControl } from "@/lib/rbac";

export async function GET() {
  try {
    const access = await requirePermission(PERMISSIONS.MANAGE_ACCESS);

    if (!access.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: access.status });
    }

    const atomicRoleCount = await db.role.count({
      where: { name: { startsWith: "__PERM_" } },
    });

    if (atomicRoleCount === 0) {
      console.log("Atomic roles missing. Bootstrapping...");
      await bootstrapAccessControl();
    }

    const users = await db.user.findMany({
      where: {
        userRoles: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        userType: true,
        role: true,
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
                        label: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const normalizedUsers = users.map((user) => ({
      ...user,
      currentAdminStatus: "UNKNOWN",
      adminAccessEnabled: true,
      lastActiveAt: null,
    }));

    return NextResponse.json({ users: normalizedUsers });
  } catch (error) {
    console.error("Staff list fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
