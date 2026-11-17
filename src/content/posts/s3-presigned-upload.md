---
title: S3 图床与预签名上传
description: 不让图片流经应用服务器：用预签名 URL 把上传直接打到对象存储，顺便解决文件名、防盗链与 CDN 缓存。
date: 2025-01-28
category: Technology
tags: [S3, 存储, 上传]
cover: /images/covers/storage.svg
---

## 为什么不用「上传到服务器再转发」

传统做法是 `multipart/form-data` 打到 Next.js 的 Route Handler，再 `PutObject` 到 S3。问题是：

- 一张 5MB 的图要在应用服务器上完整走一遍内存
- Serverless 平台有请求体大小限制（通常是 4.5MB）
- 应用服务器的带宽成了瓶颈

预签名上传把这条链路变成：**浏览器 → S3**，应用服务器只负责签发一张有时效的「通行证」。

## 服务端：签发 URL

```ts
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function createUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3, command, { expiresIn: 600 });
}
```

`expiresIn` 给 10 分钟：足够用户选图、压缩、上传，又不至于让 URL 被长期滥用。

## 客户端：直传

```ts
const { uploadUrl, publicUrl } = await fetch("/api/upload/presign", {
  method: "POST",
  body: JSON.stringify({ filename: file.name, contentType: file.type }),
}).then((r) => r.json());

await fetch(uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": file.type },
  body: file,
});
```

注意 `PUT` 时的 `Content-Type` 必须和签名时完全一致，否则 S3 会返回 `SignatureDoesNotMatch`。

## 文件名策略

不要用用户上传的原始文件名，三个理由：重名、中文编码、路径穿越。

```ts
const ext = filename.split(".").pop()?.toLowerCase() ?? "bin";
const key = `uploads/${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
```

按年份分目录，方便以后做生命周期策略（比如把三年前的图转到低频存储）。

## 公开读还是签名读

博客图片是公开内容，桶策略直接放开 `s3:GetObject`，前面挂 CDN，`Cache-Control: public, max-age=31536000, immutable`。文件名带 UUID，内容不会变，可以放心长缓存。

需要鉴权的文件（比如后台导出）另开一个私有桶，读的时候同样用预签名 `GetObjectCommand`。

## 成本与备份

- 图片先在前端压到 200KB 以内再上传，比任何后端优化都有效
- 开版本控制，防止误删
- 桶不要和数据库放在同一个账号的唯一凭证下，IAM 里只给 `PutObject` / `GetObject` 权限

## 兜底方案

没配 S3 的时候，开发环境直接写入 `public/uploads`。这样新克隆的项目不依赖云服务也能跑通上传流程，上线前再切到 S3 即可。
