import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const PERMISSIONS = {
  MANAGE_ACCESS: "MANAGE_ACCESS",
  MANAGE_KNOWLEDGE: "MANAGE_KNOWLEDGE",
  MANAGE_USERS: "MANAGE_USERS",
  MANAGE_DRIVERS: "MANAGE_DRIVERS",
  REVIEW_DRIVER_DOCS: "REVIEW_DRIVER_DOCS",
  MANAGE_SUPPORT: "MANAGE_SUPPORT",
  MANAGE_FINANCE: "MANAGE_FINANCE",
  FINANCE_FINAL_APPROVE: "FINANCE_FINAL_APPROVE",
  MANAGE_REWARDS: "MANAGE_REWARDS",
  UPLOAD_MEDIA: "UPLOAD_MEDIA",
  ACCESS_SAFETY: "ACCESS_SAFETY",
  ACCESS_CONSULTATIONS: "ACCESS_CONSULTATIONS",
  ACCESS_ACADEMY: "ACCESS_ACADEMY",
} as const;

const DEFAULT_PERMISSIONS = [
  { key: PERMISSIONS.MANAGE_ACCESS, label: "إدارة الصلاحيات", description: "إدارة الأدوار والدعوات" },
  { key: PERMISSIONS.MANAGE_KNOWLEDGE, label: "إدارة المحتوى", description: "إضافة وتحديث محتوى المراكز" },
  { key: PERMISSIONS.MANAGE_USERS, label: "إدارة المستخدمين", description: "توثيق الحسابات وإدارة بائعي الخردة" },
  { key: PERMISSIONS.MANAGE_DRIVERS, label: "إدارة السائقين", description: "إدارة ملفات السائقين وحالاتهم" },
  { key: PERMISSIONS.REVIEW_DRIVER_DOCS, label: "مراجعة وثائق السائق", description: "مراجعة وثائق السائقين واعتمادها" },
  { key: PERMISSIONS.MANAGE_SUPPORT, label: "الدعم الفني", description: "الرد على تذاكر الدعم وحل المشكلات" },
  { key: PERMISSIONS.MANAGE_FINANCE, label: "الإدارة المالية", description: "إدارة الاشتراكات والرسوم والتقارير" },
  { key: PERMISSIONS.FINANCE_FINAL_APPROVE, label: "الاعتماد المالي النهائي", description: "صلاحية الاعتماد النهائي لعمليات السحب والتحويل الكبيرة" },
  { key: PERMISSIONS.MANAGE_REWARDS, label: "نظام المكافآت", description: "إدارة نقاط التدوير والجوائز" },
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
    name: "SUPPORT_LEAD",
    description: "مسؤول الدعم الفني",
    isSystem: true,
    permissions: [
      PERMISSIONS.MANAGE_SUPPORT,
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.MANAGE_DRIVERS,
      PERMISSIONS.REVIEW_DRIVER_DOCS,
    ],
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
  await db.$transaction(
    async (tx) => {
      const permissions = await Promise.all(
        DEFAULT_PERMISSIONS.map((permission) =>
          tx.permission.upsert({
            where: { key: permission.key },
            update: { label: permission.label, description: permission.description },
            create: permission,
          })
        )
      );

      const permissionMap = new Map(permissions.map((perm) => [perm.key, perm.id]));

      for (const role of DEFAULT_ROLES) {
        const createdRole = await tx.role.upsert({
          where: { name: role.name },
          update: { description: role.description, isSystem: role.isSystem },
          create: {
            name: role.name,
            description: role.description,
            isSystem: role.isSystem,
          },
        });

        const rolePermissionData = role.permissions
          .map((key) => permissionMap.get(key))
          .filter((id): id is string => Boolean(id))
          .map((permissionId) => ({ roleId: createdRole.id, permissionId }));

        for (const rp of rolePermissionData) {
          await tx.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: rp.roleId,
                permissionId: rp.permissionId,
              },
            },
            update: {},
            create: rp,
          });
        }
      }

      // 3. Associate OWNER role only with the primary administrator
      const ownerRole = await tx.role.findUnique({
        where: { name: "OWNER" },
        select: { id: true },
      });

      if (ownerRole) {
        // Only assign OWNER to the primary administrator email
        const primaryAdminEmail = process.env.OWNER_EMAIL || "emixdigitall@gmail.com";
        const primaryUser = await tx.user.findUnique({
          where: { email: primaryAdminEmail },
          select: { id: true },
        });

        if (primaryUser) {
          await tx.userRole.upsert({
            where: {
              userId_roleId: {
                userId: primaryUser.id,
                roleId: ownerRole.id,
              },
            },
            update: {},
            create: { userId: primaryUser.id, roleId: ownerRole.id },
          });
        }
      }
    },
    { timeout: 60000 }
  );
}

export async function getSessionUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function getSessionPermissions() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user.permissions ?? [];
}

export async function getUserPermissions(userId: string) {
  const roles = await db.userRole.findMany({
    where: { userId },
    select: {
      role: {
        select: {
          rolePermissions: {
            select: {
              permission: {
                select: {
                  key: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const keys = new Set<string>();

  for (const role of roles) {
    for (const rp of role.role.rolePermissions) {
      keys.add(rp.permission.key);
    }
  }

  return Array.from(keys);
}

export async function requirePermission(permissionKey: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { ok: false, status: 401 as const };
  }

  if (session.user.status && session.user.status !== "ACTIVE") {
    return { ok: false, status: 403 as const };
  }

  const permissions = session.user.permissions ?? [];

  if (!permissions.includes(permissionKey)) {
    return { ok: false, status: 403 as const };
  }

  return { ok: true, userId: session.user.id } as const;
}

export function hasCenterAccess(permissions: string[], center: string) {
  if (center === "SAFETY") return permissions.includes(PERMISSIONS.ACCESS_SAFETY);
  if (center === "CONSULTATIONS") return permissions.includes(PERMISSIONS.ACCESS_CONSULTATIONS);
  if (center === "ACADEMY") return permissions.includes(PERMISSIONS.ACCESS_ACADEMY);
  return false;
}
