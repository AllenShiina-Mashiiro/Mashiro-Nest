# 真白屋 · Mashiro Nest

一个从 [Mizuki](https://astro.build/themes/details/mizuki/) 主题出发、重写成 **多用户全栈博客** 的项目：
樱花主视觉 + 玻璃拟态 + 樱花粒子，内容是 PostgreSQL（或零配置的本地 JSON）里的真实数据，
支持注册登录、写作、朋友圈、关注/粉丝、个人主页与可在线编辑的站点设置。

> 默认零依赖即可运行（本地 JSON 模式），配置数据库后即为完整多用户博客。

---

## 🖼 预览

| 首页 | 朋友圈 |
| --- | --- |
| ![首页](docs/home.png) | ![朋友圈](docs/moments.png) |

| 手机端 | 个人主页 |
| --- | --- |
| ![手机端](docs/mobile.png) | ![个人主页](docs/profile.png) |

| 后台概览 | 站点设置 |
| --- | --- |
| ![后台概览](docs/admin.png) | ![站点设置](docs/settings.png) |

> 截图来自本地 JSON 模式（`npm run dev`），浅色 / 深色可在右上角切换，
> 也支持 `?theme=light` / `?theme=dark` 直接指定。

---

## ✨ 特性

**站点**
- 全屏樱花主视觉：多张背景图按天轮换、斜切光束分界线、樱花粒子（Canvas，三层景深 + 鼠标扰动）
- 毛玻璃卡片、斜切色块、暗色模式、移动端适配
- 文章、分类、标签、归档、全文搜索（文章 + 动态 + 用户）、RSS、sitemap、JSON-LD

**用户**
- 注册 / 登录 / 退出，`ADMIN` 与 `USER` 两种角色
- 头像、昵称（与登录名分离）、简介、状态、位置、GitHub / Telegram / 个人网站
- B 站风格个人主页：横幅、头像、数据、关注按钮、粉丝/关注弹窗
- `/u/<用户名>` 是主页地址，`/user` 会直接跳到当前登录用户的主页
- 关注 / 取关，文章与动态都会显示作者
- 导航栏带简化图标（Home / Archive / About / Friends / Anime / Moments）

**写作**
- 后台 Markdown 编辑器，支持在光标处插入图片（像 WPS 一样自由插入）
- 草稿 / 发布 / 精选 / 置顶（精选与置顶仅站长可用），作者归属
- 朋友圈：登录后在前台直接发布、编辑、删除，支持地点与最多 9 张图
- 点赞（红心）与评论：评论支持回车发送、作者可删自己的评论，站长可删任意评论

**站点设置（后台可视化）**
- 站点名称、图标、副标题、描述、备案号
- 联系邮箱、导航栏 GitHub 链接、名片上的 Telegram 链接
- 首页大标题 / 副标题 / 多张背景图（按天轮换）/ 光束开关
- 登录页背景、关于页标题与正文
- 站长资料（昵称、头像、简介、状态、位置、GitHub、Telegram）同步到首页名片、导航与侧边栏
- 状态是下拉菜单（预设 + 自定义），不是浏览器原生输入弹窗
- 关于页「位置」：后台填了就用后台的，没填按访问者 IP 归属地显示（失败自动留空）

**运维**
- 媒体库：服务端上传、按 SHA-256 内容寻址自动去重、孤儿文件检测与一键清理
- Redis 缓存与阅读量计数（未配置自动降级为内存）
- 存储可切换：默认「有 S3 配置就用 S3，否则本地 `public/uploads`」，也可用 `STORAGE_DRIVER` 强制指定；媒体库里有「测试存储连接」自检
- 站长可删除普通账号（连带其文章、动态与关注关系）；自己和管理员账号不可删除
- 通知：被点赞 / 被评论会在导航栏出现红点，点开列表可直接跳到对应动态

---

## 🧱 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Next.js 15（App Router / RSC / Server Actions） |
| UI | React 19、Tailwind CSS v4、lucide-react |
| 数据 | PostgreSQL 16、Prisma 6（或本地 JSON 演示模式） |
| 缓存 | Redis 7（ioredis，可选） |
| 存储 | S3 兼容对象存储（可选） |
| 鉴权 | jose（JWT）+ bcryptjs + httpOnly Cookie |
| 内容 | unified / remark / rehype / Shiki |
| 粒子 | 自研 Canvas `SakuraPetals`（`src/components/sakura-petals.tsx`） |

---

## 🚀 快速开始

### 方式 A：零依赖（本地 JSON 模式）

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev
```

打开 <http://localhost:3000>。没有 `DATABASE_URL` 时，所有数据写入 `.data/store.json`，
**注册、写作、发动态、改设置、关注、上传图片都可以正常用**。

默认站长账号：`admin@mizuki.dev` / `mizuki`（用户名 `mizuki`）。

### 方式 B：本地 PostgreSQL（用项目自带脚本，推荐）

不需要 Docker，也不会碰你系统里已安装的那个 PostgreSQL 服务。脚本会在项目里初始化一个独立集群（端口 `55432`，只监听 127.0.0.1，trust 认证）：

```bash
powershell -ExecutionPolicy Bypass -File scripts/dev-db.ps1 start
npm run db:push
npm run db:seed      # 站长 AllenShiina(重庆) + 8 篇文章 + 动态/友人帐/追番 + 关于页 + 站点设置
npm run dev
```

`.env` 里对应这一行（默认已经写好）：

```dotenv
DATABASE_URL="postgresql://postgres@127.0.0.1:55432/mashiro?schema=public&connect_timeout=3"
```

常用命令：

```bash
scripts/dev-db.ps1 status   # 看端口/进程状态
scripts/dev-db.ps1 stop     # 停掉（数据保留在 .pgdata/）
scripts/dev-db.ps1 reset    # 删库重来
```

**用你自己那台 PostgreSQL 18 也可以**（服务名 `postgresql-x64-18`，需要管理员权限启动）：

```powershell
net start postgresql-x64-18
& "D:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres mashiro
# 再把 .env 的 DATABASE_URL 换成你自己的账号密码
```

> 连不上数据库时站点会自动回退到本地 JSON 模式并打印一条警告，不会白屏。

### 方式 C：Docker 全家桶（PostgreSQL + Redis + MinIO）

```bash
docker compose up -d
cp .env.example .env
```

在 `.env` 中填写：

```dotenv
DATABASE_URL="postgresql://mizuki:mizuki@localhost:5432/mizuki?schema=public"
REDIS_URL=redis://localhost:6379
S3_BUCKET=mizuki-media
S3_REGION=us-east-1
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=mizuki
S3_SECRET_ACCESS_KEY=mizuki123
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_URL=http://localhost:9000/mizuki-media
```

```bash
npm run db:push
npm run db:seed
npm run dev
```

> **复用已有 `node_modules` 的话**：先执行一次 `npx prisma generate`，确保 Prisma 客户端
> 带有可用的查询引擎（`npm install` 会自动执行这一步）。

---

## ⚙️ 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 是 | 站点地址，用于 RSS / sitemap / OG / Cookie 安全策略 |
| `DATABASE_URL` | 否 | 不填 = 本地 JSON 模式 |
| `AUTH_SECRET` | 生产必填 | JWT 签名密钥，`openssl rand -base64 32` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_USERNAME` | 否 | 首个站长账号（seed 或 JSON 初始化） |
| `REDIS_URL` | 否 | 不填则使用进程内缓存 |
| `CACHE_TTL` | 否 | 列表 / 文章缓存秒数，默认 30 |
| `S3_*` | 否 | 不填则图片写入 `public/uploads` |
| `DISABLE_IP_LOCATION` | 否 | 设为 `1` 关闭关于页的访客 IP 定位 |

---

## 🧠 关键设计

### 1. 双数据源，同一套接口

`src/lib/data/index.ts` 根据 `DATABASE_URL` 选择实现：

- `database`：Prisma 查询 PostgreSQL
- `demo`：读写 `.data/store.json`（首次访问自动播种文章 / 友人帐 / 追番 / 关于页）

两者都实现 `Store` 接口（读 + 写 + 设置 + 关注 + 媒体引用），页面与 Server Action 完全不感知当前模式。

### 2. 权限

- `USER`：写自己的文章、发/改/删自己的动态、关注别人、改自己的资料、传图片
- 不能删除自己，管理员账号一律受保护（删号前会二次校验）
- `ADMIN`：额外拥有站点设置、友人帐、追番、用户管理、删除账号、精选/置顶
- 每个受保护页面在服务端 `getSession()` + `redirect()`，Server Action 再校验一次归属

### 3. 媒体去重与孤儿文件

上传走 `POST /api/media`（服务端接收），文件名为 `uploads/<year>/<sha256>.<ext>`：

- 相同字节 → 同一个 key，天然去重（`savedUpload` 先 `HEAD`/`exists` 检查）
- `listMediaReferences()` 汇总文章正文、封面、动态图片、头像、横幅、友人帐、追番、站点设置里出现的 URL
- 媒体库页对比引用集合，标出「使用中 / 孤儿文件」，可一键清理

### 4. 设置与缓存

站点设置存成一条 `Setting`（key = `site`，JSON），读取经 `cached("settings:site")`；
保存后失效相关 key 并 `revalidatePath`。首页、关于、登录页、页脚、导航都从设置读取，
所以后台改完刷新即生效。

### 5. 阅读量

浏览器 `POST /api/views` → Redis `HINCRBY` 增量，展示 `数据库基准值 + 增量`；
需要落库时调用 `flushViewDeltas()`。

---

## 📁 目录结构

```
src/
├── app/
│   ├── (site)/            # 前台：首页、文章、归档、分类、标签、搜索、友人帐、追番、朋友圈、关于、登录、注册、/u/[username]
│   ├── admin/
│   │   ├── login/         # 后台登录（独立布局）
│   │   └── (dash)/        # 概览、文章、编辑器、媒体库、个人资料、友人帐、追番、用户、站点设置
│   ├── api/               # auth / media / moments / follow / search / views
│   ├── rss.xml/ sitemap.ts robots.ts
├── components/            # hero、粒子、媒体选择器、关注、动态、后台组件…
├── content/posts/         # Markdown 源文件（seed 与首屏示例）
├── lib/
│   ├── data/              # store 接口 + prisma / json 两个实现
│   ├── settings.ts        # 站点设置类型与默认值
│   ├── media.ts           # 上传、去重、删除
│   ├── media-refs.ts      # 引用扫描与孤儿检测
│   ├── geo.ts             # 访客位置（失败自动降级）
│   ├── auth.ts / cache.ts / markdown.ts / s3.ts
└── prisma/schema.prisma   # User / Follow / Post / Moment / Setting …
```

---

## 🎨 换成自己的博客

1. 后台「站点设置」：站点名、图标、主视觉、关于页、站长资料、登录背景
2. 后台「个人资料」：头像与主页横幅
3. 后台「媒体库」：上传背景图后把地址填进「背景图列表」
4. 想改配色：`src/app/globals.css` 顶部的 `@theme` 令牌
5. 重新生成图形素材（可选）：
   ```bash
   python scripts/make-banner.py    # 主视觉 banner.svg
   python scripts/make-art.py       # 头像、OG、favicon、文章封面
   node scripts/render-art.mjs      # SVG -> PNG 预览
   ```

---

## 🚢 部署

Vercel + Neon（数据库）+ Upstash（Redis）+ R2/S3（图片）：

```bash
npx prisma migrate deploy   # 或 prisma db push
npm run db:seed
```

生产环境务必设置真实的 `AUTH_SECRET`，并给 `/admin` 加一层反向代理鉴权或 IP 白名单。

---

## ❓ 常见问题

**没有数据库能用吗？** 能。所有写操作落到 `.data/store.json`，适合本地体验与单机自托管。
配了 `DATABASE_URL` 之后会自动走 PostgreSQL；数据库临时不可用时会自动回退到 JSON 模式。

**图片存在哪？** 未配置 S3 时写 `public/uploads/<年份>/<hash>.<ext>`；配置后写桶内同路径，
文件名就是内容哈希，因此同一张图永远只存一份。

**删除账号会怎样？** 该用户的文章、动态与关注关系会一起删除（Prisma 级联 / JSON 存储手动清理）。

**为什么首页是动态渲染？** 内容来自数据库或 JSON，构建期连库会让 CI 多一个失败点；
性能交给 Redis / 进程内缓存。

---

## 📄 License

代码 MIT。示例文章与生成的 SVG 素材可自由替换。
原主题 [Mizuki](https://astro.build/themes/details/mizuki/) 版权归其作者所有，本项目仅作视觉参考。
