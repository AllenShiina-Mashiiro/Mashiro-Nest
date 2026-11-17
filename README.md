# 真白屋 · Mashiro Nest

Mashiro Nest 是一个基于 Next.js App Router 的多用户博客项目，包含文章、朋友圈、用户主页、关注关系、通知、媒体库与站点管理后台。

> 当前维护分支：`Beta`。部署前请确认你拉取的是预期分支，不要把测试分支误认为默认分支。

## 目录

- [功能概览](#功能概览)
- [技术栈与运行要求](#技术栈与运行要求)
- [本地开发部署](#本地开发部署)
- [本地 PostgreSQL 开发](#本地-postgresql-开发)
- [Docker 部署](#docker-部署)
- [线上部署](#线上部署)
- [环境变量](#环境变量)
- [数据库初始化与升级](#数据库初始化与升级)
- [备份与恢复](#备份与恢复)
- [常用命令](#常用命令)
- [朋友圈评论权限](#朋友圈评论权限)
- [故障排查](#故障排查)

## 功能概览

- **文章系统**：Markdown 内容、分类、标签、归档、搜索、RSS、sitemap。
- **用户系统**：注册、登录、个人资料、公开主页、关注与粉丝。
- **朋友圈**：发布、编辑和删除自己的动态；动态支持图片、地点与点赞。
- **评论互动**：登录用户可以发表评论和点赞；评论作者可以编辑、撤回自己的评论；站长可以删除任何评论，但不能编辑他人的评论。
- **通知**：动态点赞、动态评论、评论点赞和关注通知；支持未读数、全部已读与 SSE 实时推送。
- **管理后台**：文章、用户、友人帐、追番、媒体库与站点设置。
- **文件存储**：本地磁盘或 S3 兼容对象存储。
- **数据存储**：本地 JSON 模式或 PostgreSQL + Prisma。

## 技术栈与运行要求

| 类别 | 技术 |
| --- | --- |
| Web | Next.js 15、React 19、TypeScript |
| 样式 | Tailwind CSS v4 |
| 数据库 | PostgreSQL、Prisma 6 |
| 会话 | jose JWT、bcryptjs、HttpOnly Cookie |
| 缓存 | Redis（可选） |
| 文件 | 本地磁盘或 S3 兼容对象存储 |

- Node.js 20.x 或更新的受支持 LTS 版本
- npm（使用仓库中的 `package-lock.json`）
- Docker Engine + Docker Compose（仅 Docker 部署需要）
- PostgreSQL 16+（数据库模式需要）

## 本地开发部署

### 1. 获取项目

```bash
git clone -b Beta https://github.com/AllenShiina-Mashiiro/Mashiro-Nest.git
cd Mashiro-Nest
```

### 2. 安装依赖并创建环境文件

macOS / Linux：

```bash
cp .env.example .env
npm ci
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
npm ci
```

首次使用时可以先不配置数据库。默认情况下，项目会使用本地 JSON 数据存储，运行数据写入项目根目录的 `.data/store.json`。开发环境的内置演示管理员凭据为：

- 邮箱：`admin@mizuki.dev`
- 密码：`mizuki`

这组凭据只用于本地开发和演示。**不要将演示凭据用于公网部署**。如果在 `.env` 中填写了 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD`，则会优先使用你自己的管理员凭据。

### 3. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000。

### 4. 本地生产模式验证

```bash
npm run typecheck
npm run build
npm run start
```

`npm run start` 启动的是生产构建；每次修改代码后，需要重新执行 `npm run build`。

### JSON 模式注意事项

- 未设置 `DATABASE_URL` 时使用 JSON 文件存储。
- 数据文件位于 `.data/store.json`，请勿删除；备份时需要一起备份。
- JSON 模式适合本地开发、演示和单进程运行，不适合多实例、Serverless 或多个容器同时写入。
- 部署到线上时，建议使用 PostgreSQL；不要依赖容器临时文件系统保存正式用户数据。

## 本地 PostgreSQL 开发

你可以使用自己安装的 PostgreSQL，也可以通过 Docker Compose 启动数据库和 Redis：

```bash
docker compose up -d db redis
```

在本机运行 Next.js 时，在 `.env` 中配置主机侧连接地址（将密码替换为你设置的值）：

```dotenv
DATABASE_URL="postgresql://mashiro:YOUR_PASSWORD@127.0.0.1:5432/mashiro?schema=public"
REDIS_URL="redis://127.0.0.1:6379"
```

然后执行：

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Windows 用户也可以使用仓库内的 `scripts/dev-db.ps1` 管理本机 PostgreSQL（需要先安装 PostgreSQL，并按脚本说明设置 `PG_BIN`）：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev-db.ps1 start
powershell -ExecutionPolicy Bypass -File scripts/dev-db.ps1 status
powershell -ExecutionPolicy Bypass -File scripts/dev-db.ps1 stop
```

该脚本使用本机回环地址和独立端口，不会主动操作系统中其他 PostgreSQL 服务。

## Docker 部署

仓库提供多阶段 Dockerfile 和 Docker Compose，默认启动：

- Next.js 应用
- PostgreSQL 16
- Redis 7

PostgreSQL 与 Redis 的宿主机端口只绑定到 `127.0.0.1`，避免直接暴露到公网。应用容器以非 root 用户运行，并使用 Docker 命名卷保存上传文件和运行数据。

### 1. 配置密钥

```bash
cp .env.example .env
```

编辑 `.env`，至少设置以下项目：

```dotenv
NEXT_PUBLIC_SITE_URL=https://你的域名
AUTH_SECRET=替换为随机生成的至少32位密钥
ADMIN_EMAIL=你的管理员邮箱
ADMIN_USERNAME=你的管理员用户名
ADMIN_PASSWORD=长度至少12位的强密码
POSTGRES_PASSWORD=独立且足够长的数据库密码
```

生成随机密钥示例：

```bash
openssl rand -base64 48
```

请为 `AUTH_SECRET`、`ADMIN_PASSWORD` 和 `POSTGRES_PASSWORD` 使用不同的值。不要把真实的 `.env` 提交到 Git。

### 2. 构建并启动服务

```bash
docker compose up -d --build
```

### 3. 初始化数据库

```bash
docker compose exec app npm run db:push
docker compose exec app npm run db:seed
```

初始化完成后访问 http://服务器地址:3000。正式环境应在应用前配置 Caddy、Nginx 或 Traefik 等反向代理，并启用 HTTPS；不要直接把应用端口当作完整的公网安全边界。

### 4. 常用 Docker 命令

```bash
docker compose ps
docker compose logs -f app
docker compose logs -f db
docker compose restart app
docker compose down
```

`docker compose down` 不会删除命名卷。**不要随意执行 `docker compose down -v`**，该命令会删除数据库、Redis 和上传文件卷。

### 5. 更新版本

先备份数据库与上传文件，再拉取目标分支并重建：

```bash
git pull origin Beta
docker compose up -d --build
docker compose exec app npm run db:push
```

如果本次版本包含新的数据库模型，必须先完成数据库结构同步，再验证应用。更新前务必查看本次提交说明，并确认数据库备份可用。

## 线上部署

### 方案 A：自有服务器 / VPS（推荐）

适合希望长期运行、保留完整控制权的部署方式：

1. 准备 Linux VPS、域名和 HTTPS 证书。
2. 安装 Docker Engine 与 Docker Compose。
3. 拉取 `Beta` 分支，配置生产环境 `.env`。
4. 使用 Docker Compose 启动应用、PostgreSQL 和 Redis。
5. 执行 `db:push` 与首次 `db:seed`。
6. 使用 Caddy / Nginx / Traefik 将 HTTPS 流量反向代理到应用的 3000 端口。
7. 为 PostgreSQL 和上传文件配置定期备份，并监控磁盘空间。

生产环境建议将 PostgreSQL 放在私有网络中，不要开放数据库公网端口；数据库密码、JWT 密钥和对象存储密钥应使用部署平台的 Secret 管理功能。

### 方案 B：Vercel 等 Serverless 托管平台

Next.js 页面可以部署到 Vercel 等平台，但本项目的默认 JSON 文件存储和本地上传目录不适合 Serverless 环境。使用此方案时，**必须配置外部持久化服务**：

- `DATABASE_URL`：使用托管 PostgreSQL。
- `S3_BUCKET`、`S3_REGION`、`S3_ACCESS_KEY_ID`、`S3_SECRET_ACCESS_KEY`：配置 S3 兼容对象存储；若服务商要求自定义端点，再配置 `S3_ENDPOINT`。
- `S3_PUBLIC_URL`：配置浏览器可访问的媒体公开地址。
- `AUTH_SECRET`、`ADMIN_EMAIL`、`ADMIN_PASSWORD`：在平台环境变量 / Secrets 中配置生产值。
- `NEXT_PUBLIC_SITE_URL`：设置为正式 HTTPS 域名。
- `REDIS_URL`：可选，建议多实例部署配置共享 Redis。

平台构建设置通常使用：

| 项目 | 值 |
| --- | --- |
| Framework | Next.js |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | 使用平台自动识别的 Next.js 默认设置 |

首次上线或模型更新时，在发布前对托管 PostgreSQL 执行：

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

这些数据库命令应在受控的本地环境或 CI 发布步骤执行，不要把数据库结构更新放进每个 Serverless 请求。若没有配置持久化 PostgreSQL 与对象存储，不要使用 Serverless 方案承载真实用户数据和上传文件。

### 生产架构建议

| 组件 | 本地开发 | 线上建议 |
| --- | --- | --- |
| Next.js | 本机 Node.js | Docker / Node.js 托管 |
| 数据库 | JSON 或本地 PostgreSQL | 托管 PostgreSQL / 私有 PostgreSQL |
| 缓存 | 内存或本地 Redis | 共享 Redis（多实例时） |
| 图片与媒体 | 本地目录 | S3 / R2 / 其他 S3 兼容存储 |
| HTTPS | localhost | Caddy / Nginx / 平台 TLS |

## 环境变量

| 变量 | 必需性 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 生产必填 | 站点正式 URL，必须使用 HTTPS 域名 |
| `AUTH_SECRET` | 生产必填 | JWT 签名密钥，至少 32 个字符 |
| `ADMIN_EMAIL` | 首次初始化必填 | 管理员邮箱 |
| `ADMIN_PASSWORD` | 首次初始化必填 | 管理员密码，生产环境至少 12 个字符 |
| `ADMIN_USERNAME` | 建议设置 | 管理员用户名 |
| `ADMIN_NAME` | 可选 | 管理员显示名称 |
| `DATABASE_URL` | 数据库模式必填 | PostgreSQL 连接字符串；不设置时使用 JSON 模式 |
| `REDIS_URL` | 可选 | Redis 连接字符串；不设置时使用进程内缓存 |
| `CACHE_TTL` | 可选 | 缓存秒数，默认 30 |
| `CACHE_PREFIX` | 可选 | Redis Key 前缀 |
| `CACHE_DISABLED` | 可选 | 设置为 `1` 时关闭缓存 |
| `STORAGE_DRIVER` | 可选 | `local` 或 `s3` |
| `S3_BUCKET` | 使用 S3 时必填 | 对象存储桶名 |
| `S3_REGION` | 使用 S3 时建议 | 存储区域；兼容服务可能使用 `auto` |
| `S3_ACCESS_KEY_ID` | 使用 S3 时必填 | 对象存储访问密钥 ID |
| `S3_SECRET_ACCESS_KEY` | 使用 S3 时必填 | 对象存储访问密钥 |
| `S3_ENDPOINT` | 按服务商要求 | S3 兼容服务端点 |
| `S3_PUBLIC_URL` | 使用自定义 CDN 时建议 | 浏览器可访问的媒体 URL 前缀 |
| `S3_FORCE_PATH_STYLE` | 按服务商要求 | 是否启用 Path-Style 寻址 |
| `BLOG_DEMO` | 可选 | 设置为 `1` 强制使用演示 JSON 模式 |
| `DISABLE_IP_LOCATION` | 可选 | 设置为 `1` 关闭访客 IP 归属地查询 |

## 数据库初始化与升级

项目使用 Prisma Schema 管理 PostgreSQL 数据结构。当前仓库提供 `db:push`，没有提供可直接用于 `prisma migrate deploy` 的迁移历史。

首次初始化：

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

升级已有数据库：

1. 先备份数据库。
2. 拉取并检查新版本代码及 `prisma/schema.prisma` 变更。
3. 安装依赖并生成 Prisma Client：`npm ci`、`npm run db:generate`。
4. 执行 `npm run db:push` 同步结构。
5. 执行 `npm run typecheck` 与 `npm run build`。
6. 重启应用并验证登录、文章、朋友圈、评论、通知和媒体上传。

本版本包含 `MomentCommentLike` 评论点赞模型。升级旧数据库时必须执行 `npm run db:push`，否则评论点赞查询会因缺少数据表而失败。生产数据库结构变更前必须备份，并审查 Prisma 的数据变更提示。

## 备份与恢复

### PostgreSQL

备份：

```bash
docker compose exec -T db pg_dump -U mashiro -d mashiro -Fc > mashiro-$(date +%F).dump
```

恢复（会覆盖目标数据库内容，操作前先确认目标库）：

```bash
cat mashiro-backup.dump | docker compose exec -T db pg_restore -U mashiro -d mashiro --clean --if-exists
```

如果修改了 `POSTGRES_USER` 或 `POSTGRES_DB`，请同步调整命令中的用户名和数据库名。

### 上传文件

Docker 部署的本地上传文件保存在 `mashiro_uploads` 命名卷中。请使用卷备份或迁移工具定期备份；如果使用 S3 / R2，则应在对象存储服务商侧配置版本控制、生命周期和备份策略。

### JSON 模式

本地 JSON 模式的数据文件是 `.data/store.json`。停止应用后复制该文件进行备份。不要在应用正在写入时直接移动或覆盖数据文件。

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

## 朋友圈评论权限

| 操作 | 评论作者 | 其他普通用户 | 站长 |
| --- | --- | --- | --- |
| 点赞 / 取消点赞 | 可以 | 可以 | 可以 |
| 编辑评论 | 仅自己的评论 | 不可以 | 仅自己的评论 |
| 删除 / 撤回评论 | 仅自己的评论 | 不可以 | 可以删除任何评论 |

评论点赞通知发送给被点赞评论的作者；评论通知发送给动态发布者。取消点赞会撤回对应点赞通知；评论删除时会清理该评论关联的点赞和通知，并同步更新未读数量。站长拥有删除权限，但不拥有代替他人修改评论内容的权限。

## 故障排查

### 页面可以打开，但数据库数据没有出现

检查 `DATABASE_URL` 是否正确、数据库是否可连接，以及是否执行了：

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

当 PostgreSQL 不可用时，应用可能回退到本地 JSON 模式。查看服务端日志中的 `[mashiro] PostgreSQL 连接失败` 提示，确认不是误把线上环境运行在 JSON 模式。

### 评论点赞接口报数据库表不存在

升级代码后执行 `npm run db:push`，确认 `moment_comment_likes` 表已经创建。

### 线上图片上传后丢失或无法访问

Serverless 文件系统通常不持久化。检查是否配置 S3 兼容存储、对象桶权限和 `S3_PUBLIC_URL`。自托管 Docker 则确认 `mashiro_uploads` 卷已挂载。

### 登录后立即退出

确认所有应用实例使用同一个 `AUTH_SECRET`，且 `NEXT_PUBLIC_SITE_URL` 与实际访问协议一致。HTTPS 站点必须配置正确的正式 URL。

### Docker 应用无法连接数据库

Compose 内部连接地址使用服务名 `db`，不要把容器内的数据库地址写成 `127.0.0.1`。检查：

```bash
docker compose ps
docker compose logs db
docker compose logs app
```

---

**提示：** 请优先使用 `Beta` 分支部署和验证。生产环境请使用 PostgreSQL、强密钥、HTTPS、持久化媒体存储和定期备份；本地演示配置不应直接暴露到公网。
