import type { Metadata } from "next";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { MomentComposer, MomentTimeline } from "@/components/moments";
import { getSession } from "@/lib/auth";
import { getMoments } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "朋友圈",
  description: "零碎的想法、截图与日常。",
};

export default async function MomentsPage() {
  const session = await getSession();
  const moments = await getMoments(60, session?.id);

  return (
    <>
      <PageHeader
        eyebrow="Moments"
        title="朋友圈"
        description="比文章更短、更随意的一些记录。登录后可以直接发布，作者信息会同步显示。"
      />

      <div className="mx-auto max-w-[820px] px-4 pb-10">
        {session ? (
          <div className="mb-4">
            <MomentComposer session={session} />
          </div>
        ) : (
          <div className="card mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p className="text-[12px] text-ink-500 dark:text-ink-300">
              登录后可以发布、编辑和删除自己的动态。
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-mint-400 to-mint-500 px-3.5 py-1.5 text-[11.5px] font-semibold text-white"
            >
              <LogIn className="h-3 w-3" />
              登录 / 注册
            </Link>
          </div>
        )}

        <MomentTimeline
          moments={moments}
          currentUserId={session?.id}
          isAdmin={session?.role === "ADMIN"}
          currentUser={session}
        />

        {moments.length === 0 ? (
          <p className="card grid place-items-center py-16 text-xs text-ink-400">还没有动态。</p>
        ) : null}
      </div>
    </>
  );
}
