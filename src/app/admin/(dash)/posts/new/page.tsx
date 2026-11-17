import type { Metadata } from "next";
import { PostEditor } from "@/components/admin/post-editor";
import { getSession } from "@/lib/auth";
import { getCategories, getTags } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "新建文章",
  robots: { index: false, follow: false },
};

export default async function NewPostPage() {
  const [categories, tags, session] = await Promise.all([
    getCategories(),
    getTags(),
    getSession(),
  ]);

  return (
    <PostEditor
      mode="create"
      canFeature={session?.role === "ADMIN"}
      categories={categories.map((item) => item.name)}
      tags={tags.map((item) => item.name)}
      post={{
        slug: "",
        title: "",
        description: "",
        content: "",
        coverUrl: "",
        category: "",
        tags: "",
        published: true,
        featured: false,
        pinned: false,
      }}
    />
  );
}
