/**
 * Authorized Live Security Exercise
 * Purpose: This script simulates common attack vectors against the local API 
 * to verify that Detection, Containment, and Forensics are working as expected.
 * 
 * Usage: Execute via Node.js in development/staging environment ONLY.
 * e.g., `ts-node src/scripts/security-simulation.ts`
 */

async function runSimulation() {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  console.log(`\n🔒 Starting Authorized Live Security Exercise against ${BASE_URL}...`);

  // Target User ID for testing (replace with a test account ID)
  const TARGET_USER_ID = "test_user_123"; 

  console.log("\n--- [SIMULATION: API ABUSE] ---");
  try {
    // We will call the Playbook directly to simulate the detection rule firing
    console.log("Simulating detection of 500 requests / second from single IP...");
    
    const res = await fetch(`${BASE_URL}/api/security/playbooks/api-abuse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ip: "192.168.1.100",
        reason: "SIMULATION: High request rate on /api/market-prices",
        adminId: "simulation_script"
      })
    });
    
    const data = await res.json();
    console.log("Containment Response:", data);
  } catch (error) {
    console.error("Simulation failed:", error);
  }

  console.log("\n--- [SIMULATION: IDENTITY COMPROMISE] ---");
  try {
    console.log("Simulating detection of login from new country without MFA...");
    
    const res = await fetch(`${BASE_URL}/api/security/playbooks/identity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: TARGET_USER_ID,
        reason: "SIMULATION: Impossible travel detected (Syria -> USA in 10 mins)",
        adminId: "simulation_script"
      })
    });
    
    const data = await res.json();
    console.log("Containment Response:", data);
  } catch (error) {
    console.error("Simulation failed:", error);
  }

  console.log("\n--- [VERIFICATION: FORENSICS] ---");
  try {
    console.log("Requesting Forensic Export for the last 1 hour...");
    const res = await fetch(`${BASE_URL}/api/security/forensics/export?hours=1`);
    const data = await res.json();
    
    console.log(`Export Generated Successfully. Total Records: ${data?.metadata?.recordCount}`);
    console.log(`Final Blockchain Signature: ${data?.metadata?.finalSignature}`);
    
    if (data?.metadata?.recordCount > 0) {
      console.log("✅ Detection & Logging Working!");
    }
  } catch (error) {
    console.error("Forensic verification failed:", error);
  }

  console.log("\n✅ Simulation Complete. Please check the SOC Dashboard to verify the alerts visually.");
}

runSimulation();
