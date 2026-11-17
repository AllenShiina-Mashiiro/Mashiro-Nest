import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import { saveProfileAction } from "@/app/admin/actions";
import { MediaField } from "@/components/admin/media-field";
import { StatusPicker } from "@/components/admin/status-picker";
import { UserAvatar } from "@/components/user-avatar";
import { getSession } from "@/lib/auth";
import { getUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "个人资料",
  robots: { index: false, follow: false },
};

const STATUS_PRESETS = ["写代码中", "玩游戏", "睡觉中", "加班中", "摸鱼中", "在旅行"];

export default async function ProfileSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const user = session ? await getUser(session.id) : null;

  if (!user) {
    return <p className="text-sm text-ink-400">请重新登录。</p>;
  }

  return (
    <form action={saveProfileAction} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size={48} />
          <div>
            <h1 className="text-xl font-bold text-ink-900 dark:text-white">个人资料</h1>
            <p className="mt-0.5 text-[11.5px] text-ink-400">
              头像、昵称与简介会同步到文章、动态与个人主页。
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/u/${user.username}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200/80 bg-white/70 px-3.5 py-2 text-[11.5px] font-semibold text-ink-500 transition hover:border-mint-300 hover:text-mint-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-300"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            查看主页
          </Link>
          <button
            type="submit"
            className="rounded-full bg-gradient-to-br from-mint-400 to-mint-500 px-4 py-2 text-[12px] font-semibold text-white shadow-[0_14px_26px_-16px_rgba(76,186,155,0.95)] transition hover:-translate-y-0.5"
          >
            保存
          </button>
        </div>
      </div>

      {params.saved ? (
        <p className="flex items-center gap-1.5 rounded-xl bg-mint-50 px-3 py-2 text-[11.5px] font-medium text-mint-600 dark:bg-mint-400/10 dark:text-mint-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          资料已更新。
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section className="space-y-3 rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">昵称</span>
              <input
                name="displayName"
                defaultValue={user.displayName}
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[12px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
            </label>
            <StatusPicker name="status" defaultValue={user.status} presets={STATUS_PRESETS} />
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">简介</span>
            <textarea
              name="bio"
              rows={3}
              defaultValue={user.bio}
              placeholder="一句话介绍自己"
              className="w-full resize-none rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[12px] leading-relaxed outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
          </label>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">位置</span>
              <input
                name="location"
                defaultValue={user.location ?? ""}
                placeholder="杭州"
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[12px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">个人网站</span>
              <input
                name="website"
                defaultValue={user.website ?? ""}
                placeholder="https://"
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[12px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">GitHub</span>
              <input
                name="github"
                defaultValue={user.github ?? ""}
                placeholder="https://github.com/…"
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[12px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">Telegram</span>
              <input
                name="telegram"
                defaultValue={user.telegram ?? ""}
                placeholder="https://t.me/…"
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[12px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
            </label>
          </div>

          <p className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-ink-400">
            <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
            用户名 <code className="font-mono">@{user.username}</code> 是主页地址的一部分，注册后不再修改。
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]">
          <h2 className="section-title">头像与主页背景</h2>
          <MediaField
            name="avatarUrl"
            label="头像"
            defaultValue={user.avatarUrl ?? ""}
            previewClassName="h-24 w-24"
          />
          <MediaField
            name="bannerUrl"
            label="主页横幅（B 站风格）"
            defaultValue={user.bannerUrl ?? ""}
          />
        </section>
      </div>
    </form>
  );
}
