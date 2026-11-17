import type { AnimeItem, Friend } from "@/lib/types";

type SeedMoment = {
  id: string;
  content: string;
  images: string[];
  location: string | null;
  createdAt: string;
};

/** Demo content used when no PostgreSQL connection is configured. */

export const demoMoments: SeedMoment[] = [
  {
    id: "moment-1",
    content:
      "把博客从 Astro 挪到 Next.js 之后，终于在后台点几下就能发文了。以前改一篇文章要重新 build 三分钟，现在保存即发布。",
    images: [],
    location: "杭州",
    createdAt: "2025-03-09T21:40:00+08:00",
  },
  {
    id: "moment-2",
    content: "樱花开了。今年终于拍到一张能当壁纸的照片。",
    images: ["/images/covers/sakura.svg"],
    location: "西湖",
    createdAt: "2025-03-02T14:20:00+08:00",
  },
  {
    id: "moment-3",
    content:
      "给首页加了一层 Redis 缓存，首屏从 42ms 掉到 3ms。虽然用户根本感知不到，但自己很开心。",
    images: [],
    location: null,
    createdAt: "2025-02-18T01:12:00+08:00",
  },
  {
    id: "moment-4",
    content: "深夜调 CSS：为什么这个斜切的角在 Safari 里总是差 1px。",
    images: [],
    location: null,
    createdAt: "2025-02-03T23:58:00+08:00",
  },
  {
    id: "moment-5",
    content: "新键盘到了，茶轴的段落感确实适合写长文。",
    images: [],
    location: "家",
    createdAt: "2025-01-21T19:05:00+08:00",
  },
];

export const demoFriends: Friend[] = [
  {
    id: "friend-1",
    name: "Fuwari",
    url: "https://fuwari.vercel.app/",
    avatar: null,
    description: "另一个很漂亮的 Astro 博客主题，配色温柔。",
    color: "#8fb8f4",
  },
  {
    id: "friend-2",
    name: "Astro",
    url: "https://astro.build/",
    avatar: null,
    description: "内容优先的 Web 框架，Mizuki 主题的家。",
    color: "#f4b78f",
  },
  {
    id: "friend-3",
    name: "Next.js",
    url: "https://nextjs.org/",
    avatar: null,
    description: "这个站点的骨架，App Router + RSC。",
    color: "#9aa3b8",
  },
  {
    id: "friend-4",
    name: "Prisma",
    url: "https://www.prisma.io/",
    avatar: null,
    description: "类型安全的 ORM，写数据库查询像写 TypeScript。",
    color: "#7dd3b8",
  },
  {
    id: "friend-5",
    name: "Tailwind CSS",
    url: "https://tailwindcss.com/",
    avatar: null,
    description: "设计令牌与原子类的组合，改主题只要改变量。",
    color: "#8fe0f4",
  },
  {
    id: "friend-6",
    name: "Shiki",
    url: "https://shiki.style/",
    avatar: null,
    description: "代码高亮引擎，与 VS Code 同一套语法。",
    color: "#b79bf4",
  },
];

export const demoAnime: AnimeItem[] = [
  {
    id: "anime-1",
    title: "烟花与夏天的约定",
    cover: null,
    status: "COMPLETED",
    rating: 9,
    comment: "分镜干净，配乐克制，最后一集的十分钟值得重看。",
    season: "夏",
    year: 2024,
  },
  {
    id: "anime-2",
    title: "关于我在便利店值夜班这件事",
    cover: null,
    status: "WATCHING",
    rating: 8,
    comment: "日常番的天花板，适合睡前看两集。",
    season: "秋",
    year: 2024,
  },
  {
    id: "anime-3",
    title: "星屑列车",
    cover: null,
    status: "WATCHING",
    rating: 8,
    comment: "作画稳定，世界观铺设得慢但扎实。",
    season: "冬",
    year: 2025,
  },
  {
    id: "anime-4",
    title: "春之雪",
    cover: null,
    status: "COMPLETED",
    rating: 10,
    comment: "看完沉默了很久。樱花的意象用得极好。",
    season: "春",
    year: 2023,
  },
  {
    id: "anime-5",
    title: "深海图书馆",
    cover: null,
    status: "PLANNED",
    rating: 0,
    comment: "朋友强推，排在下个月。",
    season: "夏",
    year: 2025,
  },
  {
    id: "anime-6",
    title: "猫与旧书店",
    cover: null,
    status: "PAUSED",
    rating: 7,
    comment: "节奏偏慢，等有空再补。",
    season: "秋",
    year: 2023,
  },
  {
    id: "anime-7",
    title: "逆光少女",
    cover: null,
    status: "COMPLETED",
    rating: 9,
    comment: "演出很有想法，音乐是加分项。",
    season: "冬",
    year: 2022,
  },
  {
    id: "anime-8",
    title: "像素之城",
    cover: null,
    status: "DROPPED",
    rating: 5,
    comment: "设定有趣，但中段开始重复。",
    season: "春",
    year: 2024,
  },
];

export const demoAboutPage = `## 关于我

你好，我是 **Mizuki**，一个白天写前端、晚上写博客的人。

喜欢的东西：樱花、渐变、干净的排版、能跑起来的代码，以及深夜两点还愿意重构的决心。

## 关于这个站点

这是一个用 **Next.js** 重写的 [Mizuki](https://astro.build/themes/details/mizuki/) 主题。原版是 Astro 的静态站点，这里换成了全栈实现：

| 层 | 选型 | 用途 |
| --- | --- | --- |
| 框架 | Next.js 15 (App Router) | 服务端渲染、路由、Server Actions |
| UI | React 19 + Tailwind CSS v4 | 组件与设计令牌 |
| 数据库 | PostgreSQL + Prisma | 文章、标签、友人帐、追番 |
| 缓存 | Redis | 首页聚合、搜索、阅读量 |
| 存储 | S3 (兼容 MinIO) | 封面与图片，预签名直传 |

## 一些数字

- 全站只有导航、搜索、主题切换、阅读进度是客户端组件
- 首页在缓存命中时约 3ms 完成数据聚合
- 一篇文章的 Markdown 渲染结果会被缓存，直到它被修改

## 联系方式

- Email: [hello@mizuki.dev](mailto:hello@mizuki.dev)
- GitHub: [github.com](https://github.com/)

> 如果你也在搭建自己的博客，希望这份代码能省下你几个夜晚。
`;
