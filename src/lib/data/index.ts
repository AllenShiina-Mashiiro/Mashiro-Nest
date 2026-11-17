import { cacheDel, cacheDelByPrefix, cached, invalidateContent } from "@/lib/cache";
import type { SiteSettings } from "@/lib/settings";
import type {
  AnimeItem,
  ArchiveGroup,
  CategoryWithCount,
  Friend,
  Moment,
  MomentComment,
  MomentInput,
  NotificationItem,
  PageContent,
  PostDetail,
  PostInput,
  PostSummary,
  PublicUser,
  SearchResults,
  SiteStats,
  Store,
  TagRef,
} from "@/lib/types";
import { demoStore } from "./demo";

const TTL = Number(process.env.CACHE_TTL ?? 30);

/**
 * The site runs in two modes:
 *  - `database`: PostgreSQL through Prisma (production / configured dev)
 *  - `demo`:     a writable JSON store under `.data/` (zero infra)
 */
export function isDemoMode() {
  return process.env.BLOG_DEMO === "1" || !process.env.DATABASE_URL;
}

let pending: Promise<Store> | null = null;
let resolved: { mode: "database" | "demo"; at: number } | null = null;
let lastWarnAt = 0;

/**
 * Resolve the active store. When `DATABASE_URL` is configured we ping the
 * database first and silently fall back to the JSON store if it is unreachable,
 * so a stopped PostgreSQL never takes the whole site down.
 */
async function db(): Promise<Store> {
  if (isDemoMode()) {
    resolved = { mode: "demo", at: Date.now() };
    return demoStore;
  }

  if (resolved && Date.now() - resolved.at < 15_000) {
    if (resolved.mode === "demo") return demoStore;
    return databaseStorePromise();
  }

  try {
    const mod = await import("./database");
    await mod.pingDatabase();
    resolved = { mode: "database", at: Date.now() };
    if (!pending) pending = Promise.resolve(mod.databaseStore as Store);
  } catch (error) {
    if (Date.now() - lastWarnAt > 60_000) {
      lastWarnAt = Date.now();
      const raw = error instanceof Error ? error.message.trim() : String(error);
      console.warn(
        "[mashiro] PostgreSQL 连接失败，回退到本地 JSON 模式（.data/store.json）：",
        raw.split("\n")[0] || "无法连接数据库",
      );
    }
    resolved = { mode: "demo", at: Date.now() };
    return demoStore;
  }

  return databaseStorePromise();
}

async function databaseStorePromise(): Promise<Store> {
  if (!pending) pending = import("./database").then((mod) => mod.databaseStore as Store);
  return pending;
}

export async function dataMode(): Promise<"database" | "demo"> {
  return (await db()).mode;
}

/** Raw store (no read cache) — used by admin tooling such as the media scan. */
export async function storeInstance(): Promise<Store> {
  return db();
}

// ------------------------------------------------------------------ reads --

export function getPosts(options?: { drafts?: boolean; authorId?: string }): Promise<PostSummary[]> {
  const key = `content:posts:${options?.drafts ? "all" : "published"}:${options?.authorId ?? "any"}`;
  return cached(key, TTL, async () => (await db()).listPosts(options));
}

export function getPost(
  slug: string,
  options?: { drafts?: boolean },
): Promise<PostDetail | null> {
  return cached(`post:${slug}:${options?.drafts ? "draft" : "public"}`, TTL, async () =>
    (await db()).getPost(slug, options),
  );
}

export function getNeighbours(slug: string) {
  return cached(`post:${slug}:neighbours`, TTL, async () => (await db()).getNeighbours(slug));
}

export function getCategories(): Promise<CategoryWithCount[]> {
  return cached("content:categories", TTL * 5, async () => (await db()).listCategories());
}

export function getTags(): Promise<TagRef[]> {
  return cached("content:tags", TTL * 5, async () => (await db()).listTags());
}

export function getArchive(): Promise<ArchiveGroup[]> {
  return cached("content:archive", TTL, async () => (await db()).listArchive());
}

export function searchPosts(query: string): Promise<PostSummary[]> {
  return cached(`search:posts:${query.trim().toLowerCase()}`, 60, async () =>
    (await db()).searchPosts(query),
  );
}

export function searchMoments(query: string, viewerId?: string): Promise<Moment[]> {
  return cached(`search:moments:${query.trim().toLowerCase()}:${viewerId ?? "anon"}`, 60, async () =>
    (await db()).searchMoments(query, viewerId),
  );
}

export async function searchAll(query: string, viewerId?: string): Promise<SearchResults> {
  const needle = query.trim().toLowerCase();
  if (!needle) return { posts: [], moments: [], users: [] };
  const [posts, moments, users] = await Promise.all([
    searchPosts(query),
    searchMoments(query, viewerId),
    listUsers(),
  ]);
  return {
    posts,
    moments: moments.slice(0, 8),
    users: users
      .filter((user) =>
        [user.displayName, user.username, user.bio].join(" ").toLowerCase().includes(needle),
      )
      .slice(0, 8),
  };
}

export function getMoments(limit = 60, viewerId?: string): Promise<Moment[]> {
  return cached(`content:moments:${limit}:${viewerId ?? "anon"}`, 10, async () =>
    (await db()).listMoments(limit, viewerId),
  );
}

export function getFriends(): Promise<Friend[]> {
  return cached("content:friends", TTL * 5, async () => (await db()).listFriends());
}

export function getAnime(): Promise<AnimeItem[]> {
  return cached("content:anime", TTL * 5, async () => (await db()).listAnime());
}

export function getPage(slug: string): Promise<PageContent | null> {
  return cached(`content:page:${slug}`, TTL * 5, async () => (await db()).getPage(slug));
}

export function getStats(): Promise<SiteStats> {
  return cached("content:stats", 120, async () => (await db()).stats());
}

export async function recordView(slug: string) {
  return (await db()).bumpViews(slug);
}

export function getSettings(): Promise<SiteSettings> {
  return cached("settings:site", TTL, async () => (await db()).getSettings());
}

export function getUser(id: string): Promise<PublicUser | null> {
  return cached(`user:id:${id}`, 30, async () => (await db()).getUserById(id));
}

export function getUserByUsername(username: string): Promise<PublicUser | null> {
  return cached(`user:name:${username.toLowerCase()}`, 30, async () =>
    (await db()).getUserByUsername(username),
  );
}

export function listUsers(): Promise<PublicUser[]> {
  return cached("content:users", TTL, async () => (await db()).listUsers());
}

export function listFollowers(userId: string): Promise<PublicUser[]> {
  return cached(`followers:${userId}`, 30, async () => (await db()).listFollowers(userId));
}

export function listFollowing(userId: string): Promise<PublicUser[]> {
  return cached(`following:${userId}`, 30, async () => (await db()).listFollowing(userId));
}

export function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  return cached(`isfollowing:${followerId}:${followingId}`, 10, async () =>
    (await db()).isFollowing(followerId, followingId),
  );
}

// -------------------------------------------------------- interactions --

export async function toggleMomentLike(momentId: string, userId: string) {
  const result = await (await db()).toggleLike(momentId, userId);
  await cacheDelByPrefix("content:moments");
  return result;
}

export async function toggleMomentCommentLike(commentId: string, userId: string) {
  const result = await (await db()).toggleCommentLike(commentId, userId);
  await cacheDelByPrefix("content:moments");
  return result;
}

export async function addMomentComment(
  momentId: string,
  userId: string,
  content: string,
): Promise<MomentComment> {
  const comment = await (await db()).addComment(momentId, userId, content);
  await cacheDelByPrefix("content:moments");
  return comment;
}

export async function updateMomentComment(
  commentId: string,
  userId: string,
  content: string,
): Promise<MomentComment | null> {
  const comment = await (await db()).updateComment(commentId, userId, content);
  await cacheDelByPrefix("content:moments");
  return comment;
}

export async function removeMomentComment(
  commentId: string,
  userId: string,
  isAdmin = false,
) {
  const removed = await (await db()).deleteComment(commentId, userId, isAdmin);
  await cacheDelByPrefix("content:moments");
  return removed;
}

export async function listNotifications(
  userId: string,
  limit = 20,
): Promise<NotificationItem[]> {
  return (await db()).listNotifications(userId, limit);
}

export async function markNotificationsRead(userId: string) {
  await (await db()).markNotificationsRead(userId);
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  return (await db()).unreadNotificationCount(userId);
}

// ----------------------------------------------------------------- writes --

/** Drop every cache namespace that can contain user-visible content. */
export async function invalidateContentCaches() {
  await invalidateContent();
  await cacheDel("content:users", "content:stats", "settings:site");
}

export async function savePost(authorId: string, input: PostInput) {
  const result = await (await db()).savePost(authorId, input);
  await invalidateContentCaches();
  return result;
}

export async function deletePost(slug: string) {
  await (await db()).deletePost(slug);
  await invalidateContentCaches();
}

export async function setPostPublished(slug: string, published: boolean) {
  await (await db()).setPostPublished(slug, published);
  await invalidateContentCaches();
}

export async function createMoment(authorId: string, input: MomentInput) {
  const moment = await (await db()).createMoment(authorId, input);
  await invalidateContentCaches();
  return moment;
}

export async function updateMoment(id: string, input: MomentInput) {
  const moment = await (await db()).updateMoment(id, input);
  await invalidateContentCaches();
  return moment;
}

export async function deleteMoment(id: string) {
  await (await db()).deleteMoment(id);
  await invalidateContentCaches();
}

export async function saveFriend(input: Omit<Friend, "id"> & { id?: string }) {
  const friend = await (await db()).saveFriend(input);
  await invalidateContentCaches();
  return friend;
}

export async function deleteFriend(id: string) {
  await (await db()).deleteFriend(id);
  await invalidateContentCaches();
}

export async function saveAnime(input: Omit<AnimeItem, "id"> & { id?: string }) {
  const item = await (await db()).saveAnime(input);
  await invalidateContentCaches();
  return item;
}

export async function deleteAnime(id: string) {
  await (await db()).deleteAnime(id);
  await invalidateContentCaches();
}

export async function savePage(slug: string, title: string, content: string) {
  const page = await (await db()).savePage(slug, title, content);
  await invalidateContentCaches();
  return page;
}

export async function saveSettings(patch: Partial<SiteSettings>) {
  const next = await (await db()).saveSettings(patch);
  await cacheDel("settings:site", "content:stats");
  return next;
}

export async function followUser(followerId: string, followingId: string) {
  await (await db()).follow(followerId, followingId);
  await cacheDel(`followers:${followingId}`);
  await cacheDel(`isfollowing:${followerId}:${followingId}`);
  await cacheDel(`user:id:${followingId}`);
}

export async function unfollowUser(followerId: string, followingId: string) {
  await (await db()).unfollow(followerId, followingId);
  await cacheDel(`followers:${followingId}`);
  await cacheDel(`isfollowing:${followerId}:${followingId}`);
  await cacheDel(`user:id:${followingId}`);
}

export async function updateUserProfile(
  id: string,
  patch: Parameters<Store["updateUser"]>[1],
) {
  const user = await (await db()).updateUser(id, patch);
  await cacheDel(`user:id:${id}`, `user:name:${user.username.toLowerCase()}`, "content:users");
  return user;
}

export async function deleteUserAccount(id: string) {
  await (await db()).deleteUser(id);
  await invalidateContentCaches();
}
