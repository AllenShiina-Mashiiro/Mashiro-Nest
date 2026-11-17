---
title: 从 Astro 到 Next.js：一套全栈博客的取舍
description: Mizuki 原本是 Astro 主题，这次把它搬到 Next.js + Prisma + Redis + S3 上，记录迁移中的判断与代价。
date: 2025-03-08
category: Technology
tags: [Next.js, 架构, React]
cover: /images/covers/architecture.svg
featured: true
---

## 起因

很喜欢 [Mizuki](https://astro.build/themes/details/mizuki/) 的视觉：粉蓝渐变的樱花背景、悬浮的胶囊导航、半透明的卡片。但 Astro 的静态内容集合对「后台写作 + 动态互动」不太友好——加一个文章编辑器、一个阅读量、一次图片上传，都得绕回服务端。

于是决定用 Next.js 重做一遍，同时把数据层换成 PostgreSQL。

## 架构一览

```
src/
├── app/                 # App Router：页面、API、RSS、sitemap
│   ├── (blog)/          # 站点的公共页面
│   ├── admin/           # 后台：文章、媒体、设置
│   └── api/             # 登录、搜索、阅读量、预签名
├── components/          # 展示组件（服务端优先，交互处才 "use client"）
├── lib/
│   ├── data/            # 数据访问层：Prisma 实现 + 演示实现
│   ├── markdown.ts      # unified 渲染管线
│   ├── cache.ts         # Redis 缓存封装（带内存兜底）
│   ├── s3.ts            # 对象存储
│   └── auth.ts          # JWT 会话
└── content/posts/       # Markdown 源文件（可导入数据库）
```

## 三个关键取舍

### 1. 内容到底放数据库还是放仓库

纯静态方案把 Markdown 放在仓库里，改一篇文字要重新构建；纯数据库方案则丢了版本控制。

最后的做法是：**Markdown 文件是内容的「源」，数据库是内容的「索引」**。种子脚本把文件写进 `posts` 表，日常写作走 `/admin` 直接入库。文件用于初始化与迁移，数据库用于运行时查询。

### 2. 渲染策略

博客的内容更新频率很低，按理说应该全量 SSG。但只要接上数据库，构建期就必须能连上 PostgreSQL，CI 里多一个依赖就多一种失败方式。

所以动态页面统一 `force-dynamic`，把性能交给缓存层：

```ts
export const cached = async <T>(key: string, loader: () => Promise<T>, ttl = 60) => {
  const hit = await cache.get(key);
  if (hit) return JSON.parse(hit) as T;
  const value = await loader();
  await cache.set(key, JSON.stringify(value), ttl);
  return value;
};
```

一篇文章的渲染成本集中在 Markdown 解析上，缓存命中后只剩一次 HTML 拼接。

### 3. 交互组件要足够小

导航栏、搜索框、主题切换、阅读进度条是仅有的客户端组件。其余全部是 React Server Components——列表、卡片、文章正文都不需要打包进浏览器。

## 迁移里最麻烦的部分

不是数据，是**视觉还原**。原主题用了大量玻璃拟态、斜切、光斑，这些在 Tailwind 里需要靠 `backdrop-blur`、`clip-path`、多层 `radial-gradient` 一点点拼。

比如卡片右侧那个斜切的浅绿色按钮：

```css
.slash-panel {
  clip-path: polygon(18% 0, 100% 0, 100% 100%, 0 100%);
  background: linear-gradient(180deg, #e9f8f1, #d7f2e6);
}
```

## 结果

现在这个站点有：文章、归档、分类、标签、搜索、朋友圈、追番、关于、后台编辑器、RSS、sitemap，以及一层可选的 Redis 缓存与 S3 图床。

代价是它不再是「零依赖静态站」——但换来了可以真正写东西的后台。
