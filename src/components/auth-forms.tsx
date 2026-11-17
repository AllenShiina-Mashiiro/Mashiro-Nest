"use client";

import { Loader2, Lock, Mail, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

function Field({
  icon,
  label,
  ...props
}: {
  icon: React.ReactNode;
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11.5px] font-semibold text-ink-500 dark:text-ink-300">
        {label}
      </span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300">
          {icon}
        </span>
        <input
          {...props}
          className="h-11 w-full rounded-xl border border-ink-200/80 bg-white/80 pl-9 pr-3 text-[13px] outline-none transition focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
        />
      </span>
    </label>
  );
}

export function LoginForm({
  redirectTo = "/",
  demo,
  demoEmail,
  demoPassword,
}: {
  redirectTo?: string;
  demo?: boolean;
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
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <Field
        icon={<Mail className="h-4 w-4" />}
        label="邮箱"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <Field
        icon={<Lock className="h-4 w-4" />}
        label="密码"
        type="password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="••••••••"
        autoComplete="current-password"
      />

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
        登录
      </button>

      {demo ? (
        <p className="rounded-xl bg-mint-50 px-3 py-2 text-[11px] leading-relaxed text-mint-600 dark:bg-mint-400/10 dark:text-mint-300">
          演示账号 <b>{demoEmail}</b> / <b>{demoPassword}</b>
        </p>
      ) : null}
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "注册失败");
        return;
      }
      router.replace(`/u/${form.username.toLowerCase()}`);
      router.refresh();
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <Field
        icon={<Mail className="h-4 w-4" />}
        label="邮箱"
        type="email"
        required
        value={form.email}
        onChange={(event) => setForm({ ...form, email: event.target.value })}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <Field
        icon={<UserRound className="h-4 w-4" />}
        label="用户名（用于主页地址，3-20 位字母数字）"
        required
        value={form.username}
        onChange={(event) => setForm({ ...form, username: event.target.value })}
        placeholder="mashiro"
        autoComplete="username"
      />
      <Field
        icon={<UserRound className="h-4 w-4" />}
        label="昵称（可随时修改）"
        value={form.displayName}
        onChange={(event) => setForm({ ...form, displayName: event.target.value })}
        placeholder="想让别人怎么称呼你"
      />
      <Field
        icon={<Lock className="h-4 w-4" />}
        label="密码（至少 6 位）"
        type="password"
        required
        value={form.password}
        onChange={(event) => setForm({ ...form, password: event.target.value })}
        placeholder="••••••••"
        autoComplete="new-password"
      />

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
        注册并登录
      </button>

      <p className="text-[10.5px] leading-relaxed text-ink-400">
        注册后可以写文章、发朋友圈、关注其他人；站点设置、用户管理等仍然只有站长可用。
      </p>
    </form>
  );
}
