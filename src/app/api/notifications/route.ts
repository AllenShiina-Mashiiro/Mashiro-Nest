import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listNotifications, markNotificationsRead, unreadNotificationCount } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const url = new URL(request.url);
  if (url.searchParams.get("unread") === "1") {
    const count = await unreadNotificationCount(session.id);
    return NextResponse.json({ count });
  }

  const items = await listNotifications(session.id, 20);
  const count = await unreadNotificationCount(session.id);
  return NextResponse.json({ items, count });
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  await markNotificationsRead(session.id);
  return NextResponse.json({ ok: true });
}
