import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createMoment, deleteMoment, getMoments, updateMoment } from "@/lib/data";

export const runtime = "nodejs";

async function ownedMoment(id: string, userId: string, role: string) {
  const moments = await getMoments(500);
  const moment = moments.find((item) => item.id === id);
  if (!moment) return null;
  if (role !== "ADMIN" && moment.author?.id !== userId) return null;
  return moment;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    content?: string;
    images?: string[];
    location?: string | null;
  } | null;
  if (!body) return NextResponse.json({ error: "请求格式不正确" }, { status: 400 });

  const content = (body.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "写点什么再发布吧" }, { status: 400 });
  if (content.length > 2000) {
    return NextResponse.json({ error: "内容不能超过 2000 字" }, { status: 400 });
  }

  const moment = await createMoment(session.id, {
    content,
    images: Array.isArray(body.images) ? body.images.slice(0, 9) : [],
    location: body.location?.trim() || null,
  });

  return NextResponse.json({ moment });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    content?: string;
    images?: string[];
    location?: string | null;
  } | null;
  if (!body?.id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  const owned = await ownedMoment(body.id, session.id, session.role);
  if (!owned) return NextResponse.json({ error: "没有权限" }, { status: 403 });

  const content = (body.content ?? "").trim();
  if (!content) return NextResponse.json({ error: "内容不能为空" }, { status: 400 });

  const moment = await updateMoment(body.id, {
    content,
    images: Array.isArray(body.images) ? body.images.slice(0, 9) : [],
    location: body.location?.trim() || null,
  });

  return NextResponse.json({ moment });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  const owned = await ownedMoment(body.id, session.id, session.role);
  if (!owned) return NextResponse.json({ error: "没有权限" }, { status: 403 });

  await deleteMoment(body.id);
  return NextResponse.json({ ok: true });
}
