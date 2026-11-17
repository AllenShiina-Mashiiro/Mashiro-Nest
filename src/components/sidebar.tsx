import Link from "next/link";
import { ArrowUpRight, BookOpen, CalendarDays, Cpu, Hash, Type } from "lucide-react";
import { siteConfig } from "@/lib/config";
import type { SiteSettings } from "@/lib/settings";
import type { CategoryWithCount, SiteStats, TagRef } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { ProfileCard } from "@/components/profile-card";
import type { PublicUser } from "@/lib/types";

export function CategoriesCard({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <section className="card p-4">
      <h3 className="section-title">Categories</h3>
      <ul className="mt-3 space-y-0.5">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/categories/${category.slug}`}
              className="flex items-center justify-between rounded-xl px-2.5 py-[7px] text-[12.5px] text-ink-600 transition hover:bg-mint-50 hover:text-mint-600 dark:text-ink-300 dark:hover:bg-white/5 dark:hover:text-mint-300"
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </span>
              <span className="rounded-full bg-ink-100/80 px-1.5 text-[10px] font-semibold text-ink-400 dark:bg-white/10 dark:text-ink-300">
                {category.count}
              </span>
            </Link>
          </li>
        ))}
        {categories.length === 0 ? (
          <li className="px-2 py-3 text-xs text-ink-400">还没有分类</li>
        ) : null}
      </ul>
    </section>
  );
}

export function TagsCard({ tags }: { tags: TagRef[] }) {
  return (
    <section className="card p-4">
      <h3 className="section-title">Tags</h3>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Link
            key={tag.slug}
            href={`/tags/${tag.slug}`}
            className="group inline-flex items-center gap-1 rounded-full border border-ink-200/70 px-2 py-[3px] text-[11px] text-ink-500 transition hover:-translate-y-0.5 hover:border-mint-300 hover:bg-mint-50 hover:text-mint-600 dark:border-white/10 dark:text-ink-300 dark:hover:bg-mint-400/10 dark:hover:text-mint-300"
          >
            {tag.name}
            <span className="text-[9px] text-ink-300 group-hover:text-mint-400">
              {tag.count}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function StatsCard({ stats }: { stats: SiteStats }) {
  const items = [
    { label: "文章", value: String(stats.posts), icon: BookOpen },
    { label: "字数", value: formatNumber(stats.words), icon: Type },
    { label: "标签", value: String(stats.tags), icon: Hash },
    { label: "运行", value: `${stats.days}d`, icon: CalendarDays },
  ];

  return (
    <section className="card p-4">
      <h3 className="section-title">Stats</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-ink-100/50 px-2.5 py-2 dark:bg-white/5"
          >
            <div className="flex items-center gap-1 text-[10px] text-ink-400">
              <item.icon className="h-3 w-3" />
              {item.label}
            </div>
            <div className="mt-0.5 text-[15px] font-bold text-ink-800 dark:text-white/90">
              {item.value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10.5px] text-ink-400">
        <span>总阅读</span>
        <span className="font-semibold text-mint-500">{formatNumber(stats.views)}</span>
      </div>
    </section>
  );
}

export function TechCard() {
  return (
    <section className="card p-4">
      <h3 className="section-title">Built with</h3>
      <p className="mt-2 text-[11.5px] leading-relaxed text-ink-400">
        服务端渲染 + 关系型内容库 + 可选缓存与对象存储。
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {siteConfig.tech.map((tech) => (
          <span
            key={tech}
            className="rounded-lg bg-white/70 px-2 py-1 text-[10.5px] font-medium text-ink-500 ring-1 ring-ink-100 dark:bg-white/5 dark:text-ink-300 dark:ring-white/10"
          >
            {tech}
          </span>
        ))}
      </div>
      <Link
        href="/about"
        className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold text-mint-500 transition hover:text-sakura-500 dark:text-mint-300"
      >
        架构说明
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </section>
  );
}

export function Sidebar({
  categories,
  tags,
  stats,
  owner,
  settings,
}: {
  categories: CategoryWithCount[];
  tags: TagRef[];
  stats: SiteStats;
  owner: PublicUser | null;
  settings: SiteSettings;
}) {
  return (
    <div className="hidden w-full flex-col gap-4 lg:flex lg:w-[286px] lg:shrink-0">
      <ProfileCard user={owner} settings={settings} />
      {/* On phones the column would push the feed below the fold, so the extra
          cards are desktop-only. */}
      <div className="hidden flex-col gap-4 lg:flex">
        <CategoriesCard categories={categories} />
        <TagsCard tags={tags} />
        <StatsCard stats={stats} />
        <TechCard />
        <p className="px-2 text-center text-[10.5px] leading-relaxed text-ink-300">
          <Cpu className="mr-1 inline h-3 w-3" />
          rendered on the server · cached with Redis
        </p>
      </div>
    </div>
  );
}

