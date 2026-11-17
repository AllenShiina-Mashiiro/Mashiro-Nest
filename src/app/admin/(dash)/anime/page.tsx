import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Plus, Star, Trash2 } from "lucide-react";
import { deleteAnimeAction, saveAnimeAction } from "@/app/admin/actions";
import { getAnime } from "@/lib/data";
import type { AnimeItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "追番管理",
  robots: { index: false, follow: false },
};

const STATUS: Array<{ value: AnimeItem["status"]; label: string }> = [
  { value: "WATCHING", label: "在看" },
  { value: "COMPLETED", label: "看过" },
  { value: "PLANNED", label: "想看" },
  { value: "PAUSED", label: "搁置" },
  { value: "DROPPED", label: "弃番" },
];

function Fields({ item }: { item?: AnimeItem }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-[10.5px] font-semibold text-ink-400">标题</span>
        <input
          name="title"
          required
          defaultValue={item?.title ?? ""}
          className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[10.5px] font-semibold text-ink-400">封面地址</span>
        <input
          name="cover"
          defaultValue={item?.cover ?? ""}
          placeholder="留空使用渐变封面"
          className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[10.5px] font-semibold text-ink-400">状态</span>
        <select
          name="status"
          defaultValue={item?.status ?? "PLANNED"}
          className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
        >
          {STATUS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[10.5px] font-semibold text-ink-400">评分（0-10）</span>
        <input
          name="rating"
          type="number"
          min={0}
          max={10}
          defaultValue={item?.rating ?? 0}
          className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
        />
      </label>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="mb-1 block text-[10.5px] font-semibold text-ink-400">季度</span>
          <input
            name="season"
            defaultValue={item?.season ?? ""}
            placeholder="夏"
            className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10.5px] font-semibold text-ink-400">年份</span>
          <input
            name="year"
            type="number"
            defaultValue={item?.year ?? ""}
            className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
          />
        </label>
      </div>
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-[10.5px] font-semibold text-ink-400">短评</span>
        <textarea
          name="comment"
          rows={2}
          defaultValue={item?.comment ?? ""}
          className="w-full resize-none rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
        />
      </label>
    </div>
  );
}

export default async function AnimeAdminPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/admin");

  const anime = await getAnime();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-900 dark:text-white">追番</h1>
        <p className="mt-1 text-[11.5px] text-ink-400">
          共 {anime.length} 部 · 标题、评分、封面与短评都可以修改。
        </p>
      </div>

      <details className="rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]">
        <summary className="flex cursor-pointer items-center gap-1.5 text-[12.5px] font-bold text-mint-600 dark:text-mint-300">
          <Plus className="h-3.5 w-3.5" />
          新增番剧
        </summary>
        <form action={saveAnimeAction} className="mt-3 space-y-3">
          <Fields />
          <button
            type="submit"
            className="rounded-full bg-gradient-to-br from-mint-400 to-mint-500 px-4 py-1.5 text-[11.5px] font-semibold text-white"
          >
            保存
          </button>
        </form>
      </details>

      <div className="space-y-2.5">
        {anime.map((item) => (
          <details
            key={item.id}
            className="rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]"
          >
            <summary className="flex cursor-pointer items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-100/70 text-ink-400 dark:bg-white/5">
                <Star className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold text-ink-800 dark:text-white/90">
                  {item.title}
                </span>
                <span className="block truncate text-[10.5px] text-ink-400">
                  {STATUS.find((status) => status.value === item.status)?.label} · {item.rating}/10
                  {item.year ? ` · ${item.season ?? ""}${item.year}` : ""}
                </span>
              </span>
              <span className="text-[10.5px] text-ink-300">展开编辑</span>
            </summary>

            <form action={saveAnimeAction} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={item.id} />
              <Fields item={item} />
              <button
                type="submit"
                className="rounded-full bg-mint-500 px-4 py-1.5 text-[11.5px] font-semibold text-white"
              >
                保存修改
              </button>
            </form>

            <form action={deleteAnimeAction} className="mt-2">
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-full border border-sakura-200 px-3 py-1.5 text-[11px] font-semibold text-sakura-500 transition hover:bg-sakura-50 dark:border-sakura-400/30 dark:hover:bg-sakura-400/10"
              >
                <Trash2 className="h-3 w-3" />
                删除
              </button>
            </form>
          </details>
        ))}
      </div>
    </div>
  );
}
