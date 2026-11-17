import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Sparkles } from "lucide-react";
import { Hero } from "@/components/hero";
import { ProfileCard } from "@/components/profile-card";
import { getPage, getSettings, getStats, listUsers } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";
import { visitorLocation } from "@/lib/geo";
import { formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "关于",
  description: "关于这个站点、作者与它的技术栈。",
};

const STACK = [
  { name: "Next.js 15", detail: "App Router、React Server Components、Server Actions", color: "#9aa3b8" },
  { name: "React 19", detail: "服务端优先渲染，仅少量交互组件进入客户端", color: "#8fb8f4" },
  { name: "PostgreSQL", detail: "文章、用户、关注、动态的关系型存储", color: "#7dd3b8" },
  { name: "Prisma", detail: "类型安全的查询与迁移，schema 即文档", color: "#a5b4fc" },
  { name: "Redis", detail: "首页聚合缓存与阅读量计数器，缺失时自动降级", color: "#f48f9e" },
  { name: "S3", detail: "按内容哈希去重的图床，兼容 MinIO / R2 / OSS", color: "#f4b78f" },
  { name: "Tailwind CSS v4", detail: "设计令牌与玻璃拟态，暗色模式跟随系统", color: "#8fe0f4" },
];

export default async function AboutPage() {
  const [settings, page, stats, users] = await Promise.all([
    getSettings(),
    getPage("about"),
    getStats(),
    listUsers(),
  ]);

  const owner = users.find((user) => user.role === "ADMIN") ?? users[0] ?? null;
  const rendered = page ? await renderMarkdown(page.content) : null;
  const visitor = await visitorLocation();
  // 位置优先用后台填的，没填就按访问者 IP 归属地显示（失败则留空）。
  const location = owner?.location?.trim() || visitor;
  const images = settings.heroImages?.length ? settings.heroImages : ["/images/banner.svg"];
  const heroImage = images[Math.floor(Date.now() / 86_400_000) % images.length];

  return (
    <>
      <Hero
        title={settings.aboutTitle || "关于"}
        subtitle={settings.siteName}
        image={heroImage}
        beam={settings.heroBeam}
        compact
      />

      <div className="mx-auto -mt-10 max-w-[1180px] px-4 pb-10">
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <ProfileCard user={owner} settings={settings} />

            <section className="card p-4">
              <h3 className="section-title">Quick facts</h3>
              <ul className="mt-3 space-y-2.5 text-[11.5px]">
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-ink-400">
                    <MapPin className="h-3 w-3" /> 位置
                  </span>
                  <span className="max-w-[140px] truncate text-right font-semibold text-ink-600 dark:text-white/80">
                    {location || "未知"}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-ink-400">
                    <Sparkles className="h-3 w-3" /> 文章
                  </span>
                  <span className="font-semibold text-ink-600 dark:text-white/80">
                    {stats.posts} 篇
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-ink-400">
                    <Sparkles className="h-3 w-3" /> 动态 / 用户
                  </span>
                  <span className="font-semibold text-ink-600 dark:text-white/80">
                    {stats.moments} / {stats.users}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-ink-400">
                    <Sparkles className="h-3 w-3" /> 总字数
                  </span>
                  <span className="font-semibold text-ink-600 dark:text-white/80">
                    {formatNumber(stats.words)}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-ink-400">
                    <Mail className="h-3 w-3" /> 主页
                  </span>
                  <Link
                    href={owner ? `/u/${owner.username}` : "/"}
                    className="font-semibold text-mint-500 hover:text-sakura-500 dark:text-mint-300"
                  >
                    看看
                  </Link>
                </li>
              </ul>
            </section>
          </div>

          <div className="space-y-5">
            <div className="card p-6 sm:p-9">
              {rendered ? (
                <div
                  className="prose-mizuki max-w-none"
                  dangerouslySetInnerHTML={{ __html: rendered.html }}
                />
              ) : (
                <p className="text-sm text-ink-400">
                  还没有关于页的内容，去后台「站点设置」写一段吧。
                </p>
              )}

              {page ? (
                <p className="mt-8 border-t border-ink-100 pt-4 text-[10.5px] text-ink-300 dark:border-white/10">
                  最后更新 {formatDate(page.updated, "readable")}
                </p>
              ) : null}
            </div>

            <section className="card p-6">
              <div className="flex items-center justify-between">
                <h2 className="section-title">技术栈</h2>
                <span className="text-[10.5px] text-ink-300">7 个关键选型</span>
              </div>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {STACK.map((item) => (
                  <div
                    key={item.name}
                    className="group rounded-2xl border border-ink-100/80 bg-white/50 p-3.5 transition hover:-translate-y-0.5 hover:border-mint-200 hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[12.5px] font-bold text-ink-800 dark:text-white/90">
                        {item.name}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-ink-400">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/admin"
                className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-semibold text-mint-500 transition hover:text-sakura-500 dark:text-mint-300"
              >
                进入后台
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
