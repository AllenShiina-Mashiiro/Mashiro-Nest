import type { Metadata } from "next";
import Link from "next/link";
import { Star, Tv } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getAnime } from "@/lib/data";
import type { AnimeStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "追番",
  description: "在看、看过与想看的动画记录。",
};

const STATUS_META: Record<AnimeStatus, { label: string; className: string }> = {
  WATCHING: { label: "在看", className: "bg-mint-100 text-mint-600 dark:bg-mint-400/15 dark:text-mint-300" },
  COMPLETED: {
    label: "看过",
    className: "bg-sakura-100 text-sakura-500 dark:bg-sakura-400/15 dark:text-sakura-300",
  },
  PLANNED: {
    label: "想看",
    className: "bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-300",
  },
  PAUSED: {
    label: "搁置",
    className: "bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300",
  },
  DROPPED: {
    label: "弃番",
    className: "bg-ink-100 text-ink-400 dark:bg-white/5 dark:text-ink-400",
  },
};

const FILTERS: Array<{ key: AnimeStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "全部" },
  { key: "WATCHING", label: "在看" },
  { key: "COMPLETED", label: "看过" },
  { key: "PLANNED", label: "想看" },
  { key: "PAUSED", label: "搁置" },
];

export default async function AnimePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const anime = await getAnime();
  const active = FILTERS.find((item) => item.key === params.status)?.key ?? "ALL";
  const list = active === "ALL" ? anime : anime.filter((item) => item.status === active);

  const counts = anime.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        eyebrow="Anime"
        title="追番记录"
        description={`一共记录了 ${anime.length} 部动画，其中在看 ${counts.WATCHING ?? 0} 部、看过 ${
          counts.COMPLETED ?? 0
        } 部。`}
      />

      <div className="mx-auto max-w-[1180px] px-4 pb-10">
        <div className="mb-5 flex flex-wrap gap-1.5">
          {FILTERS.map((filter) => (
            <Link
              key={filter.key}
              href={filter.key === "ALL" ? "/anime" : `/anime?status=${filter.key}`}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition",
                active === filter.key
                  ? "bg-ink-900 text-white shadow-sm dark:bg-white dark:text-ink-900"
                  : "border border-ink-200/70 bg-white/60 text-ink-500 hover:border-mint-300 hover:text-mint-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-300",
              )}
            >
              {filter.label}
              <span className="ml-1 opacity-60">
                {filter.key === "ALL" ? anime.length : counts[filter.key] ?? 0}
              </span>
            </Link>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((item, index) => (
            <article
              key={item.id}
              style={{ animationDelay: `${index * 40}ms` }}
              className="card group animate-fade-up overflow-hidden p-0 transition duration-300 hover:-translate-y-1"
            >
              <div className="relative h-24 overflow-hidden">
                {item.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.cover}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="relative h-full w-full bg-[linear-gradient(120deg,#f9d5e5,#dfe9ff_45%,#d5f3e8)] dark:bg-[linear-gradient(120deg,#3a2b3c,#22314a_45%,#1e3a35)]">
                    <Tv className="absolute right-3 top-3 h-8 w-8 text-white/45" />
                  </div>
                )}
                <span
                  className={cn(
                    "absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-[0_2px_8px_rgba(26,31,43,0.12)] ring-1 ring-white/60 backdrop-blur",
                    STATUS_META[item.status].className,
                  )}
                >
                  {STATUS_META[item.status].label}
                </span>
              </div>

              <div className="p-4">
                <h2 className="truncate text-[13px] font-bold text-ink-900 dark:text-white/95">
                  {item.title}
                </h2>
                <div className="mt-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-3 w-3",
                        item.rating >= star * 2
                          ? "fill-amber-300 text-amber-300"
                          : "text-ink-200 dark:text-white/15",
                      )}
                    />
                  ))}
                  <span className="ml-1 text-[10.5px] font-semibold text-ink-400">
                    {item.rating > 0 ? (item.rating / 2).toFixed(1) : "—"}
                  </span>
                  {item.year ? (
                    <span className="ml-auto text-[10px] text-ink-300">
                      {item.season ?? ""}
                      {item.year}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-ink-400">
                  {item.comment || "还没有写短评。"}
                </p>
              </div>
            </article>
          ))}
        </div>

        {list.length === 0 ? (
          <p className="card grid place-items-center py-16 text-xs text-ink-400">
            这个分类下还没有记录。
          </p>
        ) : null}
      </div>
    </>
  );
}
