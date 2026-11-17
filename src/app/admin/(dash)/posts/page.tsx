import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, FileText, PenLine } from "lucide-react";
import { PostRowActions } from "@/components/admin/post-actions";
import { UserAvatar } from "@/components/user-avatar";
import { getSession } from "@/lib/auth";
import { getPosts } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "文章管理",
  robots: { index: false, follow: false },
};

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";
  const all = await getPosts({ drafts: true });
  const posts = isAdmin ? all : all.filter((post) => post.author?.id === session?.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-white">
            {isAdmin ? "文章" : "我的文章"}
          </h1>
          <p className="mt-1 text-[12px] text-ink-400">
            共 {posts.length} 篇 · 已发布 {posts.filter((post) => !post.draft).length} 篇
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-mint-400 to-mint-500 px-4 py-2 text-[12px] font-semibold text-white shadow-[0_14px_26px_-16px_rgba(76,186,155,0.95)] transition hover:-translate-y-0.5"
        >
          <PenLine className="h-3.5 w-3.5" />
          新建
        </Link>
      </div>

      {params.saved ? (
        <p className="flex items-center gap-1.5 rounded-xl bg-mint-50 px-3 py-2 text-[11.5px] font-medium text-mint-600 dark:bg-mint-400/10 dark:text-mint-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          已保存 <code className="font-mono">{params.saved}</code>
        </p>
      ) : null}

      {params.deleted ? (
        <p className="rounded-xl bg-ink-100/70 px-3 py-2 text-[11.5px] font-medium text-ink-600 dark:bg-white/5 dark:text-ink-300">
          文章已删除。
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white/80 dark:border-white/8 dark:bg-white/[0.04]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[12px]">
            <thead className="bg-ink-50/60 text-[10.5px] uppercase tracking-wide text-ink-400 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">标题</th>
                <th className="px-3 py-2.5 font-semibold">作者</th>
                <th className="px-3 py-2.5 font-semibold">状态</th>
                <th className="px-3 py-2.5 font-semibold">日期</th>
                <th className="px-3 py-2.5 text-right font-semibold">阅读</th>
                <th className="px-4 py-2.5 text-right font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100/80 dark:divide-white/5">
              {posts.map((post) => (
                <tr key={post.slug} className="transition hover:bg-mint-50/40 dark:hover:bg-white/[0.03]">
                  <td className="max-w-[280px] px-4 py-2.5">
                    <Link
                      href={`/admin/posts/${post.slug}`}
                      className="flex items-center gap-2 font-medium text-ink-800 hover:text-sakura-500 dark:text-white/90"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-ink-300" />
                      <span className="truncate">{post.title}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <UserAvatar user={post.author} size={18} />
                      <span className="max-w-[80px] truncate text-[11px] text-ink-500 dark:text-ink-300">
                        {post.author?.displayName ?? "—"}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        post.draft
                          ? "bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-300"
                          : "bg-mint-100 text-mint-600 dark:bg-mint-400/15 dark:text-mint-300"
                      }`}
                    >
                      {post.draft ? "草稿" : "已发布"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-ink-400">{formatDate(post.date)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink-400">{post.views}</td>
                  <td className="px-4 py-2.5">
                    <PostRowActions
                      slug={post.slug}
                      published={!post.draft}
                      canManage={isAdmin || post.author?.id === session?.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {posts.length === 0 ? (
          <p className="px-4 py-12 text-center text-[11.5px] text-ink-400">还没有任何文章。</p>
        ) : null}
      </div>
    </div>
  );
}
