import { WebSocketServer } from "ws";
import pg from "pg";

const { Client } = pg;

/* ── Types ── */
type ClientSub = { topics: Set<string> };

function isRealtimeEnabled() {
    return process.env.REALTIME_ENABLED === "true";
}

export async function startRealtimeGateway() {
    if (!isRealtimeEnabled()) {
        console.warn("[Gateway] REALTIME_ENABLED is false; gateway not started");
        return;
    }

    const port = Number(process.env.REALTIME_PORT || 3001);
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error("Missing DATABASE_URL");
    }

    /* ── WebSocket Server ── */
    const wss = new WebSocketServer({ port, path: "/control" });
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
        ws.send(JSON.stringify({ topic: "connected", data: { ok: true, port } }));

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
    const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
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

    console.log(`[Gateway] Realtime gateway running on ws://localhost:${port}/control`);
    console.log(`[Gateway] Listening on channels: control_events, alerts, actions, killswitches`);
    console.log(`[Gateway] ${clients.size} clients connected`);

    return {
        close: async () => {
            client.removeAllListeners("notification");
            await client.end();
            wss.close();
        },
    };
}

if (process.env.NODE_ENV !== "test") {
    startRealtimeGateway().catch((e) => {
        console.error("[Gateway] Fatal error:", e);
        process.exit(1);
    });
}
