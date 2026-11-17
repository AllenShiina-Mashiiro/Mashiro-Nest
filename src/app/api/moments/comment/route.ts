import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { addMomentComment, removeMomentComment, updateMomentComment } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | { momentId?: string; content?: string }
    | null;

  const momentId = typeof body?.momentId === "string" ? body.momentId : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!momentId) return NextResponse.json({ error: "缺少 momentId" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "评论不能为空" }, { status: 400 });
  if (content.length > 500) {
    return NextResponse.json({ error: "评论最多 500 字" }, { status: 400 });
  }

  const comment = await addMomentComment(momentId, session.id, content);
  return NextResponse.json({ comment });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const url = new URL(request.url);
  const commentId = url.searchParams.get("id") ?? "";
  if (!commentId) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  await removeMomentComment(commentId, session.id, session.role === "ADMIN");
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | { id?: string; content?: string }
    | null;

  const id = typeof body?.id === "string" ? body.id : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "评论不能为空" }, { status: 400 });

  const comment = await updateMomentComment(id, session.id, content, session.role === "ADMIN");
  if (!comment) return NextResponse.json({ error: "没有权限修改" }, { status: 403 });

  return NextResponse.json({ comment });
}
