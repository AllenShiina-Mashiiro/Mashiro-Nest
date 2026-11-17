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
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[640px] flex-col items-center justify-center px-4 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sakura-50 text-sakura-500 dark:bg-sakura-400/10">
        <TriangleAlert className="h-5 w-5" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-ink-900 dark:text-white">
        页面出了点问题
      </h1>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500 dark:text-ink-300/85">
        Mashiro Nest 现在仅使用 PostgreSQL，不会自动切换到演示模式。请确认已配置正确的{" "}
        <code>DATABASE_URL</code>，并在项目目录执行 <code>npm run db:push</code>。
        如果问题仍然存在，请查看运行终端中的错误日志。
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
        重试
      </button>
    </div>
  );
}
