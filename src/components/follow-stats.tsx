"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useState } from "react";
import { UserAvatar } from "@/components/user-avatar";
import type { PublicUser } from "@/lib/types";

type Tab = "followers" | "following";

export function FollowStats({
  followers,
  following,
  counts,
}: {
  followers: PublicUser[];
  following: PublicUser[];
  counts: { followers: number; following: number };
}) {
  const [open, setOpen] = useState<Tab | null>(null);
  const list = open === "followers" ? followers : following;

  return (
    <>
      <div className="flex items-center gap-4 text-[12px]">
        <button
          type="button"
          onClick={() => setOpen("followers")}
          className="transition hover:text-mint-500 dark:hover:text-mint-300"
        >
          <b className="text-[15px] text-ink-900 dark:text-white">{counts.followers}</b>
          <span className="ml-1 text-ink-400">粉丝</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen("following")}
          className="transition hover:text-mint-500 dark:hover:text-mint-300"
        >
          <b className="text-[15px] text-ink-900 dark:text-white">{counts.following}</b>
          <span className="ml-1 text-ink-400">关注</span>
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="关闭"
            onClick={() => setOpen(null)}
            className="absolute inset-0 bg-ink-950/45 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl dark:border-white/10 dark:bg-[#121722]">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-white/10">
              <div className="flex gap-1">
                {(["followers", "following"] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setOpen(tab)}
                    className={`rounded-full px-3 py-1 text-[11.5px] font-semibold transition ${
                      open === tab
                        ? "bg-mint-100 text-mint-600 dark:bg-mint-400/15 dark:text-mint-300"
                        : "text-ink-400 hover:text-ink-700"
                    }`}
                  >
                    {tab === "followers" ? `粉丝 ${counts.followers}` : `关注 ${counts.following}`}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-2">
              {list.length === 0 ? (
                <p className="py-12 text-center text-[11.5px] text-ink-400">
                  {open === "followers" ? "还没有粉丝" : "还没有关注任何人"}
                </p>
              ) : (
                list.map((user) => (
                  <Link
                    key={user.id}
                    href={`/u/${user.username}`}
                    onClick={() => setOpen(null)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-mint-50 dark:hover:bg-white/5"
                  >
                    <UserAvatar user={user} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold text-ink-800 dark:text-white/90">
                        {user.displayName}
                      </span>
                      <span className="block truncate text-[10.5px] text-ink-400">
                        @{user.username} · {user.bio || "这个人很懒"}
                      </span>
                    </span>
                    {user.role === "ADMIN" ? (
                      <span className="rounded-full bg-sakura-100 px-2 py-0.5 text-[9.5px] font-bold text-sakura-500 dark:bg-sakura-400/15 dark:text-sakura-300">
                        站长
                      </span>
                    ) : null}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
