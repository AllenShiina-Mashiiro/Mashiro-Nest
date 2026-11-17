import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/auth-forms";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "登录",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/admin");

  const settings = await getSettings();

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={settings.loginBackground}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#141925]/75 via-[#1b2230]/55 to-[#3a2b3c]/70" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-mint-300 to-sakura-300 text-[12px] font-bold">
              {settings.siteName.slice(0, 1).toUpperCase()}
            </span>
            {settings.siteName}
          </Link>

          <div>
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10.5px] font-medium tracking-[0.16em] backdrop-blur">
              ADMIN CONSOLE
            </p>
            <h1 className="max-w-sm text-3xl font-bold leading-snug">
              在这里创作与管理文章。
            </h1>
            <p className="mt-3 max-w-sm text-[12.5px] leading-relaxed text-white/70">
              编辑文章内容、设置标签和封面，并管理发布状态。保存后，前台内容将自动更新。
            </p>
          </div>

          <p className="text-[10.5px] text-white/50">
            Next.js · Prisma · PostgreSQL · Redis · S3
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-ink-400 transition hover:text-mint-500"
          >
            <ArrowLeft className="h-3 w-3" />
            返回站点
          </Link>

          <h2 className="text-2xl font-bold text-ink-900 dark:text-white">登录后台</h2>
          <p className="mt-1.5 text-[12.5px] text-ink-400">
            使用你的账号继续，普通账号只能写作与发动态。
          </p>

          <div className="mt-6">
            <LoginForm
              redirectTo="/admin"
            />
          </div>

          <p className="mt-4 text-center text-[11.5px] text-ink-400">
            还没有账号？
            <Link href="/register" className="ml-1 font-semibold text-mint-500 hover:text-sakura-500">
              注册一个
            </Link>
          </p>

        </div>
      </main>
    </div>
  );
}
