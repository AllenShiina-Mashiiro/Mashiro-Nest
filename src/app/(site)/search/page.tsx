import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareText, Search, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { UserAvatar } from "@/components/user-avatar";
import { searchAll } from "@/lib/data";
import { formatDate, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "搜索",
  description: "搜索文章、动态与用户。",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const results = query ? await searchAll(query) : { posts: [], moments: [], users: [] };
  const total = results.posts.length + results.moments.length + results.users.length;

  return (
    <>
      <PageHeader
        eyebrow="Search"
        title="搜索"
        description="文章、朋友圈动态与用户，一次搜完。也可以随时按下 ⌘K / Ctrl+K。"
      >
        <form action="/search" method="get" className="mt-6 flex max-w-xl items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="输入关键词…"
              autoFocus
              className="h-11 w-full rounded-full border border-white/70 bg-white/80 pl-10 pr-10 text-[13px] text-ink-800 shadow-[0_10px_30px_-22px_rgba(26,31,43,0.6)] outline-none backdrop-blur transition placeholder:text-ink-300 focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
            {query ? (
              <Link
                href="/search"
                aria-label="清除"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300 transition hover:text-ink-500"
              >
                <X className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
          <button
            type="submit"
            className="h-11 shrink-0 rounded-full bg-gradient-to-br from-mint-400 to-mint-500 px-5 text-[12.5px] font-semibold text-white shadow-[0_14px_28px_-16px_rgba(76,186,155,0.95)] transition hover:-translate-y-0.5"
          >
            搜索
          </button>
        </form>
      </PageHeader>

      <div className="mx-auto max-w-[900px] px-4 pb-10">
        {query ? (
          <p className="mb-4 px-1 text-[11.5px] text-ink-400">
            关键词「<span className="font-semibold text-mint-500">{query}</span>」共命中 {total} 条
          </p>
        ) : (
          <p className="mb-4 px-1 text-[11.5px] text-ink-400">输入关键词开始搜索。</p>
        )}

        {results.posts.length ? (
          <section className="mb-8">
            <h2 className="section-title mb-3">文章 · {results.posts.length}</h2>
            <div className="grid gap-4">
              {results.posts.map((post, index) => (
                <PostCard key={post.slug} post={post} index={index} />
              ))}
            </div>
          </section>
        ) : null}

        {results.moments.length ? (
          <section className="mb-8">
            <h2 className="section-title mb-3">动态 · {results.moments.length}</h2>
            <div className="grid gap-2.5">
              {results.moments.map((moment) => (
                <Link
                  key={moment.id}
                  href="/moments"
                  className="card-soft flex items-start gap-3 p-3.5 transition hover:border-mint-200"
                >
                  <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-sakura-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] leading-relaxed text-ink-700 dark:text-ink-200/90">
                      {truncate(moment.content, 140)}
                    </span>
                    <span className="mt-1 block text-[10.5px] text-ink-400">
                      {moment.author?.displayName ?? "匿名"} · {formatDate(moment.createdAt)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {results.users.length ? (
          <section>
            <h2 className="section-title mb-3">用户 · {results.users.length}</h2>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {results.users.map((user) => (
                <Link
                  key={user.id}
                  href={`/u/${user.username}`}
                  className="card-soft flex items-center gap-3 p-3.5 transition hover:border-mint-200"
                >
                  <UserAvatar user={user} size={38} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold text-ink-800 dark:text-white/90">
                      {user.displayName}
                    </span>
                    <span className="block truncate text-[10.5px] text-ink-400">
                      @{user.username} · {user.bio || "这个人很懒"}
                    </span>
                  </span>
                  <span className="text-[10.5px] text-ink-300">{user.postCount} 篇</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {query && total === 0 ? (
          <div className="card grid place-items-center gap-2 px-6 py-16 text-center">
            <p className="text-sm font-semibold text-ink-700 dark:text-white/90">没有找到相关内容</p>
            <p className="text-xs text-ink-400">换一个关键词，或者去归档里翻翻。</p>
            <Link
              href="/archive"
              className="mt-1 rounded-full bg-mint-100 px-3 py-1.5 text-[11.5px] font-semibold text-mint-600 transition hover:bg-mint-200 dark:bg-mint-400/15 dark:text-mint-300"
            >
              查看归档
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}
