---
title: 给博客加一层 Redis 缓存
description: 不是所有博客都需要 Redis，但当你开始统计阅读量、做搜索、发 RSS 的时候，一层薄缓存能省下很多数据库往返。
date: 2025-02-10
category: Technology
tags: [Redis, 性能, 缓存]
cover: /images/covers/redis.svg
---

## 先问一句：真的需要吗

静态站不需要。数据库压力在 100 QPS 以下的博客也不需要。

但下面三件事让缓存变得划算：

1. **首页聚合**：文章列表 + 标签云 + 统计数字，一次渲染要查六七张表。
2. **阅读量**：每次访问都要 `UPDATE ... SET views = views + 1`，是写放大最严重的地方。
3. **搜索**：`ILIKE '%keyword%'` 在几万篇文章上是全表扫描。

## 封装一层「有兜底」的缓存

本地开发不一定有 Redis，生产环境也不希望缓存挂了整站 500。所以封装成：**有 Redis 用 Redis，没有就用进程内 Map**。

```ts
// src/lib/cache.ts
const memory = new Map<string, { value: string; expiresAt: number }>();

export async function cacheGet(key: string) {
  if (redis) return redis.get(key);
  const hit = memory.get(key);
  if (!hit || hit.expiresAt < Date.now()) return null;
  return hit.value;
}

export async function cached<T>(key: string, loader: () => Promise<T>, ttl = 60) {
  const hit = await cacheGet(key);
  if (hit) return JSON.parse(hit) as T;

  const value = await loader();
  await cacheSet(key, JSON.stringify(value), ttl);
  return value;
}
```

`Map` 兜底在 Serverless 环境里不可靠（实例随时回收），但在单机自托管上足够用，而且能让新克隆的项目**不配任何东西就能跑起来**。

## 阅读量：计数器放 Redis，定期回写

直接对数据库自增，热点文章会把行锁打满。做法是两层：

```ts
// 增加：只写 Redis
export async function bumpViews(slug: string) {
  if (redis) return redis.incr(`${PREFIX}:views:${slug}`);
  memoryViews.set(slug, (memoryViews.get(slug) ?? 0) + 1);
}

// 读取：数据库基准值 + Redis 增量
export function totalViews(slug: string, base: number) {
  return base + (memoryViews.get(slug) ?? 0);
}
```

配合一个定时任务，把增量批量写回 `posts.views`，再把 Redis 里的计数清零。这样数据库写入从「每次访问」降到「每分钟一次」。

## 缓存失效

博客的缓存失效其实很简单：**写操作把相关 key 全删掉**，不用做精细的依赖追踪。

```ts
export async function invalidatePost(slug: string) {
  await cacheDel(`post:${slug}`);
  await cacheDel("home:page:1");
  await cacheDel("archive:all");
  await cacheDel("tags:all");
}
```

键的命名统一用 `实体:标识:变体`，清理时用 `SCAN` 匹配前缀，不要用 `KEYS *`。

## 别忘了 TTL

任何缓存都要有 TTL，哪怕是「永久」的数据。网络抖动、进程崩溃、部署回滚，都会让缓存和数据库不一致。给一个 5 分钟到 1 小时的上限，最坏情况下自愈。

## 小结

Redis 在这个项目里不是刚需，是**降级友好**的加速层：没有它站点照常运行，有它首页从 40ms 降到 3ms。
