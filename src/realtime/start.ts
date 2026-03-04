import { startRealtimeGateway } from "./gateway";

startRealtimeGateway()
    .then(() => {
        console.log("[Gateway] started");
    })
    .catch((e) => {
        console.error("[Gateway] fatal:", e);
        process.exit(1);
    });
