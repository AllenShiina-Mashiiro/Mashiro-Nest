import Link from "next/link";
import { Compass, House } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[720px] flex-col items-center justify-center px-4 text-center">
      <p className="bg-gradient-to-r from-mint-400 to-sakura-400 bg-clip-text text-[86px] font-bold leading-none text-transparent">
        404
      </p>
      <h1 className="mt-4 text-xl font-bold text-ink-900 dark:text-white">
        这里什么也没有
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-500 dark:text-ink-300/85">
        页面可能被移动或删除了。试试回到首页，或者去归档里找找。
      </p>
      <div className="mt-6 flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-mint-400 to-mint-500 px-4 py-2 text-[12px] font-semibold text-white shadow-[0_14px_28px_-16px_rgba(76,186,155,0.95)] transition hover:-translate-y-0.5"
        >
          <House className="h-3.5 w-3.5" />
          回到首页
        </Link>
        <Link
          href="/archive"
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-200/70 bg-white/60 px-4 py-2 text-[12px] font-semibold text-ink-500 transition hover:border-mint-300 hover:text-mint-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-300"
        >
          <Compass className="h-3.5 w-3.5" />
          浏览归档
        </Link>
      </div>
    </div>
  );
}
