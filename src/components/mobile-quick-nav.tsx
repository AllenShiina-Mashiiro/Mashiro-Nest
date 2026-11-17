import Link from "next/link";
import { House } from "lucide-react";
import type { CategoryWithCount } from "@/lib/types";

/**
 * 手机端首页顶部的快捷导航条：主页按钮 + 归档与分类（带数量），
 * 对应参考图里 hero 下方那条白色胶囊栏。
 */
export function MobileQuickNav({
  categories,
  total,
}: {
  categories: CategoryWithCount[];
  total: number;
}) {
  return (
    <div className="sm:hidden">
      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl bg-white/95 p-2 shadow-[0_8px_24px_-16px_rgba(24,32,48,0.45)] ring-1 ring-white/70 backdrop-blur dark:bg-[#151b26]/95 dark:ring-white/10">
        <Link
          href="/"
          aria-label="首页"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#3d9be9] text-white shadow-[0_6px_14px_-8px_rgba(61,155,233,0.9)]"
        >
          <House className="h-4 w-4" />
        </Link>

        <Link
          href="/archive"
          className="shrink-0 rounded-xl border border-ink-100 px-3 py-1.5 text-[12px] font-medium text-ink-600 dark:border-white/10 dark:text-ink-300"
        >
          Archive <span className="ml-0.5 text-[11px] text-ink-400">{total}</span>
        </Link>

        {categories.slice(0, 4).map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="shrink-0 rounded-xl border border-ink-100 px-3 py-1.5 text-[12px] font-medium text-ink-600 dark:border-white/10 dark:text-ink-300"
          >
            {category.name}{" "}
            <span className="ml-0.5 text-[11px] text-ink-400">{category.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
