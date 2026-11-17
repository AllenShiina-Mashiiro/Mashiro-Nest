/**
 * Site-wide settings, editable from /admin/settings and cached in Redis
 * (+ a process-local fallback). Values are stored as one row per key.
 */

export type SiteSettings = {
  siteName: string;
  siteSubtitle: string;
  siteDescription: string;
  siteIcon: string;
  icp: string;

  /** 联系邮箱 / GitHub / Telegram：全部可以在后台改，前台名片与导航同步。 */
  contactEmail: string;
  githubUrl: string;
  telegramUrl: string;

  heroTitle: string;
  heroSubtitle: string;
  /** Multiple backgrounds; one is picked per request (rotates). */
  heroImages: string[];
  /** Diagonal light beam + split line over the hero. */
  heroBeam: boolean;

  aboutTitle: string;
  aboutContent: string;

  loginBackground: string;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "真白屋",
  siteSubtitle: "Mashiro Nest",
  siteDescription:
    "Mashiro Nest — 一个用 Next.js、React、PostgreSQL、Prisma、Redis、S3 与 Tailwind CSS 构建的多用户个人博客。",
  siteIcon: "/favicon.svg",
  icp: "萌 ICP 备 2025000001 号",

  contactEmail: "hello@mashiro.dev",
  githubUrl: "https://github.com/",
  telegramUrl: "",

  heroTitle: "真白屋",
  heroSubtitle: "Mashiro Nest · 记录代码与樱花",
  heroImages: ["/images/banner.svg"],
  heroBeam: true,

  aboutTitle: "关于",
  aboutContent: "",

  loginBackground: "/images/banner.svg",
};

export const SETTINGS_KEY = "site";

export function mergeSettings(partial: Partial<SiteSettings> | null | undefined): SiteSettings {
  return { ...DEFAULT_SETTINGS, ...(partial ?? {}) };
}
