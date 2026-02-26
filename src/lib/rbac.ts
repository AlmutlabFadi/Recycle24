import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const PERMISSIONS = {
    MANAGE_ACCESS: "MANAGE_ACCESS",
    MANAGE_KNOWLEDGE: "MANAGE_KNOWLEDGE",
    UPLOAD_MEDIA: "UPLOAD_MEDIA",
    ACCESS_SAFETY: "ACCESS_SAFETY",
    ACCESS_CONSULTATIONS: "ACCESS_CONSULTATIONS",
    ACCESS_ACADEMY: "ACCESS_ACADEMY",
} as const;

const DEFAULT_PERMISSIONS = [
    { key: PERMISSIONS.MANAGE_ACCESS, label: "إدارة الصلاحيات", description: "إدارة الأدوار والدعوات" },
    { key: PERMISSIONS.MANAGE_KNOWLEDGE, label: "إدارة المحتوى", description: "إضافة وتحديث محتوى المراكز" },
    { key: PERMISSIONS.UPLOAD_MEDIA, label: "رفع الوسائط", description: "رفع صور وفيديوهات للمحتوى" },
    { key: PERMISSIONS.ACCESS_SAFETY, label: "مركز السلامة", description: "الوصول لمحتوى السلامة" },
    { key: PERMISSIONS.ACCESS_CONSULTATIONS, label: "مركز الاستشارات", description: "الوصول لمحتوى الاستشارات" },
    { key: PERMISSIONS.ACCESS_ACADEMY, label: "الأكاديمية", description: "الوصول لمحتوى الأكاديمية" },
];

const DEFAULT_ROLES = [
    {
        name: "OWNER",
        description: "المدير الرئيسي للمشروع",
        isSystem: true,
        permissions: Object.values(PERMISSIONS),
    },
    {
        name: "SAFETY_SUPERVISOR",
        description: "مشرف مركز السلامة",
        isSystem: true,
        permissions: [
            PERMISSIONS.MANAGE_KNOWLEDGE,
            PERMISSIONS.UPLOAD_MEDIA,
            PERMISSIONS.ACCESS_SAFETY,
        ],
    },
    {
        name: "CONSULTATIONS_SUPERVISOR",
        description: "مشرف مركز الاستشارات",
        isSystem: true,
        permissions: [
            PERMISSIONS.MANAGE_KNOWLEDGE,
            PERMISSIONS.UPLOAD_MEDIA,
            PERMISSIONS.ACCESS_CONSULTATIONS,
        ],
    },
    {
        name: "ACADEMY_SUPERVISOR",
        description: "مشرف الأكاديمية",
        isSystem: true,
        permissions: [
            PERMISSIONS.MANAGE_KNOWLEDGE,
            PERMISSIONS.UPLOAD_MEDIA,
            PERMISSIONS.ACCESS_ACADEMY,
        ],
    },
];

export async function bootstrapAccessControl() {
    const existing = await db.permission.count();
    if (existing > 0) return;

    await db.$transaction(async (tx) => {
        const permissions = await Promise.all(
            DEFAULT_PERMISSIONS.map((permission) =>
                tx.permission.create({ data: permission })
            )
        );

        const permissionMap = new Map(permissions.map((perm) => [perm.key, perm.id]));

        for (const role of DEFAULT_ROLES) {
            const createdRole = await tx.role.create({
                data: {
                    name: role.name,
                    description: role.description,
                    isSystem: role.isSystem,
                },
            });

            const rolePermissionData = role.permissions
                .map((key) => permissionMap.get(key))
                .filter((id): id is string => Boolean(id))
                .map((permissionId) => ({ roleId: createdRole.id, permissionId }));

            if (rolePermissionData.length) {
                await tx.rolePermission.createMany({ data: rolePermissionData });
            }
        }

        const adminUsers = await tx.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true },
        });

        if (adminUsers.length) {
            const ownerRole = await tx.role.findUnique({ where: { name: "OWNER" }, select: { id: true } });
            if (ownerRole) {
                await tx.userRole.createMany({
                    data: adminUsers.map((user) => ({ userId: user.id, roleId: ownerRole.id })),
                    skipDuplicates: true,
                });
            }
        }
    });
}

export async function getSessionUserId() {
    const session = await getServerSession(authOptions);
    return session?.user ? (session.user as { id: string }).id : null;
}

export async function getUserPermissions(userId: string) {
    const roles = await db.userRole.findMany({
        where: { userId },
        select: {
            role: {
                select: {
                    rolePermissions: {
                        select: {
                            permission: { select: { key: true } },
                        },
                    },
                },
            },
        },
    });

    const keys = new Set<string>();
    roles.forEach((role) => {
        role.role.rolePermissions.forEach((rp) => keys.add(rp.permission.key));
    });

    return Array.from(keys);
}

export async function requirePermission(permissionKey: string) {
    await bootstrapAccessControl();
    const userId = await getSessionUserId();
    if (!userId) return { ok: false, status: 401 as const };

    const user = await db.user.findUnique({
        where: { id: userId },
        select: { status: true },
    });

    if (user?.status && user.status !== "ACTIVE") {
        return { ok: false, status: 403 as const };
    }

    const permissions = await getUserPermissions(userId);
    if (!permissions.includes(permissionKey)) {
        return { ok: false, status: 403 as const };
    }

    return { ok: true, userId } as const;
}

export function hasCenterAccess(permissions: string[], center: string) {
    if (center === "SAFETY") return permissions.includes(PERMISSIONS.ACCESS_SAFETY);
    if (center === "CONSULTATIONS") return permissions.includes(PERMISSIONS.ACCESS_CONSULTATIONS);
    if (center === "ACADEMY") return permissions.includes(PERMISSIONS.ACCESS_ACADEMY);
    return false;
}
