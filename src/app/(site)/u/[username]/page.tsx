import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Send, Github, Link2, MessageSquareText } from "lucide-react";
import { FollowButton } from "@/components/follow-button";
import { FollowStats } from "@/components/follow-stats";
import { PostCard } from "@/components/post-card";
import { UserAvatar } from "@/components/user-avatar";
import { getSession } from "@/lib/auth";
import {
  getMoments,
  getPosts,
  getUserByUsername,
  isFollowing,
  listFollowers,
  listFollowing,
} from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) return { title: "用户不存在" };
  return {
    title: `${user.displayName} (@${user.username})`,
    description: user.bio || `${user.displayName} 的个人主页`,
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();

  const [posts, moments, followers, following, session] = await Promise.all([
    getPosts({ authorId: user.id }),
    getMoments(200),
    listFollowers(user.id),
    listFollowing(user.id),
    getSession(),
  ]);

  const ownMoments = moments.filter((moment) => moment.author?.id === user.id).slice(0, 6);
  const followingThis = session ? await isFollowing(session.id, user.id) : false;
  const isSelf = session?.id === user.id;

  return (
    <>
      <section className="relative">
        <div className="relative h-40 w-full overflow-hidden sm:h-56">
          {user.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.bannerUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(120deg,#f9d5e5,#dfe9ff_45%,#d5f3e8)] dark:bg-[linear-gradient(120deg,#3a2b3c,#22314a_45%,#1e3a35)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-paper/10 via-transparent to-paper dark:to-night" />
        </div>

        <div className="mx-auto max-w-[1180px] px-4">
          <div className="relative -mt-14 flex flex-wrap items-end gap-4">
            <UserAvatar
              user={user}
              size={104}
              rounded="rounded-3xl"
              className="ring-4 ring-paper dark:ring-night"
            />
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-ink-900 dark:text-white">
                {user.displayName}
                {user.role === "ADMIN" ? (
                  <span className="rounded-full bg-sakura-100 px-2 py-0.5 text-[10px] font-bold text-sakura-500 dark:bg-sakura-400/15 dark:text-sakura-300">
                    站长
                  </span>
                ) : null}
              </h1>
              <p className="mt-0.5 text-[12px] text-ink-400">
                @{user.username} · {user.status || "这个人很懒"}
              </p>
            </div>

            <div className="flex items-center gap-3 pb-1">
              <FollowStats
                followers={followers}
                following={following}
                counts={{ followers: user.followers, following: user.following }}
              />
              <FollowButton
                userId={user.id}
                initialFollowing={followingThis}
                initialFollowers={user.followers}
                isSelf={Boolean(isSelf)}
                loggedIn={Boolean(session)}
              />
              {isSelf ? (
                <Link
                  href="/admin/profile"
                  className="rounded-full border border-ink-200/80 px-3 py-1.5 text-[11.5px] font-semibold text-ink-500 transition hover:border-mint-300 hover:text-mint-500 dark:border-white/10 dark:text-ink-300"
                >
                  编辑资料
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] text-ink-400">
            {user.bio ? <p className="max-w-2xl text-ink-500 dark:text-ink-300/85">{user.bio}</p> : null}
            {user.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {user.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              加入于 {formatDate(user.createdAt)}
            </span>
            {user.github ? (
              <a
                href={user.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition hover:text-mint-500"
              >
                <Github className="h-3 w-3" /> GitHub
              </a>
            ) : null}
            {user.telegram ? (
              <a
                href={user.telegram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition hover:text-mint-500"
              >
                <Send className="h-3 w-3" /> Telegram
              </a>
            ) : null}
            {user.website ? (
              <a
                href={user.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition hover:text-mint-500"
              >
                <Link2 className="h-3 w-3" /> 个人网站
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[900px] px-4 pt-8 pb-10">
        <h2 className="section-title mb-3">TA 的文章（{user.postCount}）</h2>
        <div className="grid gap-3">
          {posts.map((post, index) => (
            <PostCard key={post.slug} post={post} index={index} />
          ))}
          {posts.length === 0 ? (
            <p className="card grid place-items-center py-12 text-[11.5px] text-ink-400">
              还没有发布文章。
            </p>
          ) : null}
        </div>

        {ownMoments.length ? (
          <>
            <div className="mb-3 mt-8 flex items-end justify-between">
              <h2 className="section-title">TA 的动态（{user.momentCount}）</h2>
              <Link
                href="/moments"
                className="text-[11px] font-semibold text-mint-500 transition hover:text-sakura-500 dark:text-mint-300"
              >
                去朋友圈 →
              </Link>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {ownMoments.map((moment) => (
                <Link
                  key={moment.id}
                  href={`/moments#moment-${moment.id}`}
                  className="card-soft group block p-3.5 transition hover:-translate-y-0.5 hover:border-mint-200"
                >
                  <p className="flex items-center gap-1 text-[10px] text-ink-400">
                    <MessageSquareText className="h-3 w-3" />
                    {formatDate(moment.createdAt)}
                    {moment.location ? ` · ${moment.location}` : ""}
                  </p>
                  <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-ink-600 transition group-hover:text-ink-800 dark:text-ink-200/90 dark:group-hover:text-white">
                    {moment.content}
                  </p>
                  {moment.images.length ? (
                    <p className="mt-1.5 text-[10px] text-ink-300">
                      {moment.images.length} 张图片
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
