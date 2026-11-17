import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Trash2, Users } from "lucide-react";
import { deleteUserAction } from "@/app/admin/actions";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { UserAvatar } from "@/components/user-avatar";
import { getSession } from "@/lib/auth";
import { listUsers } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "用户管理",
  robots: { index: false, follow: false },
};

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; error?: string }>;
}) {
  const params = await searchParams;
  const [users, session] = await Promise.all([listUsers(), getSession()]);
  if (session?.role !== "ADMIN") redirect("/admin");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-white">用户</h1>
          <p className="mt-1 text-[12px] text-ink-400">
            共 {users.length} 位 · 普通用户可以写文章、发动态、关注，但碰不到站点设置。
          </p>
        </div>
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-200/80 bg-white/70 px-4 py-2 text-[11.5px] font-semibold text-ink-500 transition hover:border-mint-300 hover:text-mint-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-300"
        >
          <Users className="h-3.5 w-3.5" />
          注册页
        </Link>
      </div>

      {params.error === "self" ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11.5px] font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
          不能删除当前登录的账号。
        </p>
      ) : null}

      {params.error === "admin" ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11.5px] font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
          管理员账号受保护，不能删除。
        </p>
      ) : null}

      {params.deleted ? (
        <p className="rounded-xl bg-ink-100/70 px-3 py-2 text-[11.5px] font-medium text-ink-600 dark:bg-white/5 dark:text-ink-300">
          账号已删除，其文章与动态一并移除。
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white/80 dark:border-white/8 dark:bg-white/[0.04]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[12px]">
            <thead className="bg-ink-50/60 text-[10.5px] uppercase tracking-wide text-ink-400 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">用户</th>
                <th className="px-3 py-2.5 font-semibold">角色</th>
                <th className="px-3 py-2.5 text-right font-semibold">文章</th>
                <th className="px-3 py-2.5 text-right font-semibold">粉丝</th>
                <th className="px-3 py-2.5 font-semibold">加入时间</th>
                <th className="px-4 py-2.5 text-right font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100/80 dark:divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="transition hover:bg-mint-50/40 dark:hover:bg-white/[0.03]">
                  <td className="px-4 py-2.5">
                    <Link href={`/u/${user.username}`} className="flex items-center gap-2.5">
                      <UserAvatar user={user} size={30} />
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] font-semibold text-ink-800 dark:text-white/90">
                          {user.displayName}
                        </span>
                        <span className="block truncate text-[10px] text-ink-400">
                          @{user.username}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        user.role === "ADMIN"
                          ? "bg-sakura-100 text-sakura-500 dark:bg-sakura-400/15 dark:text-sakura-300"
                          : "bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-300"
                      }`}
                    >
                      {user.role === "ADMIN" ? <Shield className="h-2.5 w-2.5" /> : null}
                      {user.role === "ADMIN" ? "站长" : "用户"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink-400">{user.postCount}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink-400">{user.followers}</td>
                  <td className="px-3 py-2.5 text-ink-400">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    {user.username === session?.username ? (
                      <span className="text-[10.5px] text-ink-300">当前账号</span>
                    ) : user.role === "ADMIN" ? (
                      <span className="text-[10.5px] text-ink-300">管理员受保护</span>
                    ) : (
                      <ConfirmForm
                        action={deleteUserAction}
                        message={`删除 @${user.username}？TA 的文章、动态与关注关系都会一起删除。`}
                        fields={{ id: user.id }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-semibold text-ink-400 transition hover:bg-sakura-50 hover:text-sakura-500 dark:hover:bg-sakura-400/10"
                        >
                          <Trash2 className="h-3 w-3" />
                          删除
                        </button>
                      </ConfirmForm>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
