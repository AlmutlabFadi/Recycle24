"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds
const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes → IDLE
const OFFLINE_TIMEOUT = 15 * 60 * 1000; // 15 minutes → OFFLINE (auto-logout from system)

export type StaffStatus = "ONLINE" | "IDLE" | "OFFLINE" | "BREAK";

interface HeartbeatProps {
    onStatusChange?: (status: StaffStatus) => void;
}

export default function StaffActivityHeartbeat({ onStatusChange }: HeartbeatProps) {
    const [status, setStatus] = useState<StaffStatus>("ONLINE");
    const [isOnBreak, setIsOnBreak] = useState(false);
    const lastInteractionRef = useRef<number>(Date.now());
    const statusRef = useRef<StaffStatus>("ONLINE");

    // Keep statusRef in sync
    useEffect(() => {
        statusRef.current = status;
        onStatusChange?.(status);
    }, [status, onStatusChange]);

    // Send heartbeat to server
    const sendHeartbeat = useCallback(async (s: StaffStatus) => {
        try {
            await fetch("/api/admin/staff/heartbeat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: s }),
            });
        } catch (err) {
            console.error("Heartbeat failed", err);
        }
    }, []);

    // Handle user returning from break
    const endBreak = useCallback(() => {
        if (isOnBreak) {
            setIsOnBreak(false);
            setStatus("ONLINE");
            lastInteractionRef.current = Date.now();
            sendHeartbeat("ONLINE");
        }
    }, [isOnBreak, sendHeartbeat]);

    // Start break (called externally via window event)
    const startBreak = useCallback(() => {
        setIsOnBreak(true);
        setStatus("BREAK");
        sendHeartbeat("BREAK");
    }, [sendHeartbeat]);

    useEffect(() => {
        // Listen for break toggle events from other components
        const handleBreakToggle = (e: CustomEvent) => {
            if (e.detail?.action === "start") {
                startBreak();
            } else {
                endBreak();
            }
        };

        window.addEventListener("staff-break-toggle" as any, handleBreakToggle);

        const handleInteraction = () => {
            lastInteractionRef.current = Date.now();

            // If on break, return from break on any interaction
            if (statusRef.current === "BREAK") {
                setIsOnBreak(false);
                setStatus("ONLINE");
                sendHeartbeat("ONLINE");
                return;
            }

            // If was IDLE or OFFLINE, come back to ONLINE
            if (statusRef.current !== "ONLINE") {
                setStatus("ONLINE");
                sendHeartbeat("ONLINE");
            }
        };

        // Track user interactions
        window.addEventListener("mousemove", handleInteraction);
        window.addEventListener("keydown", handleInteraction);
        window.addEventListener("click", handleInteraction);
        window.addEventListener("scroll", handleInteraction);

        // Idle/Offline detection
        const idleCheckInterval = setInterval(() => {
            // Don't change status while on break (break is manual)
            if (statusRef.current === "BREAK") return;

            const elapsed = Date.now() - lastInteractionRef.current;

            if (elapsed > OFFLINE_TIMEOUT) {
                if (statusRef.current !== "OFFLINE") {
                    setStatus("OFFLINE");
                    sendHeartbeat("OFFLINE");
                }
            } else if (elapsed > IDLE_TIMEOUT) {
                if (statusRef.current !== "IDLE") {
                    setStatus("IDLE");
                    sendHeartbeat("IDLE");
                }
            }
        }, 10 * 1000); // Check every 10 seconds

        // Periodic heartbeat to keep server updated
        const heartbeatInterval = setInterval(() => {
            sendHeartbeat(statusRef.current);
        }, HEARTBEAT_INTERVAL);

        // Send initial ONLINE heartbeat (login event)
        sendHeartbeat("ONLINE");

        // On page unload, send OFFLINE
        const handleUnload = () => {
            navigator.sendBeacon(
                "/api/admin/staff/heartbeat",
                JSON.stringify({ status: "OFFLINE" })
            );
        };
        window.addEventListener("beforeunload", handleUnload);

        return () => {
            window.removeEventListener("mousemove", handleInteraction);
            window.removeEventListener("keydown", handleInteraction);
            window.removeEventListener("click", handleInteraction);
            window.removeEventListener("scroll", handleInteraction);
            window.removeEventListener("beforeunload", handleUnload);
            window.removeEventListener("staff-break-toggle" as any, handleBreakToggle);
            clearInterval(idleCheckInterval);
            clearInterval(heartbeatInterval);
        };
    }, [sendHeartbeat, startBreak, endBreak]);

    return null; // Hidden component — rendering handled by parent
}
