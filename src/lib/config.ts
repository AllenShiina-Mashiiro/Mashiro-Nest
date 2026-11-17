import type { SiteConfig } from "@/lib/types";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const siteConfig: SiteConfig = {
  title: "真白屋",
  subtitle: "Mashiro Nest",
  titleZh: "真白屋",
  description:
    "Mizuki — 一个用 Next.js、React、PostgreSQL、Prisma、Redis、S3 与 Tailwind CSS 构建的个人博客。",
  keywords: ["博客", "Next.js", "React", "Prisma", "Tailwind CSS", "Redis", "S3"],
  url: siteUrl,
  locale: "zh-CN",
  timeZone: "Asia/Shanghai",
  author: {
    name: "Mizuki",
    role: "Front-end / Full-stack",
    bio: "This is a description",
    avatar: "/images/avatar.svg",
    email: "hello@mizuki.dev",
    socials: [
      { label: "Email", href: "mailto:hello@mizuki.dev", icon: "mail" },
      { label: "GitHub", href: "https://github.com/", icon: "github" },
      { label: "RSS", href: "/rss.xml", icon: "rss" },
    ],
  },
  nav: [
    { label: "Home", href: "/", icon: "home" },
    { label: "Archive", href: "/archive", icon: "archive" },
    { label: "About", href: "/about", icon: "about" },
    { label: "Friends", href: "/friends", icon: "friends" },
    { label: "Anime", href: "/anime", icon: "anime" },
    { label: "Moments", href: "/moments", icon: "moments" },
  ],
  github: "https://github.com/",
  postsPerPage: 6,
  license: "CC BY-NC-SA 4.0",
  icp: "萌 ICP 备 2025000001 号",
  hero: {
    image: "/images/banner.svg",
    startDate: "2023-01-01",
  },
  tech: [
    "Next.js 15",
    "React 19",
    "PostgreSQL",
    "Prisma",
    "Redis",
    "S3",
    "Tailwind CSS v4",
  ],
};
