import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  FileText,
  PenLine,
  Pin,
} from "lucide-react";
import type { PostSummary } from "@/lib/types";
import { formatDate } from "@/lib/utils";

/**
 * 手机端文章卡片：对应参考图的「白色圆角卡 + 封面 + 标题/箭头 + 图标信息条 + 描述 + 标签」。
 */
export function MobilePostCard({ post }: { post: PostSummary }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_18px_-12px_rgba(24,32,48,0.35)] ring-1 ring-black/[0.03] dark:bg-[#151b26] dark:ring-white/[0.06]">
      {post.cover ? (
        <Link href={`/posts/${post.slug}`} aria-label={post.title}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover}
            alt=""
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
        </Link>
      ) : null}

      <div className="p-4">
        <div className="flex items-start gap-2">
          {post.pinned ? (
            <Pin className="mt-1 h-4 w-4 shrink-0 -rotate-12 text-[#3d9be9]" />
          ) : null}
          <Link
            href={`/posts/${post.slug}`}
            className="flex-1 text-[17px] font-bold leading-snug text-ink-900 dark:text-white/95"
          >
            {post.title}
          </Link>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#3d9be9]" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-500 dark:text-ink-300">
          <span className="inline-flex items-center gap-1 rounded-md bg-ink-100/70 px-1.5 py-1 dark:bg-white/10">
            <CalendarDays className="h-3 w-3 text-ink-400" />
            {formatDate(post.date)}
          </span>
          {post.category ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-ink-100/70 px-1.5 py-1 dark:bg-white/10">
              <BookOpen className="h-3 w-3 text-ink-400" />
              {post.category.name}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-md bg-ink-100/70 px-1.5 py-1 dark:bg-white/10">
            <FileText className="h-3 w-3 text-ink-400" />
            {post.wordCount} words
          </span>
        </div>

        {post.description ? (
          <p className="mt-3 text-[13px] leading-relaxed text-ink-500 dark:text-ink-300/85">
            {post.description}
          </p>
        ) : null}

        {post.tags.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {post.tags.slice(0, 4).map((tag) => (
              <Link
                key={tag.slug}
                href={`/tags/${tag.slug}`}
                className="rounded-md bg-[#e8f1fb] px-2 py-1 text-[11px] text-[#3d7fb8] dark:bg-sky-400/10 dark:text-sky-300"
              >
                # {tag.name}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-1.5 text-[10.5px] text-ink-300">
          <PenLine className="h-3 w-3" />
          {post.author?.displayName ?? "Mizuki"} · {post.readingTime} 分钟
        </div>
      </div>
    </article>
  );
}
