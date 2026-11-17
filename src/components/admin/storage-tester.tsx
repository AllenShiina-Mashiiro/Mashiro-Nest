"use client";

import { CheckCircle2, Loader2, PlugZap, XCircle } from "lucide-react";
import { useState } from "react";

export function StorageTester() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/storage/test", { method: "POST" });
      const payload = (await response.json()) as { ok?: boolean; message?: string; error?: string };
      if (!response.ok) {
        setResult({ ok: false, message: payload.error ?? "请求失败" });
        return;
      }
      setResult({ ok: Boolean(payload.ok), message: payload.message ?? "" });
    } catch {
      setResult({ ok: false, message: "网络错误" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink-200/80 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-ink-500 transition hover:border-mint-300 hover:text-mint-500 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-ink-300"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlugZap className="h-3 w-3" />}
        测试存储连接
      </button>

      {result ? (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium ${
            result.ok ? "text-mint-600 dark:text-mint-300" : "text-sakura-500"
          }`}
        >
          {result.ok ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          {result.message}
        </span>
      ) : null}
    </div>
  );
}
