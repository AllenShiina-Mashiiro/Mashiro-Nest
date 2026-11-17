import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Plus, Trash2 } from "lucide-react";
import { deleteFriendAction, saveFriendAction } from "@/app/admin/actions";
import { getFriends } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "友人帐",
  robots: { index: false, follow: false },
};

function Fields({ friend }: { friend?: { name: string; url: string; avatar: string | null; description: string; color: string } }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1 block text-[10.5px] font-semibold text-ink-400">站点名称</span>
        <input
          name="name"
          required
          defaultValue={friend?.name ?? ""}
          className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[10.5px] font-semibold text-ink-400">链接</span>
        <input
          name="url"
          required
          defaultValue={friend?.url ?? ""}
          placeholder="https://"
          className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[10.5px] font-semibold text-ink-400">头像地址</span>
        <input
          name="avatar"
          defaultValue={friend?.avatar ?? ""}
          placeholder="留空则用首字母头像"
          className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[10.5px] font-semibold text-ink-400">主题色</span>
        <input
          name="color"
          type="color"
          defaultValue={friend?.color ?? "#7dd3b8"}
          className="h-[34px] w-full rounded-xl border border-ink-200/80 bg-white/70 px-1.5 dark:border-white/10 dark:bg-white/5"
        />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-[10.5px] font-semibold text-ink-400">一句话简介</span>
        <input
          name="description"
          defaultValue={friend?.description ?? ""}
          className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
        />
      </label>
    </div>
  );
}

export default async function FriendsAdminPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/admin");

  const friends = await getFriends();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-900 dark:text-white">友人帐</h1>
        <p className="mt-1 text-[11.5px] text-ink-400">
          共 {friends.length} 位朋友，修改后前台立即生效。
        </p>
      </div>

      <details className="rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]">
        <summary className="flex cursor-pointer items-center gap-1.5 text-[12.5px] font-bold text-mint-600 dark:text-mint-300">
          <Plus className="h-3.5 w-3.5" />
          添加朋友
        </summary>
        <form action={saveFriendAction} className="mt-3 space-y-3">
          <Fields />
          <button
            type="submit"
            className="rounded-full bg-gradient-to-br from-mint-400 to-mint-500 px-4 py-1.5 text-[11.5px] font-semibold text-white"
          >
            保存
          </button>
        </form>
      </details>

      <div className="space-y-2.5">
        {friends.map((friend) => (
          <details
            key={friend.id}
            className="rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]"
          >
            <summary className="flex cursor-pointer items-center gap-2.5">
              {friend.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={friend.avatar} alt="" className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <span
                  className="grid h-8 w-8 place-items-center rounded-lg text-[12px] font-bold text-white"
                  style={{ background: friend.color }}
                >
                  {friend.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold text-ink-800 dark:text-white/90">
                  {friend.name}
                </span>
                <span className="block truncate text-[10.5px] text-ink-400">{friend.url}</span>
              </span>
              <span className="text-[10.5px] text-ink-300">展开编辑</span>
            </summary>

            <form action={saveFriendAction} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={friend.id} />
              <Fields friend={friend} />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-full bg-mint-500 px-4 py-1.5 text-[11.5px] font-semibold text-white"
                >
                  保存修改
                </button>
              </div>
            </form>

            <form action={deleteFriendAction} className="mt-2">
              <input type="hidden" name="id" value={friend.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-full border border-sakura-200 px-3 py-1.5 text-[11px] font-semibold text-sakura-500 transition hover:bg-sakura-50 dark:border-sakura-400/30 dark:hover:bg-sakura-400/10"
              >
                <Trash2 className="h-3 w-3" />
                删除
              </button>
            </form>
          </details>
        ))}
      </div>
    </div>
  );
}
