import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { subscribeUser } from "@/lib/events";
import { unreadNotificationCount } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** SSE：有人点赞/评论/关注时，立刻把新的未读数推给铃铛。 */
export async function GET() {
  const session = await getSession();
  if (!session) return new Response("unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (count: number) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ count })}\n\n`));
        } catch {
          // 连接已关闭
        }
      };

      send(await unreadNotificationCount(session.id));
      unsubscribe = subscribeUser(session.id, (event) => send(event.count));
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          // ignore
        }
      }, 25_000);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
