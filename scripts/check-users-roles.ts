import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: {
            id: true,
            email: true,
            role: true,
            status: true,
            userRoles: {
                select: {
                    role: {
                        select: {
                            name: true,
                            rolePermissions: {
                                select: {
                                    permission: {
                                        select: {
                                            key: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    console.log("Current ADMIN Users:");
    users.forEach(u => {
        const roles = u.userRoles.map(ur => ur.role.name);
        const perms = u.userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission.key));
        console.log(`- ${u.email}: Status=${u.status}, Roles=${roles.join(',')}, Permissions=${perms.length}`);
    });

    const rolesCount = await prisma.role.count();
    const permsCount = await prisma.permission.count();
    console.log(`Total Roles in DB: ${rolesCount}`);
    console.log(`Total Permissions in DB: ${permsCount}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
