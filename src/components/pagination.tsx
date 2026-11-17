import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  basePath = "/",
}: {
  page: number;
  totalPages: number;
  basePath?: string;
}) {
  if (totalPages <= 1) return null;

  const href = (target: number) =>
    target === 1 ? basePath : `${basePath}?page=${target}`;

  const windowSize = 5;
  const start = Math.max(1, Math.min(page - 2, totalPages - windowSize + 1));
  const pages = Array.from(
    { length: Math.min(windowSize, totalPages) },
    (_, index) => start + index,
  );

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="分页">
      <Link
        href={href(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={`grid h-9 w-9 place-items-center rounded-xl border text-ink-400 transition ${
          page === 1
            ? "pointer-events-none border-ink-100 opacity-40 dark:border-white/10"
            : "border-ink-200/70 bg-white/60 hover:-translate-y-0.5 hover:border-mint-300 hover:text-mint-500 dark:border-white/10 dark:bg-white/5"
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {pages.map((item) => (
        <Link
          key={item}
          href={href(item)}
          aria-current={item === page ? "page" : undefined}
          className={`grid h-9 min-w-9 place-items-center rounded-xl px-2 text-[12.5px] font-semibold transition ${
            item === page
              ? "bg-gradient-to-br from-mint-400 to-mint-500 text-white shadow-[0_10px_20px_-12px_rgba(76,186,155,0.9)]"
              : "border border-ink-200/70 bg-white/60 text-ink-500 hover:-translate-y-0.5 hover:border-mint-300 hover:text-mint-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-300"
          }`}
        >
          {item}
        </Link>
      ))}

      <Link
        href={href(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={`grid h-9 w-9 place-items-center rounded-xl border text-ink-400 transition ${
          page === totalPages
            ? "pointer-events-none border-ink-100 opacity-40 dark:border-white/10"
            : "border-ink-200/70 bg-white/60 hover:-translate-y-0.5 hover:border-mint-300 hover:text-mint-500 dark:border-white/10 dark:bg-white/5"
        }`}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
