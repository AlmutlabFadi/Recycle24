const { bootstrapAccessControl } = require("./src/lib/rbac");
const { db } = require("./src/lib/db");

async function run() {
  console.log("Starting RBAC Bootstrap...");
  try {
    await bootstrapAccessControl();
    console.log("RBAC Bootstrap completed successfully.");
  } catch (error) {
    console.error("RBAC Bootstrap failed:", error);
  } finally {
    process.exit(0);
  }
}

run();
