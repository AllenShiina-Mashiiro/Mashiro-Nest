"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession, type SessionUser } from "@/lib/auth";
import { cacheDel, invalidateContent } from "@/lib/cache";
import { colorFor, slugifyTag } from "@/lib/text";
import {
  deleteAnime,
  deleteFriend,
  deletePost,
  deleteUserAccount,
  getPost,
  saveAnime,
  saveFriend,
  savePage,
  savePost,
  saveSettings,
  setPostPublished,
  updateUserProfile,
} from "@/lib/data";
import { deleteMediaByKey } from "@/lib/media";
import { scanMedia } from "@/lib/media-refs";
import type { SiteSettings } from "@/lib/settings";
import { countWords, estimateReadingTime } from "@/lib/utils";

export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};

const postSchema = z.object({
  title: z.string().trim().min(1, "请填写标题").max(120, "标题最多 120 字"),
  slug: z
    .string()
    .trim()
    .min(1, "请填写 slug")
    .regex(/^[\p{L}\p{N}_-]+$/u, "slug 只能包含文字、数字、- 与 _"),
  description: z.string().trim().max(300, "摘要最多 300 字"),
  content: z.string().min(1, "正文不能为空"),
  coverUrl: z.string().trim().max(500, "封面地址过长"),
  category: z.string().trim().max(60, "分类名过长"),
  tags: z.string().trim().max(200, "标签过多"),
});

async function guard(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

function refreshSite(paths: string[] = []) {
  for (const path of ["/", "/archive", "/about", "/moments", ...paths]) {
    revalidatePath(path);
  }
}

// -------------------------------------------------------------------- posts --

export async function savePostAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await guard();

  const raw = {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    content: String(formData.get("content") ?? ""),
    coverUrl: String(formData.get("coverUrl") ?? ""),
    category: String(formData.get("category") ?? ""),
    tags: String(formData.get("tags") ?? ""),
  };
  const published = formData.get("published") === "on";
  const featured = formData.get("featured") === "on";
  const pinned = formData.get("pinned") === "on";

  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0] ?? "form")] = issue.message;
    }
    return { status: "error", message: "请检查表单内容", fieldErrors };
  }

  const existing = await getPost(parsed.data.slug, { drafts: true });
  if (existing && session.role !== "ADMIN" && existing.author?.id !== session.id) {
    return { status: "error", message: "这篇不是你写的，不能编辑。" };
  }

  const data = parsed.data;
  const tags = data.tags
    .split(/[,，\s]+/)
    .map((name) => name.replace(/^#/, "").trim())
    .filter(Boolean)
    .slice(0, 8);

  await savePost(session.id, {
    slug: data.slug,
    title: data.title,
    description: data.description,
    content: data.content,
    coverUrl: data.coverUrl || null,
    category: data.category || null,
    tags,
    published,
    featured: featured && session.role === "ADMIN",
    pinned: pinned && session.role === "ADMIN",
  });

  await invalidateContent();
  refreshSite([`/posts/${data.slug}`, "/admin/posts"]);

  redirect(`/admin/posts?saved=${encodeURIComponent(data.slug)}`);
}

export async function deletePostAction(formData: FormData) {
  const session = await guard();
  const slug = String(formData.get("slug") ?? "");
  if (!slug) redirect("/admin/posts");

  const post = await getPost(slug, { drafts: true });
  if (post && session.role !== "ADMIN" && post.author?.id !== session.id) {
    redirect("/admin/posts?error=forbidden");
  }

  await deletePost(slug);
  await invalidateContent();
  refreshSite(["/admin/posts"]);
  redirect("/admin/posts?deleted=1");
}

export async function togglePublishAction(formData: FormData) {
  const session = await guard();
  const slug = String(formData.get("slug") ?? "");
  const next = formData.get("next") === "true";
  if (!slug) redirect("/admin/posts");

  const post = await getPost(slug, { drafts: true });
  if (post && session.role !== "ADMIN" && post.author?.id !== session.id) {
    redirect("/admin/posts?error=forbidden");
  }

  await setPostPublished(slug, next);
  await invalidateContent();
  refreshSite(["/admin/posts"]);
  redirect("/admin/posts");
}

// ------------------------------------------------------------------ profile --

export async function saveProfileAction(formData: FormData): Promise<void> {
  const session = await guard();

  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const github = String(formData.get("github") ?? "").trim();
  const telegram = String(formData.get("telegram") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const bannerUrl = String(formData.get("bannerUrl") ?? "").trim();

  await updateUserProfile(session.id, {
    displayName: displayName || session.displayName,
    bio,
    status: status || "写代码中",
    location: location || null,
    website: website || null,
    github: github || null,
    telegram: telegram || null,
    avatarUrl: avatarUrl || null,
    bannerUrl: bannerUrl || null,
  });

  await cacheDel(`user:id:${session.id}`, "content:users", "settings:site");
  revalidatePath("/admin/profile");
  revalidatePath(`/u/${session.username}`);
  revalidatePath("/");
  redirect("/admin/profile?saved=1");
}

// ----------------------------------------------------------------- settings --

const SETTING_FIELDS = [
  "siteName",
  "siteSubtitle",
  "siteDescription",
  "siteIcon",
  "icp",
  "heroTitle",
  "heroSubtitle",
  "loginBackground",
  "aboutTitle",
  "contactEmail",
  "githubUrl",
  "telegramUrl",
] as const;

export async function saveSettingsAction(formData: FormData): Promise<void> {
  const session = await guard();
  if (session.role !== "ADMIN") redirect("/admin/profile");

  const patch: Partial<SiteSettings> = {};
  for (const field of SETTING_FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") patch[field] = value.trim();
  }

  const heroImages = String(formData.get("heroImages") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (heroImages.length) patch.heroImages = heroImages;
  patch.heroBeam = formData.get("heroBeam") === "on";

  await saveSettings(patch);

  const aboutContent = formData.get("aboutContent");
  if (typeof aboutContent === "string" && aboutContent.trim()) {
    await savePage("about", String(formData.get("aboutTitle") ?? "关于"), aboutContent);
  }

  // The owner card reads from the admin profile too.
  const displayName = String(formData.get("ownerName") ?? "").trim();
  if (displayName) {
    await updateUserProfile(session.id, {
      displayName,
      bio: String(formData.get("ownerBio") ?? "").trim(),
      status: String(formData.get("ownerStatus") ?? "").trim() || "写代码中",
      location: String(formData.get("ownerLocation") ?? "").trim() || null,
      avatarUrl: String(formData.get("ownerAvatar") ?? "").trim() || null,
      github: String(formData.get("ownerGithub") ?? "").trim() || null,
      telegram: String(formData.get("ownerTelegram") ?? "").trim() || null,
    });
  }

  await cacheDel("settings:site", "content:page:about", "content:stats", "content:users");
  refreshSite(["/admin/settings", "/admin"]);
  redirect("/admin/settings?saved=1");
}

// ------------------------------------------------------------------- friends --

export async function saveFriendAction(formData: FormData): Promise<void> {
  const session = await guard();
  if (session.role !== "ADMIN") redirect("/admin");

  const id = String(formData.get("id") ?? "").trim() || undefined;
  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!name || !url) redirect("/admin/friends?error=required");

  await saveFriend({
    id,
    name,
    url,
    avatar: String(formData.get("avatar") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim(),
    color: String(formData.get("color") ?? "").trim() || colorFor(name),
  });

  await cacheDel("content:friends");
  refreshSite(["/friends", "/admin/friends"]);
  redirect("/admin/friends?saved=1");
}

export async function deleteFriendAction(formData: FormData): Promise<void> {
  const session = await guard();
  if (session.role !== "ADMIN") redirect("/admin");
  const id = String(formData.get("id") ?? "");
  if (id) await deleteFriend(id);
  await cacheDel("content:friends");
  refreshSite(["/friends", "/admin/friends"]);
  redirect("/admin/friends");
}

// --------------------------------------------------------------------- anime --

export async function saveAnimeAction(formData: FormData): Promise<void> {
  const session = await guard();
  if (session.role !== "ADMIN") redirect("/admin");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect("/admin/anime?error=required");

  const status = String(formData.get("status") ?? "PLANNED");
  const allowed = ["WATCHING", "COMPLETED", "PLANNED", "PAUSED", "DROPPED"] as const;
  const safeStatus = (allowed as readonly string[]).includes(status)
    ? (status as (typeof allowed)[number])
    : "PLANNED";

  await saveAnime({
    id: String(formData.get("id") ?? "").trim() || undefined,
    title,
    cover: String(formData.get("cover") ?? "").trim() || null,
    status: safeStatus,
    rating: Math.max(0, Math.min(10, Number(formData.get("rating") ?? 0) || 0)),
    comment: String(formData.get("comment") ?? "").trim(),
    season: String(formData.get("season") ?? "").trim() || null,
    year: Number(formData.get("year")) || null,
  });

  await cacheDel("content:anime");
  refreshSite(["/anime", "/admin/anime"]);
  redirect("/admin/anime?saved=1");
}

export async function deleteAnimeAction(formData: FormData): Promise<void> {
  const session = await guard();
  if (session.role !== "ADMIN") redirect("/admin");
  const id = String(formData.get("id") ?? "");
  if (id) await deleteAnime(id);
  await cacheDel("content:anime");
  refreshSite(["/anime", "/admin/anime"]);
  redirect("/admin/anime");
}

// --------------------------------------------------------------------- users --

export async function deleteUserAction(formData: FormData): Promise<void> {
  const session = await guard();
  if (session.role !== "ADMIN") redirect("/admin");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/users");

  const { storeInstance } = await import("@/lib/data");
  const target = await (await storeInstance()).getUserById(id);

  if (!target) redirect("/admin/users?error=missing");
  // 不能删自己（用 username 判断，避免旧 token / 迁移后 id 变化）
  if (target.id === session.id || target.username === session.username) {
    redirect("/admin/users?error=self");
  }
  // 管理员账号一律保护，避免把最后一个站长删掉
  if (target.role === "ADMIN") redirect("/admin/users?error=admin");

  await deleteUserAccount(id);

  await cacheDel("content:users");
  refreshSite(["/admin/users"]);
  redirect("/admin/users?deleted=1");
}

// --------------------------------------------------------------------- media --

export async function cleanupMediaAction(formData: FormData): Promise<void> {
  const session = await guard();
  if (session.role !== "ADMIN") redirect("/admin");

  const mode = String(formData.get("mode") ?? "orphans");
  if (mode === "orphans") {
    const report = await scanMedia();
    for (const item of report.orphans) {
      await deleteMediaByKey(item.key);
    }
  } else {
    const key = String(formData.get("key") ?? "");
    if (key) await deleteMediaByKey(key);
  }

  revalidatePath("/admin/media");
  redirect("/admin/media?cleaned=1");
}

export async function logoutAction() {
  const { destroySession } = await import("@/lib/auth");
  await destroySession();
  redirect("/admin/login");
}
