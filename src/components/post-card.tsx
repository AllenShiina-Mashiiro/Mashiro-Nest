import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  FolderOpen,
  Hash,
  PenLine,
  Pin,
} from "lucide-react";
import type { PostSummary } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { MobilePostCard } from "@/components/mobile-post-card";

export function PostCard({ post, index = 0 }: { post: PostSummary; index?: number }) {
  return (
    <>
      <div className="sm:hidden">
        <MobilePostCard post={post} />
      </div>

      <article
        style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
        className="group relative hidden animate-fade-up overflow-hidden rounded-[1.35rem] border border-white/70 bg-white/80 shadow-[0_10px_30px_-22px_rgba(26,31,43,0.55)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-mint-200 hover:shadow-[0_22px_44px_-28px_rgba(26,31,43,0.6)] sm:block dark:border-white/10 dark:bg-white/[0.045] dark:hover:border-mint-400/30"
      >
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[86px]">
          <div className="slash-panel h-full w-full bg-gradient-to-b from-mint-100/95 via-mint-100/70 to-mint-200/45 dark:from-mint-400/20 dark:via-mint-400/14 dark:to-mint-400/[0.06]" />
        </div>

        <Link
          href={`/posts/${post.slug}`}
          aria-label={post.title}
          className="absolute inset-y-0 right-0 z-20 grid w-[86px] place-items-center"
        >
          <span className="grid h-20 w-8 place-items-center rounded-full bg-white/70 text-mint-500 ring-1 ring-white/80 transition duration-300 group-hover:bg-white group-hover:text-sakura-500 dark:bg-white/10 dark:text-mint-300 dark:ring-white/10 dark:group-hover:bg-white/20">
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>

        <div className="relative z-10 p-5 pr-[92px]">
          <h3 className="flex items-start gap-2 text-[1.02rem] font-bold leading-snug text-ink-900 dark:text-white/95">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mint-100 text-mint-500 dark:bg-mint-400/15 dark:text-mint-300">
              {post.pinned ? <Pin className="h-3 w-3" /> : <PenLine className="h-3 w-3" />}
            </span>
            <Link
              href={`/posts/${post.slug}`}
              className="transition group-hover:text-sakura-500 dark:group-hover:text-sakura-300"
            >
              {post.title}
            </Link>
          </h3>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] text-ink-400 dark:text-ink-300/80">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(post.date)}
            </span>

            {post.category ? (
              <Link
                href={`/categories/${post.category.slug}`}
                className="inline-flex items-center gap-1 transition hover:text-mint-500"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                {post.category.name}
              </Link>
            ) : null}

            {post.tags.length ? (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                {post.tags.slice(0, 3).map((tag) => (
                  <Link key={tag.slug} href={`/tags/${tag.slug}`} className="tag-chip">
                    {tag.name}
                  </Link>
                ))}
              </span>
            ) : null}
          </div>

          {post.description ? (
            <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-ink-500 dark:text-ink-300/85">
              {post.description}
            </p>
          ) : null}

          <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-400 dark:text-ink-300/70">
            <span>{post.wordCount.toLocaleString("en-US")} words</span>
            <span className="h-3 w-px bg-ink-200 dark:bg-white/15" />
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              {post.readingTime} min
            </span>
            {post.featured ? (
              <span className="ml-auto rounded-full bg-sakura-100 px-2 py-0.5 text-[10px] font-semibold text-sakura-500 dark:bg-sakura-400/15 dark:text-sakura-300">
                精选
              </span>
            ) : null}
          </div>
        </div>
      </article>
    </>
  );
}

export function PostCardSkeleton() {
  return (
    <div className={cn("h-[150px] animate-pulse rounded-[1.35rem] bg-white/60 dark:bg-white/5")} />
  );
}
