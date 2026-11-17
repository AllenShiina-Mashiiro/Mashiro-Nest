import { hashSync } from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { readContentPosts, toSummary, type RawPost } from "@/lib/content";
import { countWords, estimateReadingTime } from "@/lib/text";
import { mergeSettings, type SiteSettings } from "@/lib/settings";
import { siteConfig } from "@/lib/config";
import { publishToUser } from "@/lib/events";
import type {
  AnimeItem,
  ArchiveGroup,
  CategoryWithCount,
  Friend,
  Moment,
  MomentInput,
  PageContent,
  PostDetail,
  PostInput,
  PostSummary,
  PublicUser,
  Role,
  SiteStats,
  Store,
  TagRef,
  UserRecord,
} from "@/lib/types";
import { readViewDeltas, incrementViews } from "@/lib/views";
import { demoAboutPage, demoAnime, demoFriends, demoMoments } from "./seed-data";

/**
 * Zero-infrastructure store: everything lives in `.data/store.json`.
 * It powers the demo mode (no PostgreSQL) and is writable, so registration,
 * settings, moments and the rest all work out of the box.
 */

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

type StoredUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: Role;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string;
  status: string;
  location: string | null;
  website: string | null;
  github: string | null;
  telegram: string | null;
  createdAt: string;
};

type StoredFollow = { followerId: string; followingId: string; createdAt: string };

type StoredPost = {
  slug: string;
  title: string;
  description: string;
  content: string;
  coverUrl: string | null;
  category: string | null;
  tags: string[];
  published: boolean;
  featured: boolean;
  pinned: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  views: number;
  authorId: string;
};

type StoredMoment = {
  id: string;
  authorId: string;
  content: string;
  images: string[];
  location: string | null;
  createdAt: string;
  updatedAt: string;
};

type StoredPage = { slug: string; title: string; content: string; updatedAt: string };

type Db = {
  version: number;
  users: StoredUser[];
  follows: StoredFollow[];
  posts: StoredPost[];
  moments: StoredMoment[];
  friends: Friend[];
  anime: AnimeItem[];
  pages: StoredPage[];
  settings: Partial<SiteSettings>;
  likes: StoredLike[];
  comments: StoredComment[];
  commentLikes: StoredCommentLike[];
  notifications: StoredNotification[];
};

type StoredLike = { momentId: string; userId: string; createdAt: string };
type StoredComment = {
  id: string;
  momentId: string;
  authorId: string;
  content: string;
  createdAt: string;
};
type StoredCommentLike = { commentId: string; userId: string; createdAt: string };
type StoredNotification = {
  id: string;
  userId: string;
  actorId: string;
  type: "like" | "comment" | "comment_like" | "follow";
  momentId: string | null;
  commentId: string | null;
  preview: string | null;
  read: boolean;
  createdAt: string;
};

let db: Db | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

function seedDb(): Db {
  if (process.env.NODE_ENV === "production") {
    if (!process.env.ADMIN_EMAIL?.trim()) {
      throw new Error("ADMIN_EMAIL_REQUIRED: configure the administrator email before production startup");
    }
    if ((process.env.ADMIN_PASSWORD?.length ?? 0) < 12) {
      throw new Error("ADMIN_PASSWORD_REQUIRED: production administrator passwords must be at least 12 characters");
    }
  }
  const now = new Date().toISOString();
  const admin: StoredUser = {
    id: "user-admin",
    email: (
      process.env.ADMIN_EMAIL?.trim() ||
      (process.env.NODE_ENV === "production" ? "" : "admin@mizuki.dev")
    ).toLowerCase(),
    username: process.env.ADMIN_USERNAME?.trim() || "AllenShiina",
    displayName: process.env.ADMIN_NAME?.trim() || "AllenShiina",
    passwordHash: hashSync(process.env.ADMIN_PASSWORD || "mizuki", 10),
    role: "ADMIN",
    avatarUrl: "/images/avatar.svg",
    bannerUrl: null,
    bio: "白天写前端，晚上写博客。",
    status: "写代码中",
    location: "重庆",
    website: null,
    github: "https://github.com/",
    telegram: null,
    createdAt: now,
  };

  return {
    version: 2,
    users: [admin],
    follows: [],
    posts: [],
    moments: demoMoments.map((moment, index) => ({
      id: moment.id,
      authorId: admin.id,
      content: moment.content,
      images: moment.images,
      location: moment.location,
      createdAt: moment.createdAt,
      updatedAt: moment.createdAt,
    })),
    friends: demoFriends,
    anime: demoAnime,
    pages: [
      {
        slug: "about",
        title: "关于",
        content: demoAboutPage,
        updatedAt: now,
      },
    ],
    settings: {},
    likes: [],
    comments: [],
    commentLikes: [],
    notifications: [],
  };
}

function load(): Db {
  if (db) return db;
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    db = JSON.parse(raw) as Db;
    if (!Array.isArray(db.users) || !db.users.length) db = seedDb();
    // 兼容老版本 store.json
    db.likes ??= [];
    db.comments ??= [];
    db.commentLikes ??= [];
    db.notifications ??= [];
  } catch {
    db = seedDb();
  }
  return db;
}

function persist() {
  const snapshot = JSON.stringify(db, null, 2);
  writeChain = writeChain
    .then(async () => {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
      await fs.promises.writeFile(DATA_FILE, snapshot, "utf8");
    })
    .catch(() => undefined);
  return writeChain;
}

// ------------------------------------------------------------------ users --

function countsFor(data: Db, userId: string) {
  const markdown = readContentPosts().filter((post) => !post.draft);
  const adminId = data.users.find((user) => user.role === "ADMIN")?.id;
  const ownJson = data.posts.filter((post) => post.authorId === userId && post.published);
  return {
    followers: data.follows.filter((row) => row.followingId === userId).length,
    following: data.follows.filter((row) => row.followerId === userId).length,
    postCount: ownJson.length + (userId === adminId ? markdown.length : 0),
    momentCount: data.moments.filter((moment) => moment.authorId === userId).length,
  };
}

function toPublic(data: Db, user: StoredUser): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    bio: user.bio,
    status: user.status,
    location: user.location,
    website: user.website,
    github: user.github,
    telegram: user.telegram,
    createdAt: user.createdAt,
    ...countsFor(data, user.id),
  };
}

function toRecord(data: Db, user: StoredUser): UserRecord {
  return { ...toPublic(data, user), email: user.email, passwordHash: user.passwordHash };
}

function findUser(data: Db, id: string) {
  return data.users.find((user) => user.id === id) ?? null;
}

function adminUser(data: Db) {
  return data.users.find((user) => user.role === "ADMIN") ?? data.users[0] ?? null;
}

function decorateMoment(data: Db, moment: StoredMoment, viewerId?: string): Moment {
  const likes = data.likes.filter((like) => like.momentId === moment.id);
  const comments = data.comments
    .filter((comment) => comment.momentId === moment.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: authorOf(data, comment.authorId),
      likeCount: data.commentLikes.filter((like) => like.commentId === comment.id).length,
      likedByMe: Boolean(viewerId && data.commentLikes.some((like) => like.commentId === comment.id && like.userId === viewerId)),
    }));

  return {
    id: moment.id,
    content: moment.content,
    images: moment.images,
    location: moment.location,
    createdAt: moment.createdAt,
    author: authorOf(data, moment.authorId),
    likeCount: likes.length,
    likedByMe: viewerId ? likes.some((like) => like.userId === viewerId) : false,
    comments,
  };
}

function authorOf(data: Db, id: string): PublicUser | null {
  const user = findUser(data, id);
  return user ? toPublic(data, user) : null;
}

// ------------------------------------------------------------------ posts --

function markdownSummaries(data: Db, withDrafts: boolean): PostSummary[] {
  const admin = adminUser(data);
  const author = admin ? toPublic(data, admin) : null;
  return readContentPosts()
    .filter((post) => withDrafts || !post.draft)
    .map((post: RawPost) => ({ ...toSummary(post), author }));
}

function jsonSummaries(data: Db, withDrafts: boolean, authorId?: string): PostSummary[] {
  return data.posts
    .filter((post) => (withDrafts || post.published) && (!authorId || post.authorId === authorId))
    .map((post): PostSummary => {
      const wordCount = countWords(post.content);
      return {
        slug: post.slug,
        title: post.title,
        description: post.description,
        date: post.publishedAt ?? post.createdAt,
        updated: post.updatedAt,
        category: post.category
          ? { slug: post.category.toLowerCase(), name: post.category, color: "#7dd3b8" }
          : null,
        tags: post.tags.map((name) => ({
          slug: name.toLowerCase(),
          name,
          color: "#f9a8d4",
          count: 0,
        })),
        cover: post.coverUrl,
        featured: post.featured,
        pinned: post.pinned,
        draft: !post.published,
        wordCount,
        readingTime: estimateReadingTime(wordCount),
        views: post.views,
        author: authorOf(data, post.authorId),
      };
    });
}

async function readDeltas() {
  return readViewDeltas();
}

async function allSummaries(options?: { drafts?: boolean; authorId?: string }) {
  const data = load();
  const deltas = await readDeltas();
  const admin = data.users.find((user) => user.role === "ADMIN");
  const includeMarkdown = !options?.authorId || options.authorId === admin?.id;
  const posts = [
    ...(includeMarkdown ? markdownSummaries(data, Boolean(options?.drafts)) : []),
    ...jsonSummaries(data, Boolean(options?.drafts), options?.authorId),
  ];
  return posts
    .map((post) => ({ ...post, views: post.views + (deltas[post.slug] ?? 0) }))
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime() ||
        Number(b.pinned) - Number(a.pinned),
    );
}

// ---------------------------------------------------------------- helpers --

function applyTagCounts(posts: PostSummary[]) {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag.slug, (counts.get(tag.slug) ?? 0) + 1);
  }
  return posts.map((post) => ({
    ...post,
    tags: post.tags.map((tag) => ({ ...tag, count: counts.get(tag.slug) ?? 0 })),
  }));
}

export const demoStore: Store = {
  mode: "demo",

  async listPosts(options) {
    return applyTagCounts(await allSummaries(options));
  },

  async getPost(slug, options) {
    const data = load();
    const deltas = await readDeltas();
    const jsonPost = data.posts.find((post) => post.slug === slug);
    if (jsonPost) {
      if (!jsonPost.published && !options?.drafts) return null;
      const summary = (await allSummaries({ drafts: true })).find((post) => post.slug === slug);
      if (!summary) return null;
      return {
        ...summary,
        content: jsonPost.content,
        views: summary.views + (deltas[slug] ?? 0),
      } satisfies PostDetail;
    }

    const raw = readContentPosts().find((post) => post.slug === slug);
    if (!raw) return null;
    if (raw.draft && !options?.drafts) return null;
    const admin = adminUser(data);
    return {
      ...toSummary(raw),
      content: raw.content,
      views: raw.views + (deltas[slug] ?? 0),
      author: admin ? toPublic(data, admin) : null,
    } satisfies PostDetail;
  },

  async getNeighbours(slug) {
    const posts = await allSummaries();
    const index = posts.findIndex((post) => post.slug === slug);
    if (index < 0) return { prev: null, next: null };
    return { prev: posts[index + 1] ?? null, next: posts[index - 1] ?? null };
  },

  async listCategories() {
    const posts = await allSummaries();
    const map = new Map<string, CategoryWithCount>();
    for (const post of posts) {
      if (!post.category) continue;
      const entry = map.get(post.category.slug);
      if (entry) entry.count += 1;
      else map.set(post.category.slug, { ...post.category, count: 1 });
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  },

  async listTags(): Promise<TagRef[]> {
    const posts = await allSummaries();
    const map = new Map<string, TagRef>();
    for (const post of posts) {
      for (const tag of post.tags) {
        const entry = map.get(tag.slug);
        if (entry) entry.count += 1;
        else map.set(tag.slug, { ...tag, count: 1 });
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  },

  async listArchive(): Promise<ArchiveGroup[]> {
    const posts = await allSummaries();
    const groups = new Map<number, PostSummary[]>();
    for (const post of posts) {
      const year = new Date(post.date).getFullYear();
      groups.set(year, [...(groups.get(year) ?? []), post]);
    }
    return [...groups.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, items]) => ({ year, posts: items }));
  },

  async searchPosts(query) {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const posts = await allSummaries();
    return posts.filter((post) => {
      const data = load();
      const body =
        data.posts.find((item) => item.slug === post.slug)?.content ??
        readContentPosts().find((item) => item.slug === post.slug)?.content ??
        "";
      return [post.title, post.description, post.category?.name ?? "", body]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  },

  async listMoments(limit = 60, viewerId?: string): Promise<Moment[]> {
    const data = load();
    return [...data.moments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((moment) => decorateMoment(data, moment, viewerId));
  },

  async searchMoments(query, viewerId?: string) {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    const moments = await this.listMoments(200, viewerId);
    return moments.filter((moment) =>
      [moment.content, moment.location ?? "", moment.author?.displayName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  },

  async toggleLike(momentId, userId) {
    const data = load();
    const moment = data.moments.find((item) => item.id === momentId);
    if (!moment) throw new Error("MOMENT_NOT_FOUND");

    const index = data.likes.findIndex(
      (like) => like.momentId === momentId && like.userId === userId,
    );

    if (index >= 0) {
      data.likes.splice(index, 1);
      data.notifications = data.notifications.filter(
        (item) => !(item.type === "like" && item.momentId === momentId && item.actorId === userId),
      );
      publishToUser(moment.authorId, {
        count: data.notifications.filter((item) => item.userId === moment.authorId && !item.read).length,
      });
    } else {
      data.likes.push({ momentId, userId, createdAt: new Date().toISOString() });
      if (moment.authorId !== userId) {
        const notice = {
          id: randomUUID(),
          userId: moment.authorId,
          actorId: userId,
          type: "like" as const,
          momentId,
          commentId: null,
          preview: moment.content.slice(0, 60),
          read: false,
          createdAt: new Date().toISOString(),
        };
        data.notifications.unshift(notice as (typeof data.notifications)[number]);
        publishToUser(moment.authorId, {
          count: data.notifications.filter((item) => item.userId === moment.authorId && !item.read)
            .length,
        });
      }
    }

    await persist();
    return {
      liked: index < 0,
      count: data.likes.filter((like) => like.momentId === momentId).length,
    };
  },

  async addComment(momentId, userId, content) {
    const data = load();
    const moment = data.moments.find((item) => item.id === momentId);
    if (!moment) throw new Error("MOMENT_NOT_FOUND");

    const text = content.trim().slice(0, 500);
    const comment: StoredComment = {
      id: randomUUID(),
      momentId,
      authorId: userId,
      content: text,
      createdAt: new Date().toISOString(),
    };
    data.comments.push(comment);

    if (moment.authorId !== userId) {
      data.notifications.unshift({
        id: randomUUID(),
        userId: moment.authorId,
        actorId: userId,
        type: "comment",
        momentId,
        commentId: comment.id,
        preview: text.slice(0, 60),
        read: false,
        createdAt: comment.createdAt,
      });
      publishToUser(moment.authorId, {
        count: data.notifications.filter((item) => item.userId === moment.authorId && !item.read)
          .length,
      });
    }

    await persist();
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: authorOf(data, userId),
      likeCount: 0,
      likedByMe: false,
    };
  },

  async toggleCommentLike(commentId, userId) {
    const data = load();
    const comment = data.comments.find((item) => item.id === commentId);
    if (!comment) throw new Error("COMMENT_NOT_FOUND");
    const index = data.commentLikes.findIndex((item) => item.commentId === commentId && item.userId === userId);
    if (index >= 0) {
      data.commentLikes.splice(index, 1);
      data.notifications = data.notifications.filter(
        (item) => !(item.type === "comment_like" && item.commentId === commentId && item.actorId === userId),
      );
    } else {
      data.commentLikes.push({ commentId, userId, createdAt: new Date().toISOString() });
      if (comment.authorId !== userId) {
        data.notifications.unshift({
          id: randomUUID(),
          userId: comment.authorId,
          actorId: userId,
          type: "comment_like",
          momentId: comment.momentId,
          commentId,
          preview: comment.content.slice(0, 60),
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
    publishToUser(comment.authorId, {
      count: data.notifications.filter((item) => item.userId === comment.authorId && !item.read).length,
    });
    await persist();
    return { liked: index < 0, count: data.commentLikes.filter((item) => item.commentId === commentId).length };
  },

  async deleteComment(commentId, userId, isAdmin = false) {
    const data = load();
    const comment = data.comments.find((item) => item.id === commentId);
    if (!comment || (!isAdmin && comment.authorId !== userId)) return false;
    const recipients = [...new Set(data.notifications.filter((item) => item.commentId === commentId).map((item) => item.userId))];
    data.comments = data.comments.filter((item) => item.id !== commentId);
    data.commentLikes = data.commentLikes.filter((item) => item.commentId !== commentId);
    data.notifications = data.notifications.filter((item) => item.commentId !== commentId);
    await persist();
    for (const recipient of recipients) {
      publishToUser(recipient, {
        count: data.notifications.filter((item) => item.userId === recipient && !item.read).length,
      });
    }
    return true;
  },

  async updateComment(commentId, userId, content, _isAdmin = false) {
    const data = load();
    const comment = data.comments.find((item) => item.id === commentId);
    if (!comment || comment.authorId !== userId) return null;

    const text = content.trim().slice(0, 500);
    if (!text) return null;
    comment.content = text;

    // 同步更新通知里的摘要
    for (const item of data.notifications) {
      if (item.commentId === commentId) item.preview = text.slice(0, 60);
    }

    await persist();
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: authorOf(data, comment.authorId),
      likeCount: data.commentLikes.filter((like) => like.commentId === commentId).length,
      likedByMe: false,
    };
  },

  async listNotifications(userId, limit = 20) {
    const data = load();
    return [...data.notifications]
      .filter((item) => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        type: item.type,
        actor: authorOf(data, item.actorId),
        momentId: item.momentId,
        commentId: item.commentId,
        preview: item.preview,
        read: item.read,
        createdAt: item.createdAt,
      }));
  },

  async markNotificationsRead(userId) {
    const data = load();
    let changed = false;
    for (const item of data.notifications) {
      if (item.userId === userId && !item.read) {
        item.read = true;
        changed = true;
      }
    }
    if (changed) {
      await persist();
      publishToUser(userId, { count: 0 });
    }
  },

  async unreadNotificationCount(userId) {
    return load().notifications.filter((item) => item.userId === userId && !item.read).length;
  },

  async listFriends() {
    return load().friends;
  },

  async listAnime() {
    return load().anime;
  },

  async getPage(slug) {
    const page = load().pages.find((item) => item.slug === slug);
    if (!page) return null;
    return {
      slug: page.slug,
      title: page.title,
      content: page.content,
      updated: page.updatedAt,
    } satisfies PageContent;
  },

  async stats(): Promise<SiteStats> {
    const data = load();
    const posts = await allSummaries();
    const tags = new Set(posts.flatMap((post) => post.tags.map((tag) => tag.slug)));
    const categories = new Set(
      posts.map((post) => post.category?.slug).filter(Boolean) as string[],
    );
    const started = new Date(siteConfig.hero.startDate).getTime();
    const days = Math.max(1, Math.round((Date.now() - started) / 86_400_000));
    return {
      posts: posts.length,
      words: posts.reduce((total, post) => total + post.wordCount, 0),
      tags: tags.size,
      categories: categories.size,
      views: posts.reduce((total, post) => total + post.views, 0),
      days,
      users: data.users.length,
      moments: data.moments.length,
      updatedAt: new Date().toISOString(),
    };
  },

  async bumpViews(slug) {
    return incrementViews(slug);
  },

  // ------------------------------------------------------------------ users

  async getUserById(id) {
    const data = load();
    const user = findUser(data, id);
    return user ? toPublic(data, user) : null;
  },

  async getUserByUsername(username) {
    const data = load();
    const user = data.users.find(
      (item) => item.username.toLowerCase() === username.toLowerCase(),
    );
    return user ? toPublic(data, user) : null;
  },

  async getUserByEmail(email) {
    const data = load();
    const user = data.users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    return user ? toRecord(data, user) : null;
  },

  async listUsers() {
    const data = load();
    return data.users.map((user) => toPublic(data, user));
  },

  async countUsers() {
    return load().users.length;
  },

  async createUser(input) {
    const data = load();
    const user: StoredUser = {
      id: randomUUID(),
      email: input.email.toLowerCase(),
      username: input.username.toLowerCase(),
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      role: input.role,
      avatarUrl: null,
      bannerUrl: null,
      bio: "",
      status: "刚加入",
      location: null,
      website: null,
      github: null,
      telegram: null,
      createdAt: new Date().toISOString(),
    };
    data.users.push(user);
    await persist();
    return toPublic(data, user);
  },

  async updateUser(id, patch) {
    const data = load();
    const user = findUser(data, id);
    if (!user) throw new Error("USER_NOT_FOUND");
    Object.assign(user, patch);
    await persist();
    return toPublic(data, user);
  },

  async deleteUser(id) {
    const data = load();
    const removedMoments = new Set(data.moments.filter((moment) => moment.authorId === id).map((moment) => moment.id));
    const removedComments = new Set(data.comments.filter((comment) => comment.authorId === id || removedMoments.has(comment.momentId)).map((comment) => comment.id));
    const recipients = [...new Set(data.notifications
      .filter((item) =>
        item.userId !== id &&
        ((item.momentId !== null && removedMoments.has(item.momentId)) ||
          (item.commentId !== null && removedComments.has(item.commentId)) ||
          item.actorId === id),
      )
      .map((item) => item.userId))];

    data.users = data.users.filter((user) => user.id !== id);
    data.posts = data.posts.filter((post) => post.authorId !== id);
    data.moments = data.moments.filter((moment) => moment.authorId !== id);
    data.follows = data.follows.filter((row) => row.followerId !== id && row.followingId !== id);
    data.likes = data.likes.filter((like) => like.userId !== id && !removedMoments.has(like.momentId));
    data.comments = data.comments.filter((comment) => !removedComments.has(comment.id));
    data.commentLikes = data.commentLikes.filter((like) => like.userId !== id && !removedComments.has(like.commentId));
    data.notifications = data.notifications.filter((item) =>
      item.userId !== id &&
      item.actorId !== id &&
      !(item.momentId && removedMoments.has(item.momentId)) &&
      !(item.commentId && removedComments.has(item.commentId)),
    );
    await persist();
    for (const recipient of recipients) {
      publishToUser(recipient, {
        count: data.notifications.filter((item) => item.userId === recipient && !item.read).length,
      });
    }
  },

  // ---------------------------------------------------------------- follows

  async follow(followerId, followingId) {
    if (followerId === followingId) return;
    const data = load();
    if (data.follows.some((row) => row.followerId === followerId && row.followingId === followingId)) {
      return;
    }
    const now = new Date().toISOString();
    data.follows.push({ followerId, followingId, createdAt: now });
    data.notifications.unshift({
      id: randomUUID(),
      userId: followingId,
      actorId: followerId,
      type: "follow",
      momentId: null,
      commentId: null,
      preview: null,
      read: false,
      createdAt: now,
    });
    publishToUser(followingId, {
      count: data.notifications.filter((item) => item.userId === followingId && !item.read).length,
    });
    await persist();
  },

  async unfollow(followerId, followingId) {
    const data = load();
    data.follows = data.follows.filter(
      (row) => !(row.followerId === followerId && row.followingId === followingId),
    );
    // 取关后把「xxx 关注了你」这条通知一并收回，避免误导
    data.notifications = data.notifications.filter(
      (item) => !(item.type === "follow" && item.actorId === followerId && item.userId === followingId),
    );
    await persist();
    publishToUser(followingId, {
      count: data.notifications.filter((item) => item.userId === followingId && !item.read).length,
    });
  },

  async isFollowing(followerId, followingId) {
    return load().follows.some(
      (row) => row.followerId === followerId && row.followingId === followingId,
    );
  },

  async listFollowers(userId) {
    const data = load();
    return data.follows
      .filter((row) => row.followingId === userId)
      .map((row) => findUser(data, row.followerId))
      .filter((user): user is StoredUser => Boolean(user))
      .map((user) => toPublic(data, user));
  },

  async listFollowing(userId) {
    const data = load();
    return data.follows
      .filter((row) => row.followerId === userId)
      .map((row) => findUser(data, row.followingId))
      .filter((user): user is StoredUser => Boolean(user))
      .map((user) => toPublic(data, user));
  },

  // --------------------------------------------------------------- settings

  async getSettings() {
    return mergeSettings(load().settings);
  },

  async saveSettings(patch) {
    const data = load();
    data.settings = { ...data.settings, ...patch };
    await persist();
    return mergeSettings(data.settings);
  },

  // ----------------------------------------------------------------- writes

  async savePost(authorId, input) {
    const data = load();
    const existing = data.posts.find((post) => post.slug === input.slug);
    const now = new Date().toISOString();
    if (existing) {
      Object.assign(existing, {
        title: input.title,
        description: input.description,
        content: input.content,
        coverUrl: input.coverUrl,
        category: input.category,
        tags: input.tags,
        published: input.published,
        featured: input.featured,
        pinned: input.pinned,
        updatedAt: now,
        publishedAt: input.published ? (existing.publishedAt ?? now) : null,
      });
    } else {
      data.posts.push({
        slug: input.slug,
        title: input.title,
        description: input.description,
        content: input.content,
        coverUrl: input.coverUrl,
        category: input.category,
        tags: input.tags,
        published: input.published,
        featured: input.featured,
        pinned: input.pinned,
        publishedAt: input.published ? now : null,
        createdAt: now,
        updatedAt: now,
        views: 0,
        authorId,
      });
    }
    await persist();
    return { slug: input.slug };
  },

  async deletePost(slug) {
    const data = load();
    data.posts = data.posts.filter((post) => post.slug !== slug);
    await persist();
  },

  async setPostPublished(slug, published) {
    const data = load();
    const post = data.posts.find((item) => item.slug === slug);
    if (!post) return;
    post.published = published;
    post.publishedAt = published ? (post.publishedAt ?? new Date().toISOString()) : null;
    await persist();
  },

  async createMoment(authorId, input: MomentInput) {
    const data = load();
    const now = new Date().toISOString();
    const moment: StoredMoment = {
      id: randomUUID(),
      authorId,
      content: input.content,
      images: input.images,
      location: input.location,
      createdAt: now,
      updatedAt: now,
    };
    data.moments.unshift(moment);
    await persist();
    return {
      id: moment.id,
      content: moment.content,
      images: moment.images,
      location: moment.location,
      createdAt: moment.createdAt,
      author: authorOf(data, authorId),
      likeCount: 0,
      likedByMe: false,
      comments: [],
    };
  },

  async updateMoment(id, input) {
    const data = load();
    const moment = data.moments.find((item) => item.id === id);
    if (!moment) return null;
    moment.content = input.content;
    moment.images = input.images;
    moment.location = input.location;
    moment.updatedAt = new Date().toISOString();
    await persist();
    return {
      id: moment.id,
      content: moment.content,
      images: moment.images,
      location: moment.location,
      createdAt: moment.createdAt,
      author: authorOf(data, moment.authorId),
      likeCount: 0,
      likedByMe: false,
      comments: [],
    };
  },

  async deleteMoment(id) {
    const data = load();
    const recipients = [...new Set(data.notifications.filter((item) => item.momentId === id).map((item) => item.userId))];
    const commentIds = new Set(data.comments.filter((item) => item.momentId === id).map((item) => item.id));
    data.moments = data.moments.filter((moment) => moment.id !== id);
    data.likes = data.likes.filter((item) => item.momentId !== id);
    data.comments = data.comments.filter((item) => item.momentId !== id);
    data.commentLikes = data.commentLikes.filter((item) => !commentIds.has(item.commentId));
    data.notifications = data.notifications.filter((item) => item.momentId !== id);
    await persist();
    for (const recipient of recipients) {
      publishToUser(recipient, {
        count: data.notifications.filter((item) => item.userId === recipient && !item.read).length,
      });
    }
  },

  async saveFriend(input) {
    const data = load();
    const friend: Friend = {
      id: input.id ?? randomUUID(),
      name: input.name,
      url: input.url,
      avatar: input.avatar,
      description: input.description,
      color: input.color,
    };
    const index = data.friends.findIndex((item) => item.id === friend.id);
    if (index >= 0) data.friends[index] = friend;
    else data.friends.push(friend);
    await persist();
    return friend;
  },

  async deleteFriend(id) {
    const data = load();
    data.friends = data.friends.filter((friend) => friend.id !== id);
    await persist();
  },

  async saveAnime(input) {
    const data = load();
    const item: AnimeItem = {
      id: input.id ?? randomUUID(),
      title: input.title,
      cover: input.cover,
      status: input.status,
      rating: input.rating,
      comment: input.comment,
      season: input.season,
      year: input.year,
    };
    const index = data.anime.findIndex((entry) => entry.id === item.id);
    if (index >= 0) data.anime[index] = item;
    else data.anime.push(item);
    await persist();
    return item;
  },

  async deleteAnime(id) {
    const data = load();
    data.anime = data.anime.filter((item) => item.id !== id);
    await persist();
  },

  async savePage(slug, title, content) {    const data = load();
    const page = data.pages.find((item) => item.slug === slug);
    const updatedAt = new Date().toISOString();
    if (page) {
      page.title = title;
      page.content = content;
      page.updatedAt = updatedAt;
    } else {
      data.pages.push({ slug, title, content, updatedAt });
    }
    await persist();
    return { slug, title, content, updated: updatedAt };
  },

  async listMediaReferences() {
    const data = load();
    const urls: string[] = [];
    for (const post of data.posts) urls.push(post.content, post.coverUrl ?? "");
    for (const post of readContentPosts()) urls.push(post.content, post.cover ?? "");
    for (const moment of data.moments) urls.push(moment.content, ...moment.images);
    for (const user of data.users) urls.push(user.avatarUrl ?? "", user.bannerUrl ?? "");
    for (const friend of data.friends) urls.push(friend.avatar ?? "");
    for (const item of data.anime) urls.push(item.cover ?? "");
    const settings = mergeSettings(data.settings);
    urls.push(settings.siteIcon, settings.loginBackground, ...settings.heroImages);
    return urls.filter(Boolean);
  },
};
