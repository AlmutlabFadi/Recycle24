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
  { key: PERMISSIONS.MANAGE_ACCESS, label: "????? ?????????", description: "????? ??????? ????????" },
  { key: PERMISSIONS.MANAGE_KNOWLEDGE, label: "????? ???????", description: "????? ?????? ????? ???????" },
  { key: PERMISSIONS.MANAGE_USERS, label: "????? ??????????", description: "????? ???????? ?????? ????? ??????" },
  { key: PERMISSIONS.MANAGE_DRIVERS, label: "????? ????????", description: "????? ????? ???????? ????????" },
  { key: PERMISSIONS.REVIEW_DRIVER_DOCS, label: "?????? ????? ??????", description: "?????? ????? ???????? ?????????" },
  { key: PERMISSIONS.MANAGE_SUPPORT, label: "????? ?????", description: "???? ??? ????? ????? ??? ????????" },
  { key: PERMISSIONS.MANAGE_FINANCE, label: "??????? ???????", description: "????? ?????????? ??????? ?????????" },
  { key: PERMISSIONS.FINANCE_FINAL_APPROVE, label: "???????? ?????? ???????", description: "?????? ???????? ??????? ??????? ????? ???????? ???????" },
  { key: PERMISSIONS.MANAGE_REWARDS, label: "???? ????????", description: "????? ???? ??????? ????????" },
  { key: PERMISSIONS.UPLOAD_MEDIA, label: "??? ???????", description: "??? ??? ????????? ???????" },
  { key: PERMISSIONS.ACCESS_SAFETY, label: "???? ???????", description: "?????? ?????? ???????" },
  { key: PERMISSIONS.ACCESS_CONSULTATIONS, label: "???? ??????????", description: "?????? ?????? ??????????" },
  { key: PERMISSIONS.ACCESS_ACADEMY, label: "??????????", description: "?????? ?????? ??????????" },
];

const ATOMIC_ROLES = Object.values(PERMISSIONS).map((perm) => ({
  name: `__PERM_${perm}`,
  description: `Atomic Permission Role for ${perm}`,
  isSystem: true,
  permissions: [perm],
}));

const DEFAULT_ROLES = [
  {
    name: "OWNER",
    description: "?????? ??????? ???????",
    isSystem: true,
    permissions: Object.values(PERMISSIONS),
  },
  {
    name: "SUPPORT_LEAD",
    description: "????? ????? ?????",
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
    description: "???? ???? ???????",
    isSystem: true,
    permissions: [
      PERMISSIONS.MANAGE_KNOWLEDGE,
      PERMISSIONS.UPLOAD_MEDIA,
      PERMISSIONS.ACCESS_SAFETY,
    ],
  },
  {
    name: "CONSULTATIONS_SUPERVISOR",
    description: "???? ???? ??????????",
    isSystem: true,
    permissions: [
      PERMISSIONS.MANAGE_KNOWLEDGE,
      PERMISSIONS.UPLOAD_MEDIA,
      PERMISSIONS.ACCESS_CONSULTATIONS,
    ],
  },
  {
    name: "ACADEMY_SUPERVISOR",
    description: "???? ??????????",
    isSystem: true,
    permissions: [
      PERMISSIONS.MANAGE_KNOWLEDGE,
      PERMISSIONS.UPLOAD_MEDIA,
      PERMISSIONS.ACCESS_ACADEMY,
    ],
  },
  ...ATOMIC_ROLES,
];

let bootstrapPromise: Promise<void> | null = null;

export async function isAccessControlBootstrapped() {
  const [permissionCount, atomicRoleCount] = await Promise.all([
    db.permission.count({
      where: {
        key: {
          in: Object.values(PERMISSIONS),
        },
      },
    }),
    db.role.count({
      where: {
        name: {
          startsWith: "__PERM_",
        },
      },
    }),
  ]);

  return (
    permissionCount >= Object.values(PERMISSIONS).length &&
    atomicRoleCount >= ATOMIC_ROLES.length
  );
}

async function bootstrapAccessControlInternal() {
  await db.$transaction(
    async (tx) => {
      const permissions = await Promise.all(
        DEFAULT_PERMISSIONS.map((permission) =>
          tx.permission.upsert({
            where: { key: permission.key },
            update: {
              label: permission.label,
              description: permission.description,
            },
            create: permission,
          })
        )
      );

      const permissionMap = new Map(permissions.map((perm) => [perm.key, perm.id]));

      for (const role of DEFAULT_ROLES) {
        const createdRole = await tx.role.upsert({
          where: { name: role.name },
          update: {
            description: role.description,
            isSystem: role.isSystem,
          },
          create: {
            name: role.name,
            description: role.description,
            isSystem: role.isSystem,
          },
        });

        const rolePermissionData = role.permissions
          .map((key) => permissionMap.get(key))
          .filter((id): id is string => Boolean(id))
          .map((permissionId) => ({
            roleId: createdRole.id,
            permissionId,
          }));

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

      const ownerRole = await tx.role.findUnique({
        where: { name: "OWNER" },
        select: { id: true },
      });

      if (ownerRole) {
        const primaryAdminEmail =
          process.env.OWNER_EMAIL || "emixdigitall@gmail.com";

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
            create: {
              userId: primaryUser.id,
              roleId: ownerRole.id,
            },
          });
        }
      }
    },
    { timeout: 60000 }
  );
}

export async function bootstrapAccessControl(force = false) {
  if (!force) {
    const ready = await isAccessControlBootstrapped();
    if (ready) return;
  }

  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapAccessControlInternal().finally(() => {
      bootstrapPromise = null;
    });
  }

  await bootstrapPromise;
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
