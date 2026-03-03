import { WebSocketServer } from "ws";
import pg from "pg";

const { Client } = pg;

const PORT = Number(process.env.REALTIME_PORT || 3001);
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
}

/* ── Types ── */
type ClientSub = { topics: Set<string> };

/* ── WebSocket Server ── */
const wss = new WebSocketServer({ port: PORT, path: "/control" });
const clients = new Map<any, ClientSub>();

function broadcast(topic: string, data: unknown) {
    const msg = JSON.stringify({ topic, data, ts: new Date().toISOString() });
    for (const [ws, sub] of clients.entries()) {
        if (ws.readyState !== ws.OPEN) continue;
        if (!sub.topics.has(topic) && !sub.topics.has("*")) continue;
        ws.send(msg);
    }
}

wss.on("connection", (ws) => {
    // Default: subscribe to all topics
    clients.set(ws, { topics: new Set(["control_events", "alerts", "actions", "killswitches"]) });
    ws.send(JSON.stringify({ topic: "connected", data: { ok: true, port: PORT } }));

    ws.on("message", (raw) => {
        try {
            const m = JSON.parse(raw.toString());
            if (m?.action === "subscribe" && Array.isArray(m.topics)) {
                const sub = clients.get(ws);
                if (sub) {
                    sub.topics = new Set(m.topics.map(String));
                    ws.send(JSON.stringify({ topic: "subscribed", data: Array.from(sub.topics) }));
                }
            }
            if (m?.action === "ping") {
                ws.send(JSON.stringify({ topic: "pong", data: { ts: Date.now() } }));
            }
        } catch {
            // ignore malformed messages
        }
    });

    ws.on("close", () => clients.delete(ws));
});

/* ── Postgres LISTEN ── */
async function main() {
    const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log("[Gateway] Connected to Postgres");

    // Listen on channels
    await client.query("LISTEN control_events_channel");
    await client.query("LISTEN alerts_channel");
    await client.query("LISTEN actions_channel");
    await client.query("LISTEN killswitch_channel");

    client.on("notification", (msg) => {
        if (!msg.channel || !msg.payload) return;

        let parsed: any;
        try {
            parsed = JSON.parse(msg.payload);
        } catch {
            return;
        }

        const channelTopicMap: Record<string, string> = {
            control_events_channel: "control_events",
            alerts_channel: "alerts",
            actions_channel: "actions",
            killswitch_channel: "killswitches",
        };

        const topic = channelTopicMap[msg.channel];
        if (topic) {
            broadcast(topic, parsed);
        }
    });

    console.log(`[Gateway] Realtime gateway running on ws://localhost:${PORT}/control`);
    console.log(`[Gateway] Listening on channels: control_events, alerts, actions, killswitches`);
    console.log(`[Gateway] ${clients.size} clients connected`);
}

main().catch((e) => {
    console.error("[Gateway] Fatal error:", e);
    process.exit(1);
});
