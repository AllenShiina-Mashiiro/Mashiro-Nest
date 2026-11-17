import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/hero";
import { MobileQuickNav } from "@/components/mobile-quick-nav";
import { Pagination } from "@/components/pagination";
import { PostCard } from "@/components/post-card";
import { Sidebar } from "@/components/sidebar";
import { getCategories, getPosts, getSettings, getStats, getTags, listUsers } from "@/lib/data";
import { siteConfig } from "@/lib/config";
import { pickHeroImage } from "@/lib/hero";
import { paginate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const requested = Number.parseInt(params.page ?? "1", 10);

  const [settings, posts, categories, tags, stats, users] = await Promise.all([
    getSettings(),
    getPosts(),
    getCategories(),
    getTags(),
    getStats(),
    listUsers(),
  ]);

  const owner = users.find((user) => user.role === "ADMIN") ?? users[0] ?? null;
  const images = settings.heroImages?.length ? settings.heroImages : ["/images/banner.svg"];
  const heroImage = pickHeroImage(images, settings.heroRotateMinutes);

  const { items, page, totalPages, total } = paginate(
    posts,
    Number.isNaN(requested) ? 1 : requested,
    siteConfig.postsPerPage,
  );

  return (
    <>
      <Hero
        title={settings.heroTitle || settings.siteName}
        subtitle={settings.heroSubtitle || settings.siteSubtitle}
        image={heroImage}
        images={images}
        rotateMinutes={settings.heroRotateMinutes}
        beam={settings.heroBeam}
      />

      <div className="relative z-10 mx-auto -mt-14 max-w-[1180px] px-4">
        <MobileQuickNav categories={categories} total={total} />

        <div className="mt-3 flex flex-col gap-5 sm:mt-5 lg:flex-row">
          <Sidebar
            categories={categories}
            tags={tags}
            stats={stats}
            owner={owner}
            settings={settings}
          />

          <div className="min-w-0 flex-1">
            <div className="grid gap-3 sm:gap-4">
              {items.map((post, index) => (
                <PostCard key={post.slug} post={post} index={index} />
              ))}
            </div>

            {items.length === 0 ? (
              <div className="card grid place-items-center px-6 py-16 text-center">
                <p className="text-sm font-semibold text-ink-700 dark:text-white/90">
                  还没有文章
                </p>
                <p className="mt-1 text-xs text-ink-400">
                  登录后在控制台发布第一篇，或者运行 <code>npm run db:seed</code> 导入示例内容。
                </p>
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between px-1 text-[11px] text-ink-400">
              <span>
                共 {total} 篇 · 第 {page} / {totalPages} 页
              </span>
              <Link
                href="/archive"
                className="inline-flex items-center gap-1 font-semibold text-mint-500 transition hover:text-sakura-500 dark:text-mint-300"
              >
                全部归档
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <Pagination page={page} totalPages={totalPages} />
          </div>
        </div>
      </div>
    </>
  );
}
