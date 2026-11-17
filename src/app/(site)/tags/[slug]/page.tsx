import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Hash } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { getPosts, getTags } from "@/lib/data";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tags = await getTags();
  const tag = tags.find((item) => item.slug === slug);
  if (!tag) return { title: "标签不存在" };
  return {
    title: `标签 · ${tag.name}`,
    description: `带有 ${tag.name} 标签的全部文章。`,
    alternates: { canonical: `/tags/${tag.slug}` },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  const [posts, tags] = await Promise.all([getPosts(), getTags()]);
  const tag = tags.find((item) => item.slug === slug);
  if (!tag) notFound();

  const list = posts.filter((post) => post.tags.some((item) => item.slug === slug));

  return (
    <>
      <PageHeader
        eyebrow="Tag"
        title={`# ${tag.name}`}
        description={`共有 ${list.length} 篇文章带有这个标签。`}
      >
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-white"
            style={{ backgroundColor: tag.color }}
          >
            <Hash className="h-3 w-3" />
            {tag.name}
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full border border-ink-200/70 bg-white/60 px-3 py-1 text-[11px] font-medium text-ink-500 transition hover:border-mint-300 hover:text-mint-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-300"
          >
            <ArrowLeft className="h-3 w-3" />
            返回首页
          </Link>
        </div>
      </PageHeader>

      <div className="mx-auto max-w-[860px] px-4 pb-10">
        <div className="grid gap-4">
          {list.map((post, index) => (
            <PostCard key={post.slug} post={post} index={index} />
          ))}
        </div>
      </div>
    </>
  );
}
