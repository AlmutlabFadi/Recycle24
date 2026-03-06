import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sseManager } from "@/lib/realtime/sse-server";

/**
 * GET /api/realtime/events
 * Establishes an SSE connection for the logged-in user.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    let controller: ReadableStreamDefaultController;

    const stream = new ReadableStream({
      start(ctrl) {
        controller = ctrl;
        sseManager.addUser(userId, controller);
      },
      cancel() {
        if (controller) {
          sseManager.removeUser(userId, controller);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("[SSE_CONNECTION_ERROR]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
