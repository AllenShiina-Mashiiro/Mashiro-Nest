import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { getCategories, getPosts } from "@/lib/data";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((item) => item.slug === slug);
  if (!category) return { title: "分类不存在" };
  return {
    title: `分类 · ${category.name}`,
    description: `${category.name} 分类下的全部文章。`,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [posts, categories] = await Promise.all([getPosts(), getCategories()]);
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const list = posts.filter((post) => post.category?.slug === slug);

  return (
    <>
      <PageHeader
        eyebrow="Category"
        title={category.name}
        description={`这个分类下共有 ${list.length} 篇文章。`}
      >
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-white"
            style={{ backgroundColor: category.color }}
          >
            <FolderOpen className="h-3 w-3" />
            {category.name}
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
        {list.length === 0 ? (
          <p className="card grid place-items-center py-16 text-xs text-ink-400">
            这个分类下还没有文章。
          </p>
        ) : null}
      </div>
    </>
  );
}
