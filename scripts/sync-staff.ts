async function main() {
  console.log("sync-staff skipped: schema does not contain adminAccessEnabled.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
