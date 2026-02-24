/**
 * 🌐 GSOCC API — Orchestrator Status Endpoint
 * Route: GET /api/orchestrator/status
 * Route: POST /api/orchestrator/status
 *
 * Provides a real-time view of the Hive Brain state for the GSOCC dashboard.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSystemStatus } from "@/lib/orchestrator/core";
import { enqueueTask } from "@/lib/orchestrator/queue";
import type { TaskType } from "@/lib/orchestrator/queue";

type SessionUser = { role?: string };

// GET — Real-time system status for the GSOCC Dashboard
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getSystemStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[API /orchestrator/status] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST — Manually enqueue a task from the GSOCC Dashboard
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, payload, priority } = body as {
      type: TaskType;
      payload?: Record<string, unknown>;
      priority?: number;
    };

    if (!type) {
      return NextResponse.json({ error: "Task type is required" }, { status: 400 });
    }

    const task = await enqueueTask(type, payload || {}, priority || 10);
    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
