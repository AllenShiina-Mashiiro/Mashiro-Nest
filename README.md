# 真白屋 · Mashiro Nest

Mashiro Nest 是一个基于 Next.js App Router 的多用户个人博客，包含文章、朋友圈、用户主页、关注关系、通知、媒体库与站点管理后台。

## 功能

- 文章：Markdown 内容、分类、标签、归档、搜索、RSS、sitemap。
- 用户：注册、登录、个人资料、公开主页、关注与粉丝。
- 朋友圈：发布、编辑和删除自己的动态；动态支持图片、地点与点赞。
- 评论：登录用户可发表评论和点赞评论；评论作者可以编辑或撤回自己的评论；站长可以删除任何评论，但不能修改他人的评论。
- 通知：动态点赞、动态评论、评论点赞和关注通知；支持未读数、全部已读与 SSE 实时推送。
- 管理后台：文章、用户、友人帐、追番、媒体库与站点设置。
- 存储：默认本地 JSON 数据；配置 PostgreSQL 后使用 Prisma；Redis 与 S3 兼容存储均为可选项。

## 技术栈

| 类别 | 技术 |
| --- | --- |
| Web | Next.js 15、React 19、TypeScript |
| 样式 | Tailwind CSS v4 |
| 数据库 | PostgreSQL、Prisma 6 |
| 会话 | jose JWT、bcryptjs、HttpOnly Cookie |
| 缓存 | Redis（可选，内存降级） |
| 文件 | 本地存储或 S3 兼容对象存储 |

## 环境要求

- Node.js 20 或更新版本
- npm
- 使用数据库模式时需要 PostgreSQL

## 本地运行

```bash
npm install
cp .env.example .env
npm run dev
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

没有设置 `DATABASE_URL` 时，项目使用本地 JSON 数据存储，数据文件位于 `.data/store.json`。开发环境首次启动会初始化演示管理员：

- 邮箱：`admin@mizuki.dev`
- 密码：`mizuki`

请勿在公网或生产环境沿用演示凭据。

## PostgreSQL 部署

在 `.env` 中设置数据库连接和安全密钥：

```dotenv
NEXT_PUBLIC_SITE_URL=https://your-domain.example
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
AUTH_SECRET=replace-with-a-random-secret-at-least-32-characters
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=your-admin-name
ADMIN_NAME=站长
ADMIN_PASSWORD=replace-with-a-strong-unique-password
```

生成 Prisma Client、同步数据模型并初始化数据：

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run build
npm run start
```

本版本新增了评论点赞数据模型 `MomentCommentLike`。升级已有数据库时，必须执行 `npm run db:push`，否则评论点赞相关查询会因缺少数据表而失败。

## 可选配置

| 变量 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 站点公开地址，用于 RSS、sitemap 与 Cookie 安全属性 |
| `DATABASE_URL` | PostgreSQL 连接串；不设置时使用 JSON 模式 |
| `AUTH_SECRET` | JWT 签名密钥；生产环境必填，至少 32 个字符 |
| `ADMIN_EMAIL` | 初始化管理员邮箱；生产环境必填 |
| `ADMIN_USERNAME` | 初始化管理员用户名 |
| `ADMIN_NAME` | 初始化管理员显示名称 |
| `ADMIN_PASSWORD` | 初始化管理员密码；生产环境至少 12 个字符 |
| `REDIS_URL` | Redis 连接串；不设置时使用进程内缓存 |
| `CACHE_TTL` | 缓存有效期，默认 30 秒 |
| `S3_BUCKET`、`S3_REGION`、`S3_ACCESS_KEY_ID`、`S3_SECRET_ACCESS_KEY` | S3 兼容存储配置 |
| `S3_ENDPOINT`、`S3_PUBLIC_URL`、`S3_FORCE_PATH_STYLE` | S3 端点、公网 URL 与寻址方式 |
| `STORAGE_DRIVER` | 指定 `local` 或 `s3` |
| `BLOG_DEMO=1` | 强制使用本地 JSON 模式 |
| `DISABLE_IP_LOCATION=1` | 关闭访客 IP 归属地查询 |

## 常用命令

```bash
npm run dev          # 开发模式
npm run typecheck    # TypeScript 类型检查
npm run build        # 生产构建
npm run start        # 启动生产服务
npm run db:generate  # 生成 Prisma Client
npm run db:push      # 同步 Prisma Schema
npm run db:seed      # 初始化管理员和演示内容
npm run db:studio    # 打开 Prisma Studio
```

## 项目结构

```
src/
├── app/
│   ├── (site)/       # 前台页面
│   ├── admin/        # 管理后台
│   └── api/          # 登录、朋友圈、通知、媒体等 API
├── components/       # 页面组件
├── content/posts/    # Markdown 文章
└── lib/
    ├── data/         # Store 接口、JSON 与 Prisma 实现
    ├── auth.ts       # 会话与权限
    ├── media.ts      # 上传、存储与媒体删除
    └── ...
prisma/
└── schema.prisma     # 数据模型
public/               # 静态资源
docs/                 # 项目截图
```

## 朋友圈评论权限规则

| 操作 | 评论作者 | 其他普通用户 | 站长 |
| --- | --- | --- | --- |
| 点赞 / 取消点赞评论 | 可以 | 可以 | 可以 |
| 编辑评论 | 仅自己的评论 | 不可以 | 仅自己的评论 |
| 撤回 / 删除评论 | 仅自己的评论 | 不可以 | 可以删除任何评论 |

评论点赞通知发送给被点赞评论的作者；评论通知发送给动态发布者。取消点赞会撤回对应的点赞通知；评论被删除时，会清理该评论关联的点赞/评论通知并同步更新未读数量。评论内容更新只允许作者本人，站长权限不包含代改评论。

## 安全提示

- 生产环境必须配置独立且随机的 `AUTH_SECRET`（至少 32 个字符）和至少 12 个字符的管理员密码。
- 不要将真实的 `.env`、数据库密码、对象存储密钥提交到 Git。
- 本地 JSON 存储适合开发与单实例轻量部署；多实例生产部署建议使用 PostgreSQL，并为 Redis 配置共享缓存/事件方案。
- 媒体删除接口仅允许操作 `public/uploads` 下的上传对象。
