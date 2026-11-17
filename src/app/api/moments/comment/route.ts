import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { addMomentComment, removeMomentComment, toggleMomentCommentLike, updateMomentComment } from "@/lib/data";

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

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  try {
    const result = await toggleMomentCommentLike(id, session.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "COMMENT_NOT_FOUND") {
      return NextResponse.json({ error: "评论不存在" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const url = new URL(request.url);
  const commentId = url.searchParams.get("id") ?? "";
  if (!commentId) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  const removed = await removeMomentComment(commentId, session.id, session.role === "ADMIN");
  if (!removed) return NextResponse.json({ error: "评论不存在或没有删除权限" }, { status: 403 });
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

  if (content.length > 500) {
    return NextResponse.json({ error: "评论最多 500 字" }, { status: 400 });
  }
  const comment = await updateMomentComment(id, session.id, content);
  if (!comment) return NextResponse.json({ error: "没有权限修改" }, { status: 403 });

  return NextResponse.json({ comment });
}
