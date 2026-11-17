import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RegisterForm } from "@/components/auth-forms";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "注册",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(`/u/${session.username}`);

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-ink-400 transition hover:text-mint-500"
        >
          <ArrowLeft className="h-3 w-3" />
          返回站点
        </Link>

        <div className="card p-6">
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">注册</h1>
          <p className="mt-1.5 text-[12.5px] text-ink-400">
            一个账号即可写作、发动态、关注朋友。
          </p>

          <div className="mt-6">
            <RegisterForm />
          </div>

          <p className="mt-4 text-center text-[11.5px] text-ink-400">
            已经有账号？
            <Link href="/login" className="ml-1 font-semibold text-mint-500 hover:text-sakura-500">
              去登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
