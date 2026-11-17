export type SocialIcon = "mail" | "github" | "rss" | "twitter" | "bilibili" | "telegram" | "link";

export type NavItem = {
  label: string;
  href: string;
  icon?: string;
  external?: boolean;
};

export type SocialLink = {
  label: string;
  href: string;
  icon: SocialIcon;
};

export type SiteConfig = {
  title: string;
  subtitle: string;
  titleZh: string;
  description: string;
  keywords: string[];
  url: string;
  locale: string;
  timeZone: string;
  author: {
    name: string;
    role: string;
    bio: string;
    avatar: string;
    email: string;
    socials: SocialLink[];
  };
  nav: NavItem[];
  github: string;
  postsPerPage: number;
  license: string;
  icp: string;
  hero: { image: string; startDate: string };
  tech: string[];
};

export type Role = "ADMIN" | "USER";

/** A user as exposed to the UI (never contains the password hash). */
export type PublicUser = {
  id: string;
  username: string;
  displayName: string;
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
  followers: number;
  following: number;
  postCount: number;
  momentCount: number;
};

/** Full record including secrets — only used by the auth/store layer. */
export type UserRecord = PublicUser & {
  email: string;
  passwordHash: string;
};

export type CategoryRef = {
  slug: string;
  name: string;
  color: string;
};

export type TagRef = CategoryRef & { count: number };

export type CategoryWithCount = CategoryRef & { count: number };

export type PostSummary = {
  slug: string;
  title: string;
  description: string;
  /** ISO string of the publish date. */
  date: string;
  updated?: string | null;
  category: CategoryRef | null;
  tags: TagRef[];
  cover: string | null;
  featured: boolean;
  pinned: boolean;
  draft: boolean;
  wordCount: number;
  readingTime: number;
  views: number;
  author: PublicUser | null;
};

export type PostDetail = PostSummary & {
  content: string;
};

export type PostInput = {
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
};

export type TocItem = {
  id: string;
  text: string;
  level: number;
};

export type RenderedMarkdown = {
  html: string;
  toc: TocItem[];
  wordCount: number;
  readingTime: number;
};

export type ArchiveGroup = {
  year: number;
  posts: PostSummary[];
};

export type MomentComment = {
  id: string;
  content: string;
  createdAt: string;
  author: PublicUser | null;
};

export type Moment = {
  id: string;
  content: string;
  images: string[];
  location: string | null;
  createdAt: string;
  author: PublicUser | null;
  likeCount: number;
  likedByMe: boolean;
  comments: MomentComment[];
};

export type NotificationType = "like" | "comment" | "follow";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  actor: PublicUser | null;
  momentId: string | null;
  preview: string | null;
  read: boolean;
  createdAt: string;
};

export type MomentInput = {
  content: string;
  images: string[];
  location: string | null;
};

export type Friend = {
  id: string;
  name: string;
  url: string;
  avatar: string | null;
  description: string;
  color: string;
};

export type AnimeStatus = "WATCHING" | "COMPLETED" | "PLANNED" | "PAUSED" | "DROPPED";

export type AnimeItem = {
  id: string;
  title: string;
  cover: string | null;
  status: AnimeStatus;
  rating: number;
  comment: string;
  season: string | null;
  year: number | null;
};

export type PageContent = {
  slug: string;
  title: string;
  content: string;
  updated: string;
};

export type SiteStats = {
  posts: number;
  words: number;
  tags: number;
  categories: number;
  views: number;
  days: number;
  users: number;
  moments: number;
  updatedAt: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type SearchResults = {
  posts: PostSummary[];
  moments: Moment[];
  users: PublicUser[];
};

export type MediaItem = {
  key: string;
  url: string;
  size: number;
  hash: string;
  lastModified: string | null;
  kind: "s3" | "local";
};

/**
 * One interface for every read/write the site needs; implemented twice
 * (PostgreSQL/Prisma for production, a JSON store for zero-infra demo).
 */
export type Store = {
  readonly mode: "database" | "demo";

  listPosts(options?: { drafts?: boolean; authorId?: string }): Promise<PostSummary[]>;
  getPost(slug: string, options?: { drafts?: boolean }): Promise<PostDetail | null>;
  getNeighbours(slug: string): Promise<{ prev: PostSummary | null; next: PostSummary | null }>;
  listCategories(): Promise<CategoryWithCount[]>;
  listTags(): Promise<TagRef[]>;
  listArchive(): Promise<ArchiveGroup[]>;
  searchPosts(query: string): Promise<PostSummary[]>;
  listMoments(limit?: number, viewerId?: string): Promise<Moment[]>;
  searchMoments(query: string, viewerId?: string): Promise<Moment[]>;

  toggleLike(momentId: string, userId: string): Promise<{ liked: boolean; count: number }>;
  addComment(momentId: string, userId: string, content: string): Promise<MomentComment>;
  deleteComment(commentId: string, userId: string, isAdmin?: boolean): Promise<void>;
  updateComment(
    commentId: string,
    userId: string,
    content: string,
    isAdmin?: boolean,
  ): Promise<MomentComment | null>;

  listNotifications(userId: string, limit?: number): Promise<NotificationItem[]>;
  markNotificationsRead(userId: string): Promise<void>;
  unreadNotificationCount(userId: string): Promise<number>;
  listFriends(): Promise<Friend[]>;
  listAnime(): Promise<AnimeItem[]>;
  getPage(slug: string): Promise<PageContent | null>;
  stats(): Promise<SiteStats>;
  bumpViews(slug: string): Promise<number>;

  // ---------------------------------------------------------------- users --
  getUserById(id: string): Promise<PublicUser | null>;
  getUserByUsername(username: string): Promise<PublicUser | null>;
  getUserByEmail(email: string): Promise<UserRecord | null>;
  listUsers(): Promise<PublicUser[]>;
  countUsers(): Promise<number>;
  createUser(input: {
    email: string;
    username: string;
    displayName: string;
    passwordHash: string;
    role: Role;
  }): Promise<PublicUser>;
  updateUser(
    id: string,
    patch: Partial<{
      displayName: string;
      bio: string;
      status: string;
      location: string | null;
      website: string | null;
      github: string | null;
      telegram: string | null;
      avatarUrl: string | null;
      bannerUrl: string | null;
      email: string;
      passwordHash: string;
      role: Role;
    }>,
  ): Promise<PublicUser>;
  deleteUser(id: string): Promise<void>;
  updateUserMetrics?(id: string): Promise<void>;

  // -------------------------------------------------------------- follows --
  follow(followerId: string, followingId: string): Promise<void>;
  unfollow(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  listFollowers(userId: string): Promise<PublicUser[]>;
  listFollowing(userId: string): Promise<PublicUser[]>;

  // ------------------------------------------------------------- settings --
  getSettings(): Promise<import("@/lib/settings").SiteSettings>;
  saveSettings(
    patch: Partial<import("@/lib/settings").SiteSettings>,
  ): Promise<import("@/lib/settings").SiteSettings>;

  // ---------------------------------------------------------------- writes --
  savePost(authorId: string, input: PostInput): Promise<{ slug: string }>;
  deletePost(slug: string): Promise<void>;
  setPostPublished(slug: string, published: boolean): Promise<void>;

  createMoment(authorId: string, input: MomentInput): Promise<Moment>;
  updateMoment(id: string, input: MomentInput): Promise<Moment | null>;
  deleteMoment(id: string): Promise<void>;

  saveFriend(input: Omit<Friend, "id"> & { id?: string }): Promise<Friend>;
  deleteFriend(id: string): Promise<void>;

  saveAnime(input: Omit<AnimeItem, "id"> & { id?: string }): Promise<AnimeItem>;
  deleteAnime(id: string): Promise<void>;

  savePage(slug: string, title: string, content: string): Promise<PageContent>;

  /** Every URL referenced anywhere on the site (used by the orphan scan). */
  listMediaReferences(): Promise<string[]>;
};
