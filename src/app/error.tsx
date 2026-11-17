"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The full server-side error (including Prisma error codes) is logged here.
    console.error("[Mashiro Nest] Unhandled page error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[640px] flex-col items-center justify-center px-4 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sakura-50 text-sakura-500 dark:bg-sakura-400/10">
        <TriangleAlert className="h-5 w-5" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-ink-900 dark:text-white">
        页面暂时无法加载
      </h1>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500 dark:text-ink-300/85">
        Mashiro Nest 使用 PostgreSQL 存储数据。这个错误可能来自数据库连接、连接池、查询或表结构，
        不代表一定需要重新执行 <code>npm run db:push</code>。
        请先查看运行终端中以 <code>[Mashiro Nest]</code> 标记的错误和 Prisma 错误代码。
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
        若错误代码为 P1001 / P1002，请检查 PostgreSQL 服务与 DATABASE_URL；
        若为 P2021 / P2022，再检查数据库表结构是否与 Prisma Schema 同步。
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-[10.5px] text-ink-300">digest: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-mint-400 to-mint-500 px-4 py-2 text-[12px] font-semibold text-white"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        重试页面
      </button>
    </div>
  );
}
