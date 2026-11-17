import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  FolderOpen,
  Hash,
  Type,
} from "lucide-react";
import { ReadingProgress } from "@/components/reading-progress";
import { TableOfContents } from "@/components/table-of-contents";
import { ViewCounter } from "@/components/view-counter";
import { UserAvatar } from "@/components/user-avatar";
import { siteConfig } from "@/lib/config";
import { getNeighbours, getPost, getPosts } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "文章不存在" };

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags.map((tag) => tag.name),
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `${siteConfig.url}/posts/${post.slug}`,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      tags: post.tags.map((tag) => tag.name),
      images: post.cover ? [{ url: post.cover }] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post || post.draft) notFound();

  const [{ html, toc }, { prev, next }, all] = await Promise.all([
    renderMarkdown(post.content),
    getNeighbours(slug),
    getPosts(),
  ]);

  const related = all
    .filter(
      (item) =>
        item.slug !== post.slug &&
        (post.category ? item.category?.slug === post.category.slug : false),
    )
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { "@type": "Person", name: siteConfig.author.name, url: siteConfig.url },
    publisher: { "@type": "Organization", name: siteConfig.title },
    mainEntityOfPage: `${siteConfig.url}/posts/${post.slug}`,
    image: post.cover ? [post.cover] : undefined,
    wordCount: post.wordCount,
    keywords: post.tags.map((tag) => tag.name).join(", "),
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReadingProgress />

      <header className="relative isolate overflow-hidden pb-10 pt-28 sm:pt-32">
        {post.cover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 -z-20 h-full w-full scale-110 object-cover blur-[3px]"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-paper/70 via-paper/85 to-paper dark:from-night/65 dark:via-night/85 dark:to-night" />
          </>
        ) : (
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(255,255,255,0.95),transparent_70%)] dark:bg-[radial-gradient(60%_80%_at_50%_0%,rgba(125,211,184,0.12),transparent_70%)]" />
        )}

        <div className="mx-auto max-w-[860px] px-4">
          <nav className="flex items-center gap-1 text-[11px] text-ink-400" aria-label="面包屑">
            <Link href="/" className="transition hover:text-mint-500">
              首页
            </Link>
            <ChevronRight className="h-3 w-3" />
            {post.category ? (
              <>
                <Link
                  href={`/categories/${post.category.slug}`}
                  className="transition hover:text-mint-500"
                >
                  {post.category.name}
                </Link>
                <ChevronRight className="h-3 w-3" />
              </>
            ) : null}
            <span className="truncate text-ink-500 dark:text-ink-300">{post.title}</span>
          </nav>

          <h1 className="mt-4 text-[1.9rem] font-bold leading-tight tracking-tight text-ink-900 sm:text-[2.35rem] dark:text-white">
            {post.title}
          </h1>

          {post.description ? (
            <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-ink-500 dark:text-ink-300/85">
              {post.description}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] text-ink-400">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(post.date, "readable")}
            </span>
            {post.category ? (
              <Link
                href={`/categories/${post.category.slug}`}
                className="inline-flex items-center gap-1.5 transition hover:text-mint-500"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                {post.category.name}
              </Link>
            ) : null}
            {post.author ? (
              <Link
                href={`/u/${post.author.username}`}
                className="inline-flex items-center gap-1.5 transition hover:text-mint-500"
              >
                <UserAvatar user={post.author} size={18} />
                {post.author.displayName}
              </Link>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              约 {post.readingTime} 分钟
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5" />
              {post.wordCount.toLocaleString("en-US")} 字
            </span>
            <ViewCounter slug={post.slug} initial={post.views} />
          </div>

          {post.tags.length ? (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-ink-300" />
              {post.tags.map((tag) => (
                <Link key={tag.slug} href={`/tags/${tag.slug}`} className="tag-chip">
                  {tag.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-4 pb-10">
        <div className="flex gap-8">
          <div className="min-w-0 flex-1">
            <div className="card p-6 sm:p-10">
              <div
                className="prose-mizuki mx-auto max-w-[720px]"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              <div className="mx-auto mt-12 flex max-w-[720px] flex-col gap-3 border-t border-ink-100 pt-6 text-[11px] text-ink-400 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                <span>
                  本文遵循 {siteConfig.license} 协议，转载请注明出处。
                </span>
                <span>
                  最后更新 {formatDate(post.updated ?? post.date, "readable")}
                </span>
              </div>
            </div>

            {post.author ? (
              <Link
                href={`/u/${post.author.username}`}
                className="card mt-5 flex items-center gap-3 p-4 transition hover:-translate-y-0.5"
              >
                <UserAvatar user={post.author} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[13px] font-bold text-ink-800 dark:text-white/90">
                    {post.author.displayName}
                    {post.author.role === "ADMIN" ? (
                      <span className="rounded-full bg-sakura-100 px-1.5 py-0.5 text-[9px] font-bold text-sakura-500 dark:bg-sakura-400/15 dark:text-sakura-300">
                        站长
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-ink-400">
                    @{post.author.username} · {post.author.bio || "这个人很懒"}
                  </span>
                </span>
                <span className="text-[11px] font-semibold text-mint-500">查看主页 →</span>
              </Link>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <NeighbourCard post={prev} direction="prev" />
              <NeighbourCard post={next} direction="next" />
            </div>

            {related.length ? (
              <section className="mt-10">
                <h2 className="section-title mb-3">同一分类下</h2>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {related.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/posts/${item.slug}`}
                      className="card-soft group flex flex-col gap-1.5 p-3.5 transition hover:-translate-y-0.5 hover:border-mint-200"
                    >
                      <span className="line-clamp-2 text-[12.5px] font-semibold text-ink-800 transition group-hover:text-sakura-500 dark:text-white/90">
                        {item.title}
                      </span>
                      <span className="text-[10.5px] text-ink-400">
                        {formatDate(item.date)} · {item.readingTime} min
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="hidden w-[236px] shrink-0 xl:block">
            <div className="sticky top-24 space-y-4">
              <TableOfContents items={toc} />

              <div className="card-soft p-4">
                <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Post info
                </p>
                <dl className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-400">字数</dt>
                    <dd className="font-semibold text-ink-600 dark:text-white/80">
                      {post.wordCount.toLocaleString("en-US")}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-400">阅读</dt>
                    <dd className="font-semibold text-ink-600 dark:text-white/80">
                      {post.readingTime} 分钟
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-400">发布</dt>
                    <dd className="font-semibold text-ink-600 dark:text-white/80">
                      {formatDate(post.date)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-400">更新</dt>
                    <dd className="font-semibold text-ink-600 dark:text-white/80">
                      {formatDate(post.updated ?? post.date)}
                    </dd>
                  </div>
                </dl>
              </div>

              <Link
                href="/"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-ink-200/70 bg-white/60 py-2 text-[11.5px] font-semibold text-ink-500 transition hover:border-mint-300 hover:text-mint-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-300"
              >
                <ArrowLeft className="h-3 w-3" />
                返回首页
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}

type Neighbour = {
  slug: string;
  title: string;
  date: string;
} | null;

function NeighbourCard({
  post,
  direction,
}: {
  post: Neighbour;
  direction: "prev" | "next";
}) {
  if (!post) {
    return (
      <div className="card-soft grid place-items-center p-4 text-[11px] text-ink-300">
        {direction === "prev" ? "已经是第一篇了" : "已经是最后一篇了"}
      </div>
    );
  }

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={`card-soft group flex flex-col gap-1 p-4 transition hover:border-mint-200 ${
        direction === "next" ? "text-right" : ""
      }`}
    >
      <span className="inline-flex items-center gap-1 text-[10.5px] text-ink-400">
        {direction === "prev" ? <ArrowLeft className="h-3 w-3" /> : null}
        {direction === "prev" ? "上一篇" : "下一篇"}
        {direction === "next" ? <ArrowRight className="h-3 w-3" /> : null}
      </span>
      <span className="line-clamp-2 text-[12.5px] font-semibold text-ink-800 transition group-hover:text-sakura-500 dark:text-white/90">
        {post.title}
      </span>
    </Link>
  );
}

