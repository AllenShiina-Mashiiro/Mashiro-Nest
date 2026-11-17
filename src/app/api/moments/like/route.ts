import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { toggleMomentLike } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { momentId?: string } | null;
  const momentId = typeof body?.momentId === "string" ? body.momentId : "";
  if (!momentId) return NextResponse.json({ error: "缺少 momentId" }, { status: 400 });

  const result = await toggleMomentLike(momentId, session.id);
  return NextResponse.json(result);
}
