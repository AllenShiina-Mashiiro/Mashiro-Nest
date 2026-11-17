import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Eye,
  FileText,
  HardDrive,
  MessageSquareText,
  PenLine,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { getSession } from "@/lib/auth";
import { getMoments, getPosts, getStats, listUsers } from "@/lib/data";
import { hasRedis } from "@/lib/redis";
import { storageStatus } from "@/lib/media";
import { formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "概览",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";
  const storage = storageStatus();

  const [allPosts, stats, users, moments] = await Promise.all([
    getPosts({ drafts: true }),
    getStats(),
    listUsers(),
    getMoments(5),
  ]);

  const posts = isAdmin ? allPosts : allPosts.filter((post) => post.author?.id === session?.id);
  const recent = posts.slice(0, 6);

  const cards = [
    { label: isAdmin ? "全部文章" : "我的文章", value: posts.length, icon: FileText, tint: "text-mint-500 bg-mint-50 dark:bg-mint-400/10" },
    { label: "用户", value: stats.users, icon: Users, tint: "text-sakura-500 bg-sakura-50 dark:bg-sakura-400/10" },
    { label: "朋友圈", value: stats.moments, icon: MessageSquareText, tint: "text-mint-500 bg-mint-50 dark:bg-mint-400/10" },
    { label: "总阅读", value: formatNumber(stats.views), icon: Eye, tint: "text-mint-500 bg-mint-50 dark:bg-mint-400/10" },
  ];

  const systems = [
    { label: "数据库", value: "PostgreSQL", ok: true, icon: HardDrive },
    { label: "缓存", value: hasRedis() ? "Redis" : "内存（降级）", ok: hasRedis(), icon: Zap },
    {
      label: "对象存储",
      value: storage.driver === "s3" ? `S3 · ${storage.bucket ?? ""}` : "本地 public/uploads",
      ok: storage.driver === "s3",
      icon: HardDrive,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar user={session!} size={44} />
          <div>
            <h1 className="text-xl font-bold text-ink-900 dark:text-white">
              你好，{session?.displayName}
            </h1>
            <p className="mt-0.5 text-[12px] text-ink-400">
              共 {stats.posts} 篇文章、{stats.users} 位用户、{stats.moments} 条动态 · 站点已运行{" "}
              {stats.days} 天
            </p>
          </div>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-mint-400 to-mint-500 px-4 py-2 text-[12px] font-semibold text-white shadow-[0_14px_26px_-16px_rgba(76,186,155,0.95)] transition hover:-translate-y-0.5"
        >
          <PenLine className="h-3.5 w-3.5" />
          写新文章
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-ink-100 bg-white/80 p-4 shadow-[0_10px_26px_-24px_rgba(26,31,43,0.6)] dark:border-white/8 dark:bg-white/[0.04]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-ink-400">{card.label}</span>
              <span className={`grid h-7 w-7 place-items-center rounded-lg ${card.tint}`}>
                <card.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-ink-100 bg-white/80 dark:border-white/8 dark:bg-white/[0.04]">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-white/8">
            <h2 className="text-[13px] font-bold text-ink-800 dark:text-white/90">
              {isAdmin ? "最近文章" : "我的文章"}
            </h2>
            <Link
              href="/admin/posts"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-mint-500 hover:text-sakura-500 dark:text-mint-300"
            >
              全部
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <ul className="divide-y divide-ink-100/80 dark:divide-white/5">
            {recent.map((post) => (
              <li key={post.slug} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    post.draft ? "bg-ink-300" : "bg-mint-400"
                  }`}
                />
                <Link
                  href={`/admin/posts/${post.slug}`}
                  className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink-700 transition hover:text-sakura-500 dark:text-ink-200"
                >
                  {post.title}
                </Link>
                <span className="hidden text-[10.5px] text-ink-300 sm:block">
                  {formatDate(post.date)}
                </span>
                <span className="w-12 text-right text-[10.5px] text-ink-300">
                  {post.draft ? "草稿" : `${post.views} 阅读`}
                </span>
              </li>
            ))}
            {recent.length === 0 ? (
              <li className="px-4 py-8 text-center text-[11.5px] text-ink-400">
                还没有文章，点右上角开始写。
              </li>
            ) : null}
          </ul>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-ink-800 dark:text-white/90">新加入</h2>
              {isAdmin ? (
                <Link href="/admin/users" className="text-[10.5px] font-semibold text-mint-500">
                  管理
                </Link>
              ) : null}
            </div>
            <ul className="mt-3 space-y-2.5">
              {users.slice(0, 4).map((user) => (
                <li key={user.id} className="flex items-center gap-2.5">
                  <UserAvatar user={user} size={28} />
                  <Link href={`/u/${user.username}`} className="min-w-0 flex-1">
                    <span className="block truncate text-[11.5px] font-semibold text-ink-700 dark:text-ink-200">
                      {user.displayName}
                    </span>
                    <span className="block truncate text-[10px] text-ink-400">
                      @{user.username}
                    </span>
                  </Link>
                  {user.role === "ADMIN" ? (
                    <span className="rounded-full bg-sakura-100 px-1.5 py-0.5 text-[9px] font-bold text-sakura-500 dark:bg-sakura-400/15 dark:text-sakura-300">
                      站长
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]">
            <h2 className="text-[13px] font-bold text-ink-800 dark:text-white/90">运行状态</h2>
            <ul className="mt-3 space-y-2.5">
              {systems.map((system) => (
                <li key={system.label} className="flex items-center gap-2.5">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-lg ${
                      system.ok
                        ? "bg-mint-50 text-mint-500 dark:bg-mint-400/10 dark:text-mint-300"
                        : "bg-amber-50 text-amber-500 dark:bg-amber-400/10 dark:text-amber-300"
                    }`}
                  >
                    <system.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] text-ink-400">{system.label}</span>
                    <span className="block truncate text-[11.5px] font-semibold text-ink-700 dark:text-ink-200">
                      {system.value}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {moments.length ? (
            <div className="rounded-2xl border border-dashed border-mint-200 bg-mint-50/70 p-4 dark:border-mint-400/20 dark:bg-mint-400/[0.06]">
              <h2 className="flex items-center gap-1.5 text-[12.5px] font-bold text-mint-600 dark:text-mint-300">
                <MessageSquareText className="h-3.5 w-3.5" />
                最新动态
              </h2>
              <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-mint-700/80 dark:text-mint-200/70">
                {moments[0].content}
              </p>
              <Link
                href="/moments"
                className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-semibold text-mint-600 dark:text-mint-300"
              >
                去朋友圈
                <Sparkles className="h-2.5 w-2.5" />
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
