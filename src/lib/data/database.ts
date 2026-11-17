import { siteConfig } from "@/lib/config";
import { publishToUser } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import { colorFor, countWords, estimateReadingTime, slugifyTag } from "@/lib/text";
import { mergeSettings, type SiteSettings } from "@/lib/settings";
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
import { incrementViews, readViewDeltas } from "@/lib/views";

/** Row shapes mirror prisma/schema.prisma; declared locally so the file also
 *  type-checks before `prisma generate` has run. */

type UserRow = {
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
  createdAt: Date;
};

type CategoryRow = { slug: string; name: string; color: string };
type TagRow = { slug: string; name: string; color: string };

type PostRow = {
  slug: string;
  title: string;
  description: string;
  content: string;
  coverUrl: string | null;
  published: boolean;
  featured: boolean;
  pinned: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  readingTime: number;
  views: number;
  category: CategoryRow | null;
  tags: { tag: TagRow }[];
  author: UserRow | null;
};

type MomentRow = {
  id: string;
  content: string;
  images: string[];
  location: string | null;
  createdAt: Date;
  author: UserRow | null;
  likes?: { userId: string }[];
  comments?: {
    id: string;
    content: string;
    createdAt: Date;
    author: UserRow | null;
    likes?: { userId: string }[];
    _count?: { likes: number };
  }[];
  _count?: { likes: number };
};

type Counts = { followers: number; following: number; postCount: number; momentCount: number };

const EMPTY_COUNTS: Counts = { followers: 0, following: 0, postCount: 0, momentCount: 0 };

function toPublic(user: UserRow, counts: Counts = EMPTY_COUNTS): PublicUser {
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
    createdAt: user.createdAt.toISOString(),
    followers: counts.followers,
    following: counts.following,
    postCount: counts.postCount,
    momentCount: counts.momentCount,
  };
}

const postInclude = {
  category: true,
  tags: { include: { tag: true } },
  author: true,
};

function mapPost(row: PostRow): PostSummary {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    date: (row.publishedAt ?? row.createdAt).toISOString(),
    updated: row.updatedAt.toISOString(),
    category: row.category ? { ...row.category } : null,
    tags: row.tags.map(({ tag }) => ({ ...tag, count: 0 })),
    cover: row.coverUrl,
    featured: row.featured,
    pinned: row.pinned,
    draft: !row.published,
    wordCount: row.wordCount,
    readingTime: row.readingTime,
    views: row.views,
    author: row.author ? toPublic(row.author) : null,
  };
}

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

async function fetchPosts(options?: { drafts?: boolean; authorId?: string }) {
  const rows = await prisma.post.findMany({
    where: {
      ...(options?.drafts ? {} : { published: true }),
      ...(options?.authorId ? { authorId: options.authorId } : {}),
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: postInclude,
  });
  return rows as unknown as PostRow[];
}

async function withDeltas(posts: PostSummary[]) {
  const deltas = await readViewDeltas();
  return posts.map((post) => ({ ...post, views: post.views + (deltas[post.slug] ?? 0) }));
}

async function countsFor(userId: string): Promise<Counts> {
  const [followers, following, postCount, momentCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.post.count({ where: { authorId: userId, published: true } }),
    prisma.moment.count({ where: { authorId: userId } }),
  ]);
  return { followers, following, postCount, momentCount };
}

function mapMomentRow(row: MomentRow, viewerId?: string): Moment {
  return {
    id: row.id,
    content: row.content,
    images: row.images,
    location: row.location,
    createdAt: row.createdAt.toISOString(),
    author: row.author ? toPublic(row.author) : null,
    likeCount: row._count?.likes ?? row.likes?.length ?? 0,
    likedByMe: Boolean(viewerId && row.likes?.some((like) => like.userId === viewerId)),
    comments: (row.comments ?? []).map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      author: comment.author ? toPublic(comment.author) : null,
      likeCount: comment._count?.likes ?? comment.likes?.length ?? 0,
      likedByMe: Boolean(viewerId && comment.likes?.some((like) => like.userId === viewerId)),
    })),
  };
}

function momentInclude(viewerId?: string) {
  return {
    author: true,
    comments: {
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        author: true,
        likes: { where: { userId: viewerId ?? "__none__" }, select: { userId: true } },
        _count: { select: { likes: true } },
      },
    },
    likes: {
      where: { userId: viewerId ?? "__none__" },
      select: { userId: true },
    },
    _count: { select: { likes: true } },
  } as const;
}

const SETTINGS_KEY = "site";

/** Cheap liveness probe used to decide between PostgreSQL and the JSON store. */
export async function pingDatabase() {
  await prisma.$queryRaw`SELECT 1`;
}

export const databaseStore: Store = {
  mode: "database",

  async listPosts(options) {
    const rows = await fetchPosts(options);
    return withDeltas(applyTagCounts(rows.map(mapPost)));
  },

  async getPost(slug, options) {
    const row = (await prisma.post.findUnique({
      where: { slug },
      include: postInclude,
    })) as unknown as PostRow | null;

    if (!row) return null;
    if (!row.published && !options?.drafts) return null;

    const deltas = await readViewDeltas();
    return {
      ...mapPost(row),
      content: row.content,
      views: row.views + (deltas[slug] ?? 0),
    } satisfies PostDetail;
  },

  async getNeighbours(slug) {
    const rows = await fetchPosts();
    const summaries = applyTagCounts(rows.map(mapPost));
    const index = summaries.findIndex((post) => post.slug === slug);
    if (index < 0) return { prev: null, next: null };
    return { prev: summaries[index + 1] ?? null, next: summaries[index - 1] ?? null };
  },

  async listCategories(): Promise<CategoryWithCount[]> {
    const categories = (await prisma.category.findMany({
      orderBy: { order: "asc" },
    })) as unknown as Array<CategoryRow & { id: string }>;

    const grouped = (await prisma.post.groupBy({
      by: ["categoryId"],
      where: { published: true, categoryId: { not: null } },
      _count: { _all: true },
    })) as unknown as Array<{ categoryId: string | null; _count: { _all: number } }>;

    const counts = new Map(grouped.map((row) => [row.categoryId, row._count._all]));
    return categories
      .map((category) => ({
        slug: category.slug,
        name: category.name,
        color: category.color,
        count: counts.get(category.id) ?? 0,
      }))
      .filter((category) => category.count > 0)
      .sort((a, b) => b.count - a.count);
  },

  async listTags(): Promise<TagRef[]> {
    const tags = (await prisma.tag.findMany({
      include: { posts: { include: { post: { select: { published: true } } } } },
    })) as unknown as Array<TagRow & { posts: Array<{ post: { published: boolean } }> }>;

    return tags
      .map((tag) => ({
        ...tag,
        count: tag.posts.filter((link) => link.post.published).length,
      }))
      .filter((tag) => tag.count > 0)
      .sort((a, b) => b.count - a.count);
  },

  async listArchive(): Promise<ArchiveGroup[]> {
    const posts = await this.listPosts();
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
    const needle = query.trim();
    if (!needle) return [];
    const rows = (await prisma.post.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: needle, mode: "insensitive" } },
          { description: { contains: needle, mode: "insensitive" } },
          { content: { contains: needle, mode: "insensitive" } },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 30,
      include: postInclude,
    })) as unknown as PostRow[];
    return withDeltas(rows.map(mapPost));
  },

  async listMoments(limit = 60, viewerId?: string): Promise<Moment[]> {
    const rows = (await prisma.moment.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: momentInclude(viewerId),
    })) as unknown as MomentRow[];

    return rows.map((row) => mapMomentRow(row, viewerId));
  },

  async searchMoments(query, viewerId?: string) {
    const needle = query.trim();
    if (!needle) return [];
    const rows = (await prisma.moment.findMany({
      where: {
        published: true,
        OR: [
          { content: { contains: needle, mode: "insensitive" } },
          { location: { contains: needle, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: momentInclude(viewerId),
    })) as unknown as MomentRow[];

    return rows.map((row) => mapMomentRow(row, viewerId));
  },

  async toggleLike(momentId, userId) {
    const existing = (await prisma.momentLike.findUnique({
      where: { momentId_userId: { momentId, userId } },
    })) as unknown as { momentId: string } | null;

    if (existing) {
      await prisma.momentLike.delete({
        where: { momentId_userId: { momentId, userId } },
      });
      const moment = await prisma.moment.findUnique({ where: { id: momentId }, select: { authorId: true } });
      if (moment && moment.authorId !== userId) {
        await prisma.notification.deleteMany({ where: { userId: moment.authorId, actorId: userId, type: "like", momentId } });
        publishToUser(moment.authorId, { count: await prisma.notification.count({ where: { userId: moment.authorId, read: false } }) });
      }
    } else {
      await prisma.momentLike.create({ data: { momentId, userId } });
      const moment = (await prisma.moment.findUnique({
        where: { id: momentId },
        select: { authorId: true, content: true },
      })) as unknown as { authorId: string; content: string } | null;
      if (moment && moment.authorId !== userId) {
        await prisma.notification
          .create({
            data: {
              userId: moment.authorId,
              actorId: userId,
              type: "like",
              momentId,
              preview: moment.content.slice(0, 60),
            },
          })
          .catch(() => undefined);
        const unread = await prisma.notification.count({
          where: { userId: moment.authorId, read: false },
        });
        publishToUser(moment.authorId, { count: unread });
      }
    }

    const count = await prisma.momentLike.count({ where: { momentId } });
    return { liked: !existing, count };
  },

  async toggleCommentLike(commentId, userId) {
    const comment = await prisma.momentComment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, momentId: true, content: true },
    });
    if (!comment) throw new Error("COMMENT_NOT_FOUND");
    const existing = await prisma.momentCommentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });
    if (existing) {
      await prisma.momentCommentLike.delete({ where: { commentId_userId: { commentId, userId } } });
      await prisma.notification.deleteMany({
        where: { userId: comment.authorId, actorId: userId, type: "comment_like", commentId },
      });
    } else {
      await prisma.momentCommentLike.create({ data: { commentId, userId } });
      if (comment.authorId !== userId) {
        await prisma.notification.create({
          data: {
            userId: comment.authorId,
            actorId: userId,
            type: "comment_like",
            momentId: comment.momentId,
            commentId,
            preview: comment.content.slice(0, 60),
          },
        });
      }
    }
    publishToUser(comment.authorId, {
      count: await prisma.notification.count({ where: { userId: comment.authorId, read: false } }),
    });
    return { liked: !existing, count: await prisma.momentCommentLike.count({ where: { commentId } }) };
  },

  async addComment(momentId, userId, content) {
    const text = content.trim().slice(0, 500);
    const row = (await prisma.momentComment.create({
      data: { momentId, authorId: userId, content: text },
      include: { author: true },
    })) as unknown as {
      id: string;
      content: string;
      createdAt: Date;
      author: UserRow | null;
    };

    const moment = (await prisma.moment.findUnique({
      where: { id: momentId },
      select: { authorId: true },
    })) as unknown as { authorId: string } | null;

    if (moment && moment.authorId !== userId) {
      await prisma.notification
        .create({
          data: {
            userId: moment.authorId,
            actorId: userId,
            type: "comment",
            momentId,
            commentId: row.id,
            preview: text.slice(0, 60),
          },
        })
        .catch(() => undefined);
      const unread = await prisma.notification.count({
        where: { userId: moment.authorId, read: false },
      });
      publishToUser(moment.authorId, { count: unread });
    }

    return {
      id: row.id,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      author: row.author ? toPublic(row.author) : null,
      likeCount: 0,
      likedByMe: false,
    };
  },

  async deleteComment(commentId, userId, isAdmin = false) {
    const row = await prisma.momentComment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });
    if (!row || (!isAdmin && row.authorId !== userId)) return false;
    const notifications = await prisma.notification.findMany({
      where: { commentId },
      select: { userId: true },
      distinct: ["userId"],
    });
    await prisma.$transaction([
      prisma.momentComment.delete({ where: { id: commentId } }),
      prisma.notification.deleteMany({ where: { commentId } }),
    ]);
    for (const recipient of notifications) {
      publishToUser(recipient.userId, {
        count: await prisma.notification.count({ where: { userId: recipient.userId, read: false } }),
      });
    }
    return true;
  },

  async updateComment(commentId, userId, content, _isAdmin = false) {
    const row = (await prisma.momentComment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    })) as unknown as { authorId: string } | null;
    if (!row || row.authorId !== userId) return null;

    const text = content.trim().slice(0, 500);
    if (!text) return null;

    const updated = (await prisma.momentComment.update({
      where: { id: commentId },
      data: { content: text },
      include: { author: true },
    })) as unknown as {
      id: string;
      content: string;
      createdAt: Date;
      author: UserRow | null;
    };

    await prisma.notification
      .updateMany({ where: { commentId }, data: { preview: text.slice(0, 60) } })
      .catch(() => undefined);

    return {
      id: updated.id,
      content: updated.content,
      createdAt: updated.createdAt.toISOString(),
      author: updated.author ? toPublic(updated.author) : null,
      likeCount: await prisma.momentCommentLike.count({ where: { commentId } }),
      likedByMe: false,
    };
  },

  async listNotifications(userId, limit = 20) {
    const rows = (await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { actor: true },
    })) as unknown as Array<{
      id: string;
      type: string;
      momentId: string | null;
      commentId: string | null;
      preview: string | null;
      read: boolean;
      createdAt: Date;
      actor: UserRow | null;
    }>;

    return rows.map((row) => ({
      id: row.id,
      type: (row.type as "like" | "comment" | "comment_like" | "follow") ?? "like",
      actor: row.actor ? toPublic(row.actor) : null,
      momentId: row.momentId,
      commentId: row.commentId,
      preview: row.preview,
      read: row.read,
      createdAt: row.createdAt.toISOString(),
    }));
  },

  async markNotificationsRead(userId) {
    await prisma.notification
      .updateMany({ where: { userId, read: false }, data: { read: true } })
      .catch(() => undefined);
    publishToUser(userId, { count: 0 });
  },

  async unreadNotificationCount(userId) {
    return prisma.notification.count({ where: { userId, read: false } });
  },

  async listFriends(): Promise<Friend[]> {
    const rows = (await prisma.friend.findMany({ orderBy: { order: "asc" } })) as unknown as Array<{
      id: string;
      name: string;
      url: string;
      avatarUrl: string | null;
      description: string;
      color: string;
    }>;
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      avatar: row.avatarUrl,
      description: row.description,
      color: row.color,
    }));
  },

  async listAnime(): Promise<AnimeItem[]> {
    const rows = (await prisma.anime.findMany({
      orderBy: [{ order: "asc" }, { title: "asc" }],
    })) as unknown as Array<{
      id: string;
      title: string;
      coverUrl: string | null;
      status: AnimeItem["status"];
      rating: number;
      comment: string;
      season: string | null;
      year: number | null;
    }>;
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      cover: row.coverUrl,
      status: row.status,
      rating: row.rating,
      comment: row.comment,
      season: row.season,
      year: row.year,
    }));
  },

  async getPage(slug) {
    const page = (await prisma.page.findUnique({ where: { slug } })) as unknown as {
      slug: string;
      title: string;
      content: string;
      updatedAt: Date;
    } | null;
    if (!page) return null;
    return {
      slug: page.slug,
      title: page.title,
      content: page.content,
      updated: page.updatedAt.toISOString(),
    } satisfies PageContent;
  },

  async stats(): Promise<SiteStats> {
    const posts = await this.listPosts();
    const [tagCount, categoryCount, viewSum, userCount, momentCount] =
      await Promise.all([
        prisma.tag.count(),
        prisma.category.count(),
        prisma.post.aggregate({ _sum: { views: true } }) as unknown as Promise<{
          _sum: { views: number | null };
        }>,
        prisma.user.count(),
        prisma.moment.count(),
      ]);

    const started = new Date(siteConfig.hero.startDate).getTime();
    const days = Math.max(1, Math.round((Date.now() - started) / 86_400_000));

    return {
      posts: posts.length,
      words: posts.reduce((total, post) => total + post.wordCount, 0),
      tags: tagCount,
      categories: categoryCount,
      views: viewSum._sum.views ?? 0,
      days,
      users: userCount,
      moments: momentCount,
      updatedAt: new Date().toISOString(),
    };
  },

  async bumpViews(slug) {
    return incrementViews(slug);
  },

  // ------------------------------------------------------------------ users

  async getUserById(id) {
    const row = (await prisma.user.findUnique({ where: { id } })) as unknown as UserRow | null;
    if (!row) return null;
    return toPublic(row, await countsFor(row.id));
  },

  async getUserByUsername(username) {
    const row = (await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
    })) as unknown as UserRow | null;
    if (!row) return null;
    return toPublic(row, await countsFor(row.id));
  },

  async getUserByEmail(email): Promise<UserRecord | null> {
    const row = (await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })) as unknown as UserRow | null;
    if (!row) return null;
    return {
      ...toPublic(row, await countsFor(row.id)),
      email: row.email,
      passwordHash: row.passwordHash,
    };
  },

  async listUsers(): Promise<PublicUser[]> {
    const rows = (await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    })) as unknown as UserRow[];
    const result: PublicUser[] = [];
    for (const row of rows) result.push(toPublic(row, await countsFor(row.id)));
    return result;
  },

  async countUsers() {
    return prisma.user.count();
  },

  async createUser(input) {
    const row = (await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        username: input.username.toLowerCase(),
        displayName: input.displayName,
        passwordHash: input.passwordHash,
        role: input.role,
      },
    })) as unknown as UserRow;
    return toPublic(row);
  },

  async updateUser(id, patch) {
    const row = (await prisma.user.update({
      where: { id },
      data: patch,
    })) as unknown as UserRow;
    return toPublic(row, await countsFor(id));
  },

  async deleteUser(id) {
    const recipients = await prisma.notification.findMany({
      where: { actorId: id },
      select: { userId: true },
      distinct: ["userId"],
    });
    await prisma.user.delete({ where: { id } });
    for (const recipient of recipients) {
      publishToUser(recipient.userId, {
        count: await prisma.notification.count({ where: { userId: recipient.userId, read: false } }),
      });
    }
  },

  async follow(followerId, followingId) {
    if (followerId === followingId) return;
    const existing = (await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
      select: { followerId: true },
    })) as unknown as { followerId: string } | null;

    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      update: {},
      create: { followerId, followingId },
    });

    if (!existing) {
      await prisma.notification
        .create({
          data: {
            userId: followingId,
            actorId: followerId,
            type: "follow",
            preview: null,
          },
        })
        .catch(() => undefined);
      const unread = await prisma.notification.count({
        where: { userId: followingId, read: false },
      });
      publishToUser(followingId, { count: unread });
    }
  },

  async unfollow(followerId, followingId) {
    await prisma.follow
      .delete({ where: { followerId_followingId: { followerId, followingId } } })
      .catch(() => undefined);
    // 取关后收回「xxx 关注了你」的通知
    await prisma.notification
      .deleteMany({ where: { userId: followingId, actorId: followerId, type: "follow" } })
      .catch(() => undefined);
    publishToUser(followingId, {
      count: await prisma.notification.count({ where: { userId: followingId, read: false } }),
    });
  },

  async isFollowing(followerId, followingId) {
    const row = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return Boolean(row);
  },

  async listFollowers(userId): Promise<PublicUser[]> {
    const rows = (await prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: true },
    })) as unknown as Array<{ follower: UserRow }>;
    return rows.map((row) => toPublic(row.follower));
  },

  async listFollowing(userId): Promise<PublicUser[]> {
    const rows = (await prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: true },
    })) as unknown as Array<{ following: UserRow }>;
    return rows.map((row) => toPublic(row.following));
  },

  // --------------------------------------------------------------- settings

  async getSettings(): Promise<SiteSettings> {
    const row = (await prisma.setting.findUnique({ where: { key: SETTINGS_KEY } })) as unknown as {
      value: string;
    } | null;
    if (!row) return mergeSettings(null);
    try {
      return mergeSettings(JSON.parse(row.value) as Partial<SiteSettings>);
    } catch {
      return mergeSettings(null);
    }
  },

  async saveSettings(patch): Promise<SiteSettings> {
    const current = await this.getSettings();
    const next = mergeSettings({ ...current, ...patch });
    await prisma.setting.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: JSON.stringify(next) },
      create: { key: SETTINGS_KEY, value: JSON.stringify(next) },
    });
    return next;
  },

  // ----------------------------------------------------------------- writes

  async savePost(authorId, input: PostInput) {
    const wordCount = countWords(input.content);
    const readingTime = estimateReadingTime(wordCount);

    let categoryId: string | null = null;
    if (input.category) {
      const slug = slugifyTag(input.category);
      const category = (await prisma.category.upsert({
        where: { slug },
        update: { name: input.category },
        create: { slug, name: input.category, color: colorFor(input.category) },
      })) as unknown as { id: string };
      categoryId = category.id;
    }

    const tagIds: string[] = [];
    for (const name of input.tags) {
      const slug = slugifyTag(name);
      if (!slug) continue;
      const tag = (await prisma.tag.upsert({
        where: { slug },
        update: { name },
        create: { slug, name, color: colorFor(name) },
      })) as unknown as { id: string };
      tagIds.push(tag.id);
    }

    const existing = (await prisma.post.findUnique({
      where: { slug: input.slug },
      select: { id: true, publishedAt: true },
    })) as unknown as { id: string; publishedAt: Date | null } | null;

    const payload = {
      title: input.title,
      description: input.description,
      content: input.content,
      coverUrl: input.coverUrl,
      published: input.published,
      featured: input.featured,
      pinned: input.pinned,
      publishedAt: input.published ? (existing?.publishedAt ?? new Date()) : null,
      wordCount,
      readingTime,
      categoryId,
    };

    if (existing) {
      await prisma.post.update({
        where: { id: existing.id },
        data: {
          ...payload,
          tags: {
            deleteMany: {},
            create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
          },
        },
      });
    } else {
      await prisma.post.create({
        data: {
          ...payload,
          slug: input.slug,
          authorId,
          tags: { create: tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })) },
        },
      });
    }

    return { slug: input.slug };
  },

  async deletePost(slug) {
    await prisma.post.delete({ where: { slug } }).catch(() => undefined);
  },

  async setPostPublished(slug, published) {
    const existing = (await prisma.post.findUnique({
      where: { slug },
      select: { publishedAt: true },
    })) as unknown as { publishedAt: Date | null } | null;
    await prisma.post
      .update({
        where: { slug },
        data: {
          published,
          publishedAt: published ? (existing?.publishedAt ?? new Date()) : null,
        },
      })
      .catch(() => undefined);
  },

  async createMoment(authorId, input: MomentInput) {
    const row = (await prisma.moment.create({
      data: {
        content: input.content,
        images: input.images,
        location: input.location,
        authorId,
      },
      include: { author: true },
    })) as unknown as MomentRow;

    return {
      id: row.id,
      content: row.content,
      images: row.images,
      location: row.location,
      createdAt: row.createdAt.toISOString(),
      author: row.author ? toPublic(row.author) : null,
      likeCount: 0,
      likedByMe: false,
      comments: [],
    };
  },

  async updateMoment(id, input) {
    const row = (await prisma.moment
      .update({
        where: { id },
        data: { content: input.content, images: input.images, location: input.location },
        include: { author: true },
      })
      .catch(() => null)) as unknown as MomentRow | null;
    if (!row) return null;
    return {
      id: row.id,
      content: row.content,
      images: row.images,
      location: row.location,
      createdAt: row.createdAt.toISOString(),
      author: row.author ? toPublic(row.author) : null,
      likeCount: 0,
      likedByMe: false,
      comments: [],
    };
  },

  async deleteMoment(id) {
    const recipients = await prisma.notification.findMany({
      where: { momentId: id },
      select: { userId: true },
      distinct: ["userId"],
    });
    await prisma.$transaction([
      prisma.moment.delete({ where: { id } }),
      prisma.notification.deleteMany({ where: { momentId: id } }),
    ]);
    for (const recipient of recipients) {
      publishToUser(recipient.userId, {
        count: await prisma.notification.count({ where: { userId: recipient.userId, read: false } }),
      });
    }
  },

  async saveFriend(input) {
    const data = {
      name: input.name,
      url: input.url,
      avatarUrl: input.avatar,
      description: input.description,
      color: input.color,
    };
    const row = (input.id
      ? await prisma.friend.update({ where: { id: input.id }, data })
      : await prisma.friend.create({ data })) as unknown as {
      id: string;
      name: string;
      url: string;
      avatarUrl: string | null;
      description: string;
      color: string;
    };
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      avatar: row.avatarUrl,
      description: row.description,
      color: row.color,
    };
  },

  async deleteFriend(id) {
    await prisma.friend.delete({ where: { id } }).catch(() => undefined);
  },

  async saveAnime(input) {
    const data = {
      title: input.title,
      coverUrl: input.cover,
      status: input.status,
      rating: input.rating,
      comment: input.comment,
      season: input.season,
      year: input.year,
    };
    const row = (input.id
      ? await prisma.anime.update({ where: { id: input.id }, data })
      : await prisma.anime.create({ data })) as unknown as {
      id: string;
      title: string;
      coverUrl: string | null;
      status: AnimeItem["status"];
      rating: number;
      comment: string;
      season: string | null;
      year: number | null;
    };
    return {
      id: row.id,
      title: row.title,
      cover: row.coverUrl,
      status: row.status,
      rating: row.rating,
      comment: row.comment,
      season: row.season,
      year: row.year,
    };
  },

  async deleteAnime(id) {
    await prisma.anime.delete({ where: { id } }).catch(() => undefined);
  },

  async savePage(slug, title, content) {
    const row = (await prisma.page.upsert({
      where: { slug },
      update: { title, content },
      create: { slug, title, content },
    })) as unknown as { slug: string; title: string; content: string; updatedAt: Date };
    return {
      slug: row.slug,
      title: row.title,
      content: row.content,
      updated: row.updatedAt.toISOString(),
    };
  },

  async listMediaReferences() {
    const [posts, moments, users, friends, anime, settings] = await Promise.all([
      prisma.post.findMany({ select: { content: true, coverUrl: true } }) as unknown as Promise<
        Array<{ content: string; coverUrl: string | null }>
      >,
      prisma.moment.findMany({ select: { content: true, images: true } }) as unknown as Promise<
        Array<{ content: string; images: string[] }>
      >,
      prisma.user.findMany({
        select: { avatarUrl: true, bannerUrl: true },
      }) as unknown as Promise<Array<{ avatarUrl: string | null; bannerUrl: string | null }>>,
      prisma.friend.findMany({ select: { avatarUrl: true } }) as unknown as Promise<
        Array<{ avatarUrl: string | null }>
      >,
      prisma.anime.findMany({ select: { coverUrl: true } }) as unknown as Promise<
        Array<{ coverUrl: string | null }>
      >,
      this.getSettings(),
    ]);

    const urls: string[] = [];
    for (const post of posts) urls.push(post.content, post.coverUrl ?? "");
    for (const moment of moments) urls.push(moment.content, ...moment.images);
    for (const user of users) urls.push(user.avatarUrl ?? "", user.bannerUrl ?? "");
    for (const friend of friends) urls.push(friend.avatarUrl ?? "");
    for (const item of anime) urls.push(item.coverUrl ?? "");
    urls.push(settings.siteIcon, settings.loginBackground, ...settings.heroImages);
    return urls.filter(Boolean);
  },
};
