# 🌸 真白屋 · Mashiro Nest

<p align="center">
  <strong>一个用于分享、记录与连接的现代化多用户博客系统</strong><br />
  基于 Next.js、React、TypeScript 与 PostgreSQL 构建
</p>

<p align="center">
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" />
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16+-4169E1?logo=postgresql&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma" />
</p>

---

## ✨ 项目简介

**Mashiro Nest（真白屋）** 是一个基于 Next.js App Router 的多用户博客项目，包含文章、动态、用户主页、关注关系、通知、媒体库和站点管理后台。

### 🧩 功能模块

- 📝 文章发布与内容管理
- 💬 日常动态与互动
- 👤 用户主页与个人资料
- 🤝 用户关注关系
- 🔔 站内通知
- 🖼️ 媒体库与图片上传
- 🎵 音乐播放器与 🧸 Live2D 看板娘
- ⚙️ 站点设置及管理后台

## 🛠️ 技术栈

| 分类 | 技术 |
| --- | --- |
| Web 框架 | Next.js 15（App Router） |
| 前端 | React 19、TypeScript、Tailwind CSS v4 |
| 数据库 | PostgreSQL 16+ |
| ORM | Prisma 6 |
| 缓存 | Redis（可选，不影响 PostgreSQL 主存储） |
| 文件存储 | 本地磁盘 / S3 兼容对象存储 |
| 看板娘 | l2d-widget（Live2D Cubism 2 / 3 / 4） |
| 音乐播放 | HTMLAudioElement + React Hooks |
| 运行环境 | Node.js 22.x LTS、npm |

### 🗄️ 数据库原则

Mashiro Nest **只使用 PostgreSQL**，没有 JSON 文件数据库，也不会在 PostgreSQL 连接失败时自动切换到其他存储。数据库不可用时，应用会报告真实故障，而不是把数据写入另一套数据库。

Prisma Client 在同一 Node.js 进程内复用，并为 PostgreSQL 连接池设置保守默认值（可由连接字符串参数覆盖），降低开发热更新或并发请求时重复创建连接池的风险。

## 🚀 本地开发（Windows）

### 1. 准备环境

请安装 Node.js 22.x LTS、Git，以及 PostgreSQL 16+。也可以使用 Docker Desktop 启动 PostgreSQL。

### 2. 克隆仓库并安装依赖

PowerShell：

```powershell
git clone -b Alpha https://github.com/AllenShiina-Mashiiro/Mashiro-Nest.git
cd Mashiro-Nest
Copy-Item .env.example .env
npm ci
```

- `Alpha`：默认稳定主分支。
- `Beta`：后续功能开发与验证分支。

### 3. 启动 PostgreSQL

使用仓库提供的 Docker Compose：

```powershell
docker compose up -d db redis
```

或者使用本机已经安装并启动的 PostgreSQL 服务。

编辑项目根目录的 `.env`，确保数据库连接地址、用户名、密码和数据库名称正确：

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

Prisma 会在未显式指定时为连接池设置默认限制。若数据库服务商有特殊要求，可在 `DATABASE_URL` 查询参数中自行指定 `connection_limit`、`pool_timeout` 和 `connect_timeout`。

### 4. 初始化数据库

```powershell
npm run db:generate
npm run db:push
```

- `db:generate`：生成 Prisma Client。
- `db:push`：将 Prisma Schema 同步到 PostgreSQL。

### 5. 创建管理员账号 🔐

在 `.env` 中设置管理员邮箱和至少 12 位的强密码，然后执行：

```powershell
npm run db:admin
```

默认管理员邮箱为 `admin@mashiro.dev`，密码必须由部署者自行设置。

**权限规则：**
- 普通公开注册只会创建 `USER` 角色。
- 管理员必须由服务器端 `npm run db:admin` 显式创建。
- 若邮箱已属于普通用户，脚本会停止，不会自动提权。
- 已存在的管理员不会被该脚本自动重置密码。

### 6. 启动项目

```powershell
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

### 7. 可选：导入示例内容

```powershell
npm run db:seed
```

此命令只导入示例内容，不创建管理员。

## 🐘 psql 常用操作

本机安装了 PostgreSQL 客户端时：

```powershell
psql "postgresql://mashiro:你的数据库密码@127.0.0.1:5432/mashiro"
```

Docker PostgreSQL：

```powershell
docker compose exec db psql -U mashiro -d mashiro
```

进入 psql 后：

```sql
\\dt
\\d users
SELECT email, role FROM users;
\\q
```

## 🐳 Docker 部署（VPS）

### 1. 配置环境变量

```bash
cp .env.example .env
```

至少配置正式域名、认证密钥、管理员密码和 PostgreSQL 密码：

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

请勿让 `AUTH_SECRET`、`ADMIN_PASSWORD` 和 `POSTGRES_PASSWORD` 使用相同值。生产环境应通过 Caddy、Nginx 或 Traefik 配置 HTTPS。

### 2. 启动数据库

先启动 PostgreSQL 和 Redis。此时暂时不启动 Web 容器：

```bash
docker compose up -d db redis
```

### 3. 初始化数据库与管理员

正式运行镜像采用 Next.js standalone 模式，不包含 Prisma CLI 和 `tsx` 等开发工具。因此仓库提供独立的 `db-tools` 一次性容器，专门执行数据库维护命令：

```bash
# 构建工具镜像并同步数据库结构
docker compose --profile tools run --rm --build db-tools

# 创建管理员
docker compose --profile tools run --rm db-tools npm run db:admin
```

可选导入示例内容：

```bash
docker compose --profile tools run --rm db-tools npm run db:seed
```

### 4. 构建并启动网站

```bash
docker compose up -d --build app
```

### 4. 运维命令

```bash
docker compose ps
docker compose logs -f app
docker compose logs -f db
docker compose restart app
docker compose down
```

⚠️ 不要随意执行 `docker compose down -v`，它会删除数据库、Redis 和上传文件的命名卷。

## ☁️ Vercel / Serverless 部署

准备托管 PostgreSQL（例如 Neon、Supabase、RDS 或自建 PostgreSQL），并在部署平台设置：

| 环境变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接字符串 |
| `NEXT_PUBLIC_SITE_URL` | 正式 HTTPS 域名 |
| `AUTH_SECRET` | 至少 32 字符的随机密钥 |
| `ADMIN_EMAIL` | 首个管理员邮箱 |
| `ADMIN_USERNAME` / `ADMIN_NAME` | 管理员用户名和显示名称 |
| `ADMIN_PASSWORD` | 至少 12 位的管理员密码 |
| `STORAGE_DRIVER=s3` | Serverless 持久化文件存储 |
| `S3_*` | S3 / R2 对象存储配置 |
| `REDIS_URL` | 可选；多实例部署建议使用共享 Redis |

首次上线前，在受信任的终端或受保护的 CI/CD 发布任务中，使用**生产数据库**连接信息执行：

```bash
npm ci
npm run db:generate
npm run db:push
npm run db:admin
```

不要在每个 Web 请求中执行数据库初始化。无持久化本地磁盘的环境必须使用 S3、R2 等对象存储保存上传文件。数据库连接池或直连地址应遵循托管服务商针对应用连接与管理命令的建议。可参考 [Prisma PostgreSQL 连接文档](https://www.prisma.io/docs/postgres/database/connecting-to-your-database)。

## 🩺 页面报错排查

页面错误提示不等于数据库表结构一定有问题。请先查看运行终端中的 Prisma 错误代码：

| 错误代码 | 常见含义 | 检查方向 |
| --- | --- | --- |
| `P1001` | 无法连接数据库服务器 | PostgreSQL 服务、主机和端口 |
| `P1002` | 连接数据库超时 | 网络、防火墙、数据库负载 |
| `P2021` | 数据库表不存在 | 检查 Schema 并按需执行 `npm run db:push` |
| `P2022` | 数据库列不存在 | 检查 Schema 与实际表结构是否一致 |
| `P2024` | 等待连接池连接超时 | 检查连接数、并发和数据库连接上限 |

建议先确认 PostgreSQL 正在运行，再检查 `.env` 中的 `DATABASE_URL`。只有遇到表或列缺失等结构问题时，才需要考虑执行 `npm run db:push`。连接错误不要靠反复 push 解决。

## ⚙️ 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 本地开发 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务 |
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:push` | 同步 PostgreSQL Schema |
| `npm run db:admin` | 创建首个管理员 |
| `npm run db:seed` | 导入示例内容 |
| `npm run db:studio` | 打开 Prisma Studio |

## 🎀 看板娘与音乐播放器

两个组件都挂在 `src/app/(site)/layout.tsx`（只在前台出现），不写数据库、不依赖外部接口。
配置集中在 `src/config/`，加歌、换模型都不用改组件代码。

### 🎵 音乐播放器

| 文件 | 作用 |
| --- | --- |
| `src/config/music.ts` | 歌曲列表、音量、是否循环 / 随机 |
| `src/hooks/use-audio-player.ts` | 播放状态机（单例 `HTMLAudioElement`，事件驱动，卸载时释放） |
| `src/components/music-player/` | 播放器外壳、控制条、进度条、音量、歌单 |

加歌：

1. 音频放 `public/music/tracks/`，封面放 `public/music/covers/`；
2. 在 `musicConfig.tracks` 里追加 `{ id, title, artist, cover, url }`，`id` 保持唯一。

播放器挂在布局里，前台切换路由不会中断播放；音量、循环方式、随机和当前曲目记在
`localStorage`。默认不自动播放（浏览器会拦截），`autoplay` 保持 `false`。

### 🧸 看板娘（Live2D）

| 文件 | 作用 |
| --- | --- |
| `src/config/live2d.ts` | 模型路径、位置、尺寸、气泡文案、移动端策略 |
| `src/components/live2d/live2d.tsx` | 加载运行时、挂载 / 销毁 [`l2d-widget`](https://github.com/hacxy/l2d-widget) 实例 |
| `public/vendor/l2d-widget.min.js` | 官方 IIFE 构建（自带 Cubism 2 / 4 运行时），约 644 KB，按需加载 |

放模型：

1. 模型放 `public/live2d/models/<名字>/`（`model.json` 或 `*.model3.json`，连同纹理、动作、物理文件）；
2. 改 `live2dConfig.models[].path` 指向它；`models` 传多个时，悬浮菜单会自动出现切换按钮；
3. 现在的默认值是库作者的演示模型（`https://model.hacxy.cn/cat-black/model.json`），
   第一次打开就能看到效果，**正式使用请换成自己的本地模型**。

关于运行时：不要改成 `import { createWidget } from "l2d-widget"`。该包的 ESM 产物在模块初始化阶段
就读取 `Live2DCubismCore` 全局，经 webpack 生产构建压缩后这个读取会被提前到模块顶层，
未预加载 Core 时会抛 `ReferenceError: Live2DCubismCore is not defined`（dev 模式因为不压缩，
反而看不出来）。所以这里用官方 IIFE 构建 + `<script>` 按需加载，Cubism 2/3/4 模型都能直接用。
升级 npm 包后记得同步 `public/vendor/l2d-widget.min.js`：

```bash
npm update l2d-widget
cp node_modules/l2d-widget/dist/index.min.js public/vendor/l2d-widget.min.js
```

行为说明：

- 移动端默认不显示（`mobile.enabled: false`，阈值 `maxWidth`）；系统开启“减少动态效果”时也不显示；
- 模型文件不存在时直接跳过，不会在页面上留下“加载中”的半截 UI（开发环境控制台提示缺哪个文件）；
- 运行时和模型都在 `loadDelayMs` 之后才加载，不进首屏；
- 隐藏后点左下角的休息状态条即可唤醒，菜单里有“让她休息一下”。

关闭任一组件：把对应配置里的 `enabled` 改成 `false`。
`public/music` 与 `public/live2d` 下各有一份资源说明；模型和音乐请自行确认授权。

## 💾 数据备份

Docker PostgreSQL 备份：

```bash
docker compose exec -T db pg_dump -U mashiro -d mashiro -Fc > mashiro-backup.dump
```

恢复前请先备份现有数据，并确认目标数据库：

```bash
cat mashiro-backup.dump | docker compose exec -T db pg_restore -U mashiro -d mashiro --clean --if-exists
```

上传文件位于本地的 `public/uploads`；Docker 使用 `mashiro_uploads` 命名卷。线上多实例部署建议使用持久化对象存储。

## 🔒 安全建议

- 🔑 数据库密码、管理员密码与 `AUTH_SECRET` 必须互不相同。
- 🚫 不要将 `.env`、密码或密钥提交到 Git。
- 🛡️ 不要将 PostgreSQL 5432 端口直接暴露到公网。
- 🔐 生产环境启用 HTTPS。
- 💾 定期备份数据库和上传文件。
- 👮 不要将首位公开注册用户自动设为管理员。

## 🙏 致谢与来源

感谢开源社区提供的框架、工具与知识。项目中涉及第三方主题、框架或教程的技术文章会保留相应原始名称与出处说明；Mashiro Nest 自身的产品名称与默认账号标识统一使用 Mashiro。

---

<p align="center">
  🌸 Made with care · Mashiro Nest
</p>
