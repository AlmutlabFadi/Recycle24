import { bootstrapAccessControl } from "../src/lib/rbac";

async function main() {
  await bootstrapAccessControl();
  console.log("RBAC bootstrap completed successfully.");
}

main()
  .catch((error) => {
    console.error("RBAC bootstrap failed:", error);
    process.exit(1);
  });
