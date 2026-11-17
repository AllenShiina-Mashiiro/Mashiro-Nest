import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PostEditor } from "@/components/admin/post-editor";
import { getSession } from "@/lib/auth";
import { getCategories, getPost, getTags } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "编辑文章",
  robots: { index: false, follow: false },
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, categories, tags, session] = await Promise.all([
    getPost(slug, { drafts: true }),
    getCategories(),
    getTags(),
    getSession(),
  ]);

  if (!post) notFound();
  const isAdmin = session?.role === "ADMIN";
  if (!isAdmin && post.author?.id !== session?.id) redirect("/admin/posts?error=forbidden");

  return (
    <PostEditor
      mode="edit"
      canFeature={isAdmin}
      categories={categories.map((item) => item.name)}
      tags={tags.map((item) => item.name)}
      post={{
        slug: post.slug,
        title: post.title,
        description: post.description,
        content: post.content,
        coverUrl: post.cover ?? "",
        category: post.category?.name ?? "",
        tags: post.tags.map((tag) => tag.name).join(", "),
        published: !post.draft,
        featured: post.featured,
        pinned: post.pinned,
      }}
    />
  );
}
