"use client";

import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function FollowButton({
  userId,
  initialFollowing,
  initialFollowers,
  isSelf,
  loggedIn,
}: {
  userId: string;
  initialFollowing: boolean;
  initialFollowers: number;
  isSelf: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(initialFollowers);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isSelf) {
    return (
      <span className="rounded-full border border-ink-200/70 px-4 py-1.5 text-[11.5px] font-semibold text-ink-400 dark:border-white/10">
        这是你自己
      </span>
    );
  }

  async function toggle() {
    if (!loggedIn) {
      router.push("/login?next=" + encodeURIComponent(location.pathname));
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: following ? "unfollow" : "follow" }),
      });
      const payload = (await response.json()) as {
        following?: boolean;
        followers?: number;
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? "操作失败");
        return;
      }
      setFollowing(Boolean(payload.following));
      if (typeof payload.followers === "number") setFollowers(payload.followers);
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={pending}
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11.5px] font-semibold transition disabled:opacity-60 ${
          following
            ? "border border-ink-200/80 bg-white/70 text-ink-500 hover:border-sakura-200 hover:text-sakura-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-300"
            : "bg-gradient-to-br from-mint-400 to-mint-500 text-white shadow-[0_12px_24px_-14px_rgba(76,186,155,0.95)] hover:-translate-y-0.5"
        }`}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : following ? (
          <UserCheck className="h-3.5 w-3.5" />
        ) : (
          <UserPlus className="h-3.5 w-3.5" />
        )}
        {following ? "已关注" : "关注"}
        <span className="opacity-70">{followers}</span>
      </button>
      {error ? <span className="text-[10px] text-sakura-500">{error}</span> : null}
    </div>
  );
}
