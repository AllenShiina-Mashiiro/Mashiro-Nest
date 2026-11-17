import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, Clock3, FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getArchive, getStats } from "@/lib/data";
import { formatDateParts, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "归档",
  description: "按年份浏览全部文章。",
};

export default async function ArchivePage() {
  const [groups, stats] = await Promise.all([getArchive(), getStats()]);

  return (
    <>
      <PageHeader
        eyebrow="Archive"
        title="全部归档"
        description={`共 ${stats.posts} 篇文章、${formatNumber(stats.words)} 字，按年份排列。`}
      />

      <div className="mx-auto max-w-[900px] px-4 pb-8">
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.year} className="relative">
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-2xl font-bold text-ink-900 dark:text-white">
                  {group.year}
                </h2>
                <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[10.5px] font-semibold text-mint-600 dark:bg-mint-400/15 dark:text-mint-300">
                  {group.posts.length} 篇
                </span>
                <span className="hairline flex-1" />
              </div>

              <div className="relative space-y-2 border-l border-ink-200/70 pl-6 dark:border-white/10">
                {group.posts.map((post) => {
                  const parts = formatDateParts(post.date);
                  return (
                    <div key={post.slug} className="group relative">
                      <span className="absolute -left-[27px] top-[15px] h-2.5 w-2.5 rounded-full border-2 border-white bg-mint-300 transition group-hover:bg-sakura-400 dark:border-night" />
                      <Link
                        href={`/posts/${post.slug}`}
                        className="block rounded-2xl px-3 py-2.5 transition hover:bg-white/70 dark:hover:bg-white/5"
                      >
                        <div className="flex items-baseline gap-3">
                          <span className="w-11 shrink-0 font-mono text-[11px] text-ink-300">
                            {parts.month}/{parts.day}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink-800 transition group-hover:text-sakura-500 dark:text-white/90 dark:group-hover:text-sakura-300">
                            {post.title}
                          </span>
                          <span className="hidden shrink-0 items-center gap-3 text-[10.5px] text-ink-400 sm:flex">
                            {post.category ? (
                              <span className="inline-flex items-center gap-1">
                                <FolderOpen className="h-3 w-3" />
                                {post.category.name}
                              </span>
                            ) : null}
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3 w-3" />
                              {post.readingTime}m
                            </span>
                          </span>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 flex items-center justify-center gap-2 text-[11px] text-ink-300">
          <CalendarDays className="h-3 w-3" />
          最后更新 {new Date(stats.updatedAt).toLocaleDateString("zh-CN")}
        </div>
      </div>
    </>
  );
}
