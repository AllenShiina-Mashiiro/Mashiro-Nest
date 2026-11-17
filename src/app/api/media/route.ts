import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { MediaError, listMedia, saveUpload } from "@/lib/media";
import { listMediaWithUsage } from "@/lib/media-refs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const items = await listMediaWithUsage();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "没有收到文件" }, { status: 400 });
  }

  try {
    const item = await saveUpload(file);
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof MediaError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "上传失败，请稍后再试" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "没有权限" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { key?: string };
  if (!body.key) return NextResponse.json({ error: "缺少 key" }, { status: 400 });

  const { deleteMediaByKey, MediaError } = await import("@/lib/media");
  try {
    await deleteMediaByKey(body.key);
    const items = await listMedia();
    return NextResponse.json({ ok: true, remaining: items.length });
  } catch (error) {
    if (error instanceof MediaError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "删除媒体失败" }, { status: 500 });
  }
}
