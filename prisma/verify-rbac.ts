import { db } from "../src/lib/db";

async function main() {
  const [permissions, roles, rolePermissions, userRoles] = await Promise.all([
    db.permission.count(),
    db.role.count(),
    db.rolePermission.count(),
    db.userRole.count(),
  ]);

  console.log(JSON.stringify({ permissions, roles, rolePermissions, userRoles }, null, 2));
}

main()
  .catch((error) => {
    console.error("RBAC verify failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
