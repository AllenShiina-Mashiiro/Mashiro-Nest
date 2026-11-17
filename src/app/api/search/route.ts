import { NextResponse } from "next/server";
import { searchAll } from "@/lib/data";
import { truncate } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (!query) {
    return NextResponse.json({ posts: [], moments: [], users: [] });
  }

  const result = await searchAll(query);

  return NextResponse.json(
    {
      posts: result.posts.slice(0, 6).map((post) => ({
        slug: post.slug,
        title: post.title,
        description: truncate(post.description, 90),
        date: post.date,
        category: post.category?.name ?? null,
        author: post.author?.displayName ?? null,
      })),
      moments: result.moments.slice(0, 3).map((moment) => ({
        id: moment.id,
        content: truncate(moment.content, 80),
        date: moment.createdAt,
        author: moment.author?.displayName ?? null,
      })),
      users: result.users.map((user) => ({
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: truncate(user.bio, 60),
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
