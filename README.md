# 真白屋 · Mashiro Nest

Mashiro Nest 是一个基于 Next.js App Router 的多用户博客项目，包含文章、朋友圈、用户主页、关注关系、通知、媒体库与站点管理后台。

> 当前维护分支：`Beta`。

## 技术栈

- Next.js 15、React 19、TypeScript、Tailwind CSS v4
- PostgreSQL 16+、Prisma 6
- Redis（可选）
- 本地磁盘或 S3 兼容对象存储
- Node.js 22.x LTS、npm

**数据库只有 PostgreSQL 一种。** 本项目不提供 JSON 文件数据库，不会在 PostgreSQL 连接失败时回退到本地文件。数据库未配置或无法连接时，相关请求会明确报错，避免误把数据写进另一套存储。

## 本地开发（PostgreSQL + psql）

### 1. 克隆 Beta 并安装依赖

```powershell
git clone -b Beta https://github.com/AllenShiina-Mashiiro/Mashiro-Nest.git
cd Mashiro-Nest
Copy-Item .env.example .env
npm ci
```

### 2. 启动本地 PostgreSQL

推荐直接用仓库提供的 Docker Compose 启动 PostgreSQL 和 Redis：

```powershell
docker compose up -d db redis
```

编辑 `.env`，将 `POSTGRES_PASSWORD` 换成你自己的长随机密码，并把 `DATABASE_URL` 中的密码改成同一个值。默认本机连接地址：

```dotenv
DATABASE_URL=postgresql://mashiro:你的数据库密码@127.0.0.1:5432/mashiro?schema=public
POSTGRES_USER=mashiro
POSTGRES_PASSWORD=你的数据库密码
POSTGRES_DB=mashiro
ADMIN_EMAIL=admin@mashiro.dev
ADMIN_USERNAME=admin
ADMIN_PASSWORD=你自己设置的至少12位强密码
AUTH_SECRET=你自己生成的至少32字符随机密钥
```

如果你已经在 Windows 安装了 PostgreSQL，也可以直接使用本机 PostgreSQL 服务，只要 `DATABASE_URL` 指向正确的主机、端口、数据库和账号即可。

### 3. 初始化数据库和管理员

```powershell
npm run db:generate
npm run db:push
npm run db:admin
```

- `db:push`：根据 Prisma Schema 创建/更新 PostgreSQL 表结构。
- `db:admin`：使用 `.env` 中的管理员配置，创建首个管理员账号。
- `db:seed`：可选，导入仓库内的示例文章、动态、友链、追番和关于页面内容；不负责创建管理员。

管理员默认邮箱是 `admin@mashiro.dev`，但密码必须由你在 `.env` 中自行设置。登录后台时使用该邮箱和你设置的密码。不要使用仓库内的示例密码，也不要把 `.env` 提交到 Git。

### 4. 使用 psql 查看数据库

如果你本机安装了 `psql`：

```powershell
psql "postgresql://mashiro:你的数据库密码@127.0.0.1:5432/mashiro"
```

如果 PostgreSQL 由 Docker Compose 启动：

```powershell
docker compose exec db psql -U mashiro -d mashiro
```

进入 `psql` 后常用命令：

```sql
\dt                 -- 查看所有表
\d users            -- 查看 users 表结构
SELECT email, role FROM users;
\q                  -- 退出
```

### 5. 启动项目

```powershell
npm run dev
```

打开 http://localhost:3000。另一个终端可运行 `npm run typecheck` 和 `npm run build` 做验证。

## 管理员账号是怎么创建的？

管理员不是靠“第一个注册的人”自动获得的，也不会因为公开注册而成为管理员。公开注册接口只会创建 `USER` 角色。

首个管理员由部署者在服务器端执行一次 `npm run db:admin` 创建：

1. 设置 `ADMIN_EMAIL`（默认 `admin@mashiro.dev`）、`ADMIN_USERNAME`、`ADMIN_NAME` 和 `ADMIN_PASSWORD`。
2. 确保 `DATABASE_URL` 指向正确的 PostgreSQL 数据库。
3. 先执行 `npm run db:generate` 和 `npm run db:push`。
4. 执行 `npm run db:admin`，脚本会在数据库中创建 `ADMIN` 用户。
5. 打开网站后台登录页，使用 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 登录。

`db:admin` 是显式的服务器端初始化命令，不会在每次用户登录时自动创建管理员。如果同邮箱已经是普通用户，脚本会停止并要求人工检查，不会擅自提权；如果管理员已经存在，脚本不会重置其密码。

## Docker 部署（VPS / 自有服务器）

### 1. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，至少配置：

```dotenv
NEXT_PUBLIC_SITE_URL=https://你的正式域名
AUTH_SECRET=至少32字符的随机密钥
ADMIN_EMAIL=admin@mashiro.dev
ADMIN_USERNAME=admin
ADMIN_PASSWORD=你自己设置的至少12位强密码
POSTGRES_USER=mashiro
POSTGRES_PASSWORD=独立的长随机数据库密码
POSTGRES_DB=mashiro
```

`AUTH_SECRET`、`ADMIN_PASSWORD` 和 `POSTGRES_PASSWORD` 必须使用不同的值。不要提交 `.env`。正式站点应放在 Caddy、Nginx 或 Traefik 等 HTTPS 反向代理之后。

### 2. 构建并启动

```bash
docker compose up -d --build
```

### 3. 初始化数据库和管理员

```bash
docker compose exec app npm run db:push
docker compose exec app npm run db:admin
```

如果你希望导入仓库自带的示例文章和示例内容，再额外执行：

```bash
docker compose exec app npm run db:seed
```

部署后访问 `https://你的正式域名`，使用 `admin@mashiro.dev` 和你设置的管理员密码登录。后续更新版本时先备份数据库与上传文件，再拉取 Beta、重新构建并按需执行 `db:push`。

常用维护命令：

```bash
docker compose ps
docker compose logs -f app
docker compose logs -f db
docker compose restart app
docker compose down
```

`docker compose down` 不会删除命名卷。不要随意执行 `docker compose down -v`，它会删除数据库、Redis 和上传文件卷。

## 线上部署（Vercel / 其他托管平台）

线上应用和本地开发使用同一套 PostgreSQL 数据库接口。你需要准备托管 PostgreSQL（例如 Neon、Supabase、RDS 或自建 PostgreSQL），并在部署平台设置环境变量：

- `DATABASE_URL`：托管 PostgreSQL 连接字符串。
- `NEXT_PUBLIC_SITE_URL`：正式 HTTPS 域名。
- `AUTH_SECRET`：至少 32 字符的随机密钥。
- `ADMIN_EMAIL`：管理员邮箱，默认建议 `admin@mashiro.dev`。
- `ADMIN_USERNAME`、`ADMIN_NAME`：管理员用户名和显示名称。
- `ADMIN_PASSWORD`：至少 12 位的强密码。
- `STORAGE_DRIVER=s3` 及对应 `S3_*`：使用 Vercel 等无持久磁盘平台时，必须配置 S3/R2 等对象存储来保存上传文件。
- `REDIS_URL`：可选；多实例部署建议使用共享 Redis。

平台构建命令使用 `npm ci` 和 `npm run build`。首次上线前，必须从受信任的本地终端或一次性 CI 发布步骤，对**生产数据库**执行初始化。不要把数据库初始化放到每个 Web 请求中：

```bash
npm ci
npm run db:generate
npm run db:push
npm run db:admin
```

运行这些命令的终端必须设置生产环境的 `DATABASE_URL`、`ADMIN_EMAIL` 和 `ADMIN_PASSWORD`。例如 Windows PowerShell 可在当前终端临时设置：

```powershell
$env:DATABASE_URL = "你的生产 PostgreSQL 连接字符串"
$env:ADMIN_EMAIL = "admin@mashiro.dev"
$env:ADMIN_PASSWORD = "你设置的强密码"
npm run db:admin
```

更稳妥的方式是将上述步骤放进受保护的 CI/CD 发布任务，并通过平台 Secrets 注入生产变量。初始化成功后，网站就能用该邮箱和密码登录后台。普通访客注册始终只会获得普通用户权限。

托管数据库若提供连接池，应用运行时使用服务商推荐的连接字符串；执行 Prisma schema 更新、`db:admin` 等管理命令时，按服务商要求使用可执行 DDL/管理操作的直连地址。Prisma 官方也区分了应用连接与迁移/管理工具连接。<https://www.prisma.io/docs/postgres/database/connecting-to-your-database>

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | 必填，PostgreSQL 连接字符串；没有 JSON 或文件数据库模式。 |
| `NEXT_PUBLIC_SITE_URL` | 正式站点 URL；生产环境必须使用 HTTPS。 |
| `AUTH_SECRET` | JWT 签名密钥，至少 32 字符。 |
| `ADMIN_EMAIL` | 首个管理员邮箱，默认 `admin@mashiro.dev`。 |
| `ADMIN_PASSWORD` | 创建管理员时必填，至少 12 位。 |
| `ADMIN_USERNAME` | 管理员用户名，默认 `admin`。 |
| `ADMIN_NAME` | 管理员显示名称，默认 `Site Admin`。 |
| `REDIS_URL` | 可选，Redis 连接字符串。 |
| `STORAGE_DRIVER` | `local` 或 `s3`；Serverless 请使用 S3 兼容存储。 |
| `S3_BUCKET` / `S3_REGION` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | S3 兼容对象存储配置。 |
| `S3_ENDPOINT` / `S3_PUBLIC_URL` / `S3_FORCE_PATH_STYLE` | 按对象存储服务商要求配置。 |

## 数据库更新、备份与恢复

本项目当前使用 Prisma Schema 与 `db:push` 管理表结构，尚未建立 Prisma Migrate 迁移历史。更新数据库前先备份，再检查 `prisma/schema.prisma` 的变更并执行 `npm run db:push`。

备份 Docker PostgreSQL：

```bash
docker compose exec -T db pg_dump -U mashiro -d mashiro -Fc > mashiro-backup.dump
```

恢复前确认目标数据库并先做好现有数据备份：

```bash
cat mashiro-backup.dump | docker compose exec -T db pg_restore -U mashiro -d mashiro --clean --if-exists
```

本地上传文件保存在 `public/uploads`（Docker 中为 `mashiro_uploads` 命名卷）。线上多实例或 Serverless 部署应使用 S3/R2 等持久化对象存储。

## 常用命令

```bash
npm run dev          # 本地开发
npm run typecheck    # TypeScript 检查
npm run build        # 生产构建
npm run start        # 启动生产服务
npm run db:generate  # 生成 Prisma Client
npm run db:push      # 同步 PostgreSQL 表结构
npm run db:admin     # 创建首个管理员账号（一次性）
npm run db:seed      # 可选：导入示例文章与内容
npm run db:studio    # 打开 Prisma Studio
```

## 安全提醒

- 不要把 `.env`、数据库密码、管理员密码或 `AUTH_SECRET` 提交到 Git。
- 不要公开暴露 PostgreSQL 的 5432 端口；VPS 上应放在私有网络。
- 生产环境启用 HTTPS，并定期备份 PostgreSQL 和上传文件。
- 不要将“首位公开注册用户”设为管理员；本项目管理员必须通过服务器端 `db:admin` 显式创建。

## 关于项目来源

项目中的技术文章如涉及第三方主题、框架或教程来源，会保留相应原始名称与出处说明；站点自身的产品名称和默认账号标识统一使用 Mashiro。
