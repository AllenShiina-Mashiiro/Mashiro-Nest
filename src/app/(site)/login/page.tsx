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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  if (session) redirect(params.next ?? "/");

  const settings = await getSettings();

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={settings.loginBackground}
          alt=""
          className="h-full w-full object-cover opacity-45 blur-[2px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-paper/70 via-paper/80 to-paper dark:from-night/80 dark:via-night/85 dark:to-night" />
      </div>

      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-ink-400 transition hover:text-mint-500"
        >
          <ArrowLeft className="h-3 w-3" />
          返回站点
        </Link>

        <div className="card p-6">
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">登录</h1>
          <p className="mt-1.5 text-[12.5px] text-ink-400">
            登录后可以写文章、发朋友圈、关注其他人。
          </p>

          <div className="mt-6">
            <LoginForm
              redirectTo={params.next ?? "/"}
            />
          </div>

          <p className="mt-4 text-center text-[11.5px] text-ink-400">
            还没有账号？
            <Link href="/register" className="ml-1 font-semibold text-mint-500 hover:text-sakura-500">
              注册一个
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
