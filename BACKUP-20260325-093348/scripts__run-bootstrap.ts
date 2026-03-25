import { bootstrapAccessControl } from "../src/lib/rbac";
import { db } from "../src/lib/db";

async function main() {
    console.log("Bootstrapping Access Control...");
    await bootstrapAccessControl();
    console.log("Success! Roles and Permissions synchronized.");
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
