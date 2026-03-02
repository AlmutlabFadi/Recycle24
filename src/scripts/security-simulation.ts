/**
 * Authorized Live Security Exercise — STRONG & REAL (SAFE BY DESIGN)
 *
 * What it does (for dev/staging only):
 * 1) Generates controlled burst traffic against a REAL endpoint (non-destructive).
 * 2) Optionally triggers containment playbooks (requires server auth).
 * 3) Verifies forensics export metadata and basic invariants.
 *
 * Hard safety gates (will refuse to run unless all present):
 * - NODE_ENV != "production"
 * - ALLOW_SECURITY_SIM=1
 * - SECURITY_SIMULATION_TOKEN set
 *
 * Run:
 *   APP_URL=http://localhost:3000 \
 *   ALLOW_SECURITY_SIM=1 \
 *   SECURITY_SIMULATION_TOKEN=supersecret \
 *   TARGET_USER_ID=test_user_123 \
 *   ts-node src/scripts/security-simulation.ts
 *
 * Notes:
 * - This script is intentionally throttled to avoid being a DoS tool.
 * - It is for validation of detection/containment/forensics pipelines ONLY.
 */

type Json = Record<string, any>;

const BASE_URL = process.env.APP_URL || "http://localhost:3000";
const ALLOW = process.env.ALLOW_SECURITY_SIM === "1";
const TOKEN = process.env.SECURITY_SIMULATION_TOKEN;
const TARGET_USER_ID = process.env.TARGET_USER_ID || "test_user_123";

/**
 * Traffic target: choose a real endpoint that produces logs/metrics.
 * Use something lightweight, read-only, and safe.
 *
 * REQUIRED: implement one of these endpoints:
 * - GET /api/health (recommended)
 * - GET /api/market-prices
 * - GET /api/ping
 */
const TRAFFIC_ENDPOINT = process.env.TRAFFIC_ENDPOINT || "/api/health";

/**
 * Playbook endpoints (optional but recommended):
 * - POST /api/security/playbooks/api-abuse
 * - POST /api/security/playbooks/identity
 *
 * Forensics export endpoint (required for final verification):
 * - GET /api/security/forensics/export?hours=1
 *
 * OPTIONAL: Containment verification endpoint (highly recommended):
 * - GET /api/security/containment/status?ip=...  OR  ?userId=...
 */
const VERIFY_CONTAINMENT = process.env.VERIFY_CONTAINMENT === "1";

/** Safety: keep this bounded. */
const MAX_BURST_RPS = 50;      // hard ceiling for this script
const MAX_DURATION_SEC = 15;   // hard ceiling
const DEFAULT_RPS = clampInt(process.env.BURST_RPS, 10, MAX_BURST_RPS, 20);
const DEFAULT_DURATION = clampInt(process.env.BURST_SECONDS, 3, MAX_DURATION_SEC, 8);

function clampInt(v: any, min: number, max: number, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function assertSafeEnvironment() {
  const env = process.env.NODE_ENV || "(unset)";

  if (process.env.NODE_ENV === "production") {
    throw new Error("REFUSED: NODE_ENV=production");
  }
  if (!ALLOW) {
    throw new Error("REFUSED: set ALLOW_SECURITY_SIM=1");
  }
  if (!TOKEN) {
    throw new Error("REFUSED: set SECURITY_SIMULATION_TOKEN (server must validate it)");
  }

  console.log(`Safety gates OK. NODE_ENV=${env}`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 15_000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

async function requestJson(path: string, init: RequestInit & { timeoutMs?: number } = {}) {
  const url = `${BASE_URL}${path}`;
  const timeoutMs = init.timeoutMs ?? 15_000;

  const res = await fetchWithTimeout(
    url,
    {
      ...init,
      headers: {
        ...(init.headers || {}),
        "Content-Type": "application/json",
        "X-SOC-SIM-TOKEN": TOKEN!, // server MUST validate this
      },
    },
    timeoutMs
  );

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} on ${path}: ${JSON.stringify(data).slice(0, 800)}`);
  }

  return data as Json;
}

function nowIso() {
  return new Date().toISOString();
}

type BurstResult = {
  sent: number;
  ok: number;
  failed: number;
  statuses: Record<string, number>;
  latencyMsP50?: number;
  latencyMsP95?: number;
};

function percentile(values: number[], p: number) {
  if (!values.length) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
}

/**
 * Controlled burst generator:
 * - Sends approx rps for duration seconds.
 * - Uses limited concurrency and spacing to stay "exercise-safe".
 * - Measures status counts + latencies.
 */
async function runControlledBurst(endpoint: string, rps: number, durationSec: number): Promise<BurstResult> {
  const total = rps * durationSec;
  const intervalMs = Math.floor(1000 / rps);

  // cap concurrency to avoid accidental overload
  const concurrency = Math.min(10, Math.max(2, Math.floor(rps / 5))); // bounded

  console.log(`[BURST] endpoint=${endpoint} rps=${rps} duration=${durationSec}s total=${total} concurrency=${concurrency}`);

  let sent = 0;
  let ok = 0;
  let failed = 0;
  const statuses: Record<string, number> = {};
  const latencies: number[] = [];

  const queue: Promise<void>[] = [];

  async function oneRequest(i: number) {
    const url = `${BASE_URL}${endpoint}`;
    const t0 = Date.now();
    try {
      const res = await fetchWithTimeout(
        url,
        {
          method: "GET",
          headers: {
            "X-SOC-SIM-TOKEN": TOKEN!, // optional for traffic endpoints; harmless if ignored
            "X-SIM-TRACE": `burst-${Date.now()}-${i}`,
          },
        },
        10_000
      );

      const dt = Date.now() - t0;
      latencies.push(dt);

      const k = String(res.status);
      statuses[k] = (statuses[k] || 0) + 1;

      if (res.ok) ok++;
      else failed++;

      // Consume body to avoid connection issues on some runtimes
      await res.text().catch(() => {});
    } catch {
      failed++;
      statuses["ERR"] = (statuses["ERR"] || 0) + 1;
    }
  }

  // Worker pool
  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= total) break;

      sent++;
      await oneRequest(i);
      await sleep(intervalMs); // spacing
    }
  }

  for (let i = 0; i < concurrency; i++) queue.push(worker());
  await Promise.all(queue);

  return {
    sent,
    ok,
    failed,
    statuses,
    latencyMsP50: percentile(latencies, 50),
    latencyMsP95: percentile(latencies, 95),
  };
}

/**
 * Optional: Trigger playbooks directly (still requires server auth!)
 * This validates containment execution path, not raw detection.
 */
async function triggerPlaybooks() {
  console.log(`\n--- [PLAYBOOK: API ABUSE] ${nowIso()} ---`);
  const apiAbuse = await requestJson("/api/security/playbooks/api-abuse", {
    method: "POST",
    body: JSON.stringify({
      ip: "192.168.1.100",
      reason: `SIMULATION: Burst traffic generated on ${TRAFFIC_ENDPOINT}`,
      adminId: "security_simulation_script",
    }),
  });
  console.log("api-abuse containment:", apiAbuse);

  console.log(`\n--- [PLAYBOOK: IDENTITY] ${nowIso()} ---`);
  const identity = await requestJson("/api/security/playbooks/identity", {
    method: "POST",
    body: JSON.stringify({
      userId: TARGET_USER_ID,
      reason: "SIMULATION: Impossible travel detected (Syria -> USA in 10 mins)",
      adminId: "security_simulation_script",
    }),
  });
  console.log("identity containment:", identity);

  return { apiAbuse, identity };
}

/**
 * Optional: Verify containment status (requires you to implement an endpoint).
 * If you don't have it, keep VERIFY_CONTAINMENT=0.
 */
async function verifyContainmentStatus() {
  console.log(`\n--- [VERIFY: CONTAINMENT STATUS] ${nowIso()} ---`);
  try {
    const byIp = await requestJson(`/api/security/containment/status?ip=192.168.1.100`, { method: "GET" });
    console.log("Containment status (ip):", byIp);
  } catch (e) {
    console.warn("Containment status (ip) endpoint not available or unauthorized:", e);
  }

  try {
    const byUser = await requestJson(`/api/security/containment/status?userId=${encodeURIComponent(TARGET_USER_ID)}`, {
      method: "GET",
    });
    console.log("Containment status (user):", byUser);
  } catch (e) {
    console.warn("Containment status (user) endpoint not available or unauthorized:", e);
  }
}

function assertForensicsShape(data: any) {
  if (!data || typeof data !== "object") throw new Error("Forensics export is not an object");
  if (!data.metadata || typeof data.metadata !== "object") throw new Error("Forensics export missing metadata");
  if (typeof data.metadata.recordCount !== "number") throw new Error("Forensics export metadata.recordCount must be number");

  // signature is optional but if present must be string
  if (data.metadata.finalSignature != null && typeof data.metadata.finalSignature !== "string") {
    throw new Error("Forensics export metadata.finalSignature must be string if present");
  }
}

/**
 * Forensics: Verify export works and is non-empty after actions.
 * This is not cryptographic verification (needs public key + canonicalization),
 * but it confirms logging pipeline and export endpoint are functioning.
 */
async function verifyForensics(hours = 1) {
  console.log(`\n--- [FORENSICS EXPORT] ${nowIso()} ---`);
  const data = await requestJson(`/api/security/forensics/export?hours=${hours}`, { method: "GET", timeoutMs: 30_000 });

  assertForensicsShape(data);

  const recordCount = data.metadata.recordCount;
  const finalSignature = data.metadata.finalSignature;

  console.log(`Forensics export OK. recordCount=${recordCount}`);
  if (finalSignature) console.log(`finalSignature=${finalSignature}`);

  if (recordCount <= 0) {
    console.log("⚠️ recordCount=0 — either logging is off, filters are wrong, or events not recorded.");
  } else {
    console.log("✅ Forensics logging/export appears functional (non-empty).");
  }

  return data;
}

async function runSecuritySimulation() {
  assertSafeEnvironment();

  console.log(`\n🔒 Authorized Live Security Exercise against ${BASE_URL}`);
  console.log(`Traffic endpoint: ${TRAFFIC_ENDPOINT}`);
  console.log(`Burst profile: rps=${DEFAULT_RPS} duration=${DEFAULT_DURATION}s (capped)\n`);

  // 1) REAL traffic burst (safe, bounded)
  console.log("--- [REAL TRAFFIC BURST] ---");
  const burst = await runControlledBurst(TRAFFIC_ENDPOINT, DEFAULT_RPS, DEFAULT_DURATION);
  console.log("[BURST RESULT]", burst);

  // 2) Trigger playbooks (validates containment execution path)
  //    You can disable this by setting TRIGGER_PLAYBOOKS=0
  const trigger = process.env.TRIGGER_PLAYBOOKS !== "0";
  let playbookOut: any = null;

  if (trigger) {
    playbookOut = await triggerPlaybooks();
  } else {
    console.log("\n[SKIP] Playbook trigger disabled (TRIGGER_PLAYBOOKS=0).");
  }

  // 3) Optional containment status verification (if you implemented it)
  if (VERIFY_CONTAINMENT) {
    await verifyContainmentStatus();
  } else {
    console.log("\n[SKIP] Containment status verification disabled (VERIFY_CONTAINMENT=0).");
  }

  // 4) Forensics export verification
  const forensics = await verifyForensics(1);

  console.log("\n✅ Exercise complete.");
  console.log("What to confirm in SOC dashboard:");
  console.log("- Burst traffic generated events/alerts (if you have detection rules on that endpoint).");
  console.log("- Playbook actions were executed and persisted (locks/blocks).");
  console.log("- Forensics export includes those events and shows increasing recordCount.");

  // If you want stronger “real detection”, you MUST have server-side rules that
  // trigger from observed traffic patterns, not from playbook calls.
  return { burst, playbookOut, forensics };
}

runSecuritySimulation()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("\n💥 Exercise failed:", e);
    process.exit(1);
  });

export {};