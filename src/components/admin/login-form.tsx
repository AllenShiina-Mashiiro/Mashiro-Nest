"use client";

import { Loader2, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  demo,
  demoEmail,
  demoPassword,
}: {
  demo: boolean;
  demoEmail?: string;
  demoPassword?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(demo ? (demoEmail ?? "") : "");
  const [password, setPassword] = useState(demo ? (demoPassword ?? "") : "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "登录失败");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <label className="block">
        <span className="mb-1.5 block text-[11.5px] font-semibold text-ink-500 dark:text-ink-300">
          邮箱
        </span>
        <span className="relative block">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 w-full rounded-xl border border-ink-200/80 bg-white/80 pl-9 pr-3 text-[13px] outline-none transition focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11.5px] font-semibold text-ink-500 dark:text-ink-300">
          密码
        </span>
        <span className="relative block">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-xl border border-ink-200/80 bg-white/80 pl-9 pr-3 text-[13px] outline-none transition focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </span>
      </label>

      {error ? (
        <p className="rounded-xl bg-sakura-50 px-3 py-2 text-[11.5px] font-medium text-sakura-500 dark:bg-sakura-400/10 dark:text-sakura-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-mint-400 to-mint-500 text-[13px] font-semibold text-white shadow-[0_16px_30px_-18px_rgba(76,186,155,0.95)] transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        登录后台
      </button>

      {demo ? (
        <p className="rounded-xl bg-mint-50 px-3 py-2 text-[11px] leading-relaxed text-mint-600 dark:bg-mint-400/10 dark:text-mint-300">
          演示模式：账号 <b>{demoEmail}</b> / 密码 <b>{demoPassword}</b>。连接 PostgreSQL 后请使用数据库中的账号。
        </p>
      ) : null}
    </form>
  );
}
