import { NextResponse } from "next/server";
import { getPost, recordView } from "@/lib/data";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { slug?: string };
    const slug = body.slug?.trim();
    if (!slug) {
      return NextResponse.json({ error: "缺少 slug" }, { status: 400 });
    }

    const post = await getPost(slug);
    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const delta = await recordView(slug);
    return NextResponse.json({
      slug,
      views: post.views + Math.max(0, delta),
    });
  } catch {
    return NextResponse.json({ error: "统计失败" }, { status: 500 });
  }
}
