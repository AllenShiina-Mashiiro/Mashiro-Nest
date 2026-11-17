---
title: Prisma + PostgreSQL：博客数据建模
description: 从文章、分类、标签到友人帐与追番，聊聊这套博客的数据表怎么划分，以及哪些地方容易踩坑。
date: 2025-02-22
category: Technology
tags: [Prisma, PostgreSQL, 数据库]
cover: /images/covers/database.svg
---

## 表结构总览

一套博客系统，真正需要独立建表的实体并不多：

- `users`：作者与登录
- `posts`：文章主体
- `categories` / `tags` / `post_tags`：分类与多对多标签
- `moments`：碎碎念（朋友圈）
- `friends`：友人帐
- `anime`：追番列表
- `pages`：关于页这类固定页面

## 文章表

```prisma
model Post {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  description String    @default("")
  content     String    @db.Text
  coverUrl    String?
  published   Boolean   @default(false)
  featured    Boolean   @default(false)
  pinned      Boolean   @default(false)
  publishedAt DateTime?
  wordCount   Int       @default(0)
  readingTime Int       @default(0)
  views       Int       @default(0)

  authorId   String
  categoryId String?

  tags PostTag[]

  @@index([published, publishedAt])
}
```

几个刻意的设计：

1. **`content` 存原文，不存 HTML。** 渲染管线以后可能会换，原文必须无损。
2. **`wordCount` / `readingTime` 落库。** 列表页要展示，每次实时统计既慢又没必要，写入时算好即可。
3. **`@@index([published, publishedAt])`。** 首页查询永远是「已发布的、按时间倒序」，这个复合索引直接覆盖。

## 标签用显式连接表

Prisma 的隐式多对多很方便，但拿不到额外字段，也没法在连接表上建索引。博客后期常常要给标签加「排序」「是否在导航显示」，所以一开始就用显式表：

```prisma
model PostTag {
  postId String
  tagId  String
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@index([tagId])
}
```

## 软删除还是硬删除

文章误删是灾难，但 `deletedAt` 会让每个查询都多一个条件。

这里的折中：**草稿即「软删除」**。`published = false` 的文章不会出现在任何前台页面，后台仍然可见、可恢复。真正删除只发生在后台的显式操作，并且 `onDelete: Cascade` 保证关联表干净。

## 迁移流程

```bash
# 开发环境：直接同步 schema
npm run db:push

# 生产环境：生成可回放的迁移文件
npx prisma migrate deploy
```

`db:push` 适合个人项目快速迭代，团队协作还是老老实实 `migrate`。

## 一个常见坑

`DateTime` 在 PostgreSQL 里默认是 `timestamp(3) without time zone`，Prisma 会按 UTC 写入。前台格式化时忘了带时区，就会出现「晚上八点发的文章显示成中午」：

```ts
new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeZone: "Asia/Shanghai",
}).format(post.publishedAt);
```

时区这件事，越早统一越好。
