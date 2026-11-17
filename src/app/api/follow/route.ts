import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { followUser, getUser, isFollowing, unfollowUser } from "@/lib/data";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { userId?: string; action?: string };
  const targetId = body.userId?.trim();
  if (!targetId) return NextResponse.json({ error: "缺少用户" }, { status: 400 });
  if (targetId === session.id) {
    return NextResponse.json({ error: "不能关注自己" }, { status: 400 });
  }

  const target = await getUser(targetId);
  if (!target) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  const action = body.action === "unfollow" ? "unfollow" : "follow";
  if (action === "follow") await followUser(session.id, targetId);
  else await unfollowUser(session.id, targetId);

  const [following, updated, targetFollowsMe] = await Promise.all([
    isFollowing(session.id, targetId),
    getUser(targetId),
    isFollowing(targetId, session.id),
  ]);

  return NextResponse.json({
    following,
    followsMe: targetFollowsMe,
    followers: updated?.followers ?? target.followers,
  });
}
