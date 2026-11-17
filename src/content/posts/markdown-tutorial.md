---
title: Markdown Tutorial
description: A simple example of a Markdown blog post.
date: 2025-01-20
category: Examples
tags: [Markdown, Blogging]
cover: /images/covers/markdown.svg
featured: true
pinned: true
---

## 标题

这里演示的是 Mizuki 默认的 Markdown 渲染能力：标题、列表、引用、代码、表格、图片，以及自动生成的目录。

### 三级标题

正文支持 **加粗**、*斜体*、~~删除线~~、`行内代码` 与 [链接](https://nextjs.org)。

### 无序列表

- 基于 Next.js App Router 的服务端渲染
- Tailwind CSS v4 负责设计令牌与主题
- Prisma + PostgreSQL 负责持久化
- Redis 负责缓存与阅读量累加

### 有序列表

1. 在 `prisma/schema.prisma` 中定义数据模型
2. 执行 `npm run db:push` 同步表结构
3. 执行 `npm run db:seed` 写入示例内容
4. 在 `/admin` 中开始写作

## 引用

> 好的博客系统，应该让写作比搭建更轻松。
>
> —— 某个深夜还在调 CSS 的人

## 代码块

```ts
// src/lib/cache.ts
export async function cached<T>(key: string, ttl: number, loader: () => Promise<T>) {
  const hit = await cache.get(key);
  if (hit) return JSON.parse(hit) as T;

  const value = await loader();
  await cache.set(key, JSON.stringify(value), ttl);
  return value;
}
```

```bash
npm run db:push
npm run db:seed
npm run dev
```

## 表格

| 能力 | 实现 | 位置 |
| --- | --- | --- |
| 文章渲染 | unified + rehype | `src/lib/markdown.ts` |
| 缓存 | ioredis | `src/lib/cache.ts` |
| 图床 | S3 预签名上传 | `src/lib/s3.ts` |
| 鉴权 | jose + bcrypt | `src/lib/auth.ts` |

## 图片

![樱花与天空](/images/covers/sakura.svg)

## 结语

以上内容全部由同一个 Markdown 文件渲染而来，目录、阅读时长与字数统计都是自动计算的。
