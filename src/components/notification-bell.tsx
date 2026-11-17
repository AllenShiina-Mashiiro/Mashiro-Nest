"use client";

import { Bell, CheckCheck, Heart, MessageCircle, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { UserAvatar } from "@/components/user-avatar";
import type { NotificationItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const DOT: Record<string, string> = {
  like: "text-sakura-500",
  comment: "text-mint-500",
  comment_like: "text-sakura-500",
  follow: "text-sky-500",
};

export function NotificationBell({ initialUnread = 0 }: { initialUnread?: number }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // 实时：SSE 推送未读数；连不上时退回 60 秒轮询
  useEffect(() => {
    let source: EventSource | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;

    const poll = () => {
      void fetch("/api/notifications?unread=1")
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { count?: number } | null) => {
          if (data && typeof data.count === "number") setUnread(data.count);
        })
        .catch(() => undefined);
    };

    try {
      source = new EventSource("/api/notifications/stream");
      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { count?: number };
          if (typeof data.count === "number") setUnread(data.count);
        } catch {
          // 忽略心跳/格式异常
        }
      };
    } catch {
      timer = setInterval(poll, 60_000);
    }

    return () => {
      source?.close();
      if (timer) clearInterval(timer);
    };
  }, []);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) return;
      const data = (await response.json()) as { items: NotificationItem[]; count: number };
      setItems(data.items);
      setUnread(data.count);
    } finally {
      setLoading(false);
    }
  }

  async function markAll() {
    await fetch("/api/notifications", { method: "POST" });
    setItems((list) => list.map((item) => ({ ...item, read: true })));
    setUnread(0);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) {
            void load();
            // 打开即视为已读，但保留红点直到渲染完成
            setTimeout(() => void markAll(), 1200);
          }
        }}
        className="relative grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
        aria-label="通知"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-sakura-400 px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(88vw,340px)] overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_24px_60px_-30px_rgba(24,32,48,0.55)] dark:border-white/10 dark:bg-[#161c28]">
          <div className="flex items-center justify-between border-b border-ink-100 px-3 py-2 dark:border-white/10">
            <p className="text-[12px] font-bold text-ink-700 dark:text-white/90">通知</p>
            <button
              type="button"
              onClick={() => void markAll()}
              className="inline-flex items-center gap-1 text-[10.5px] text-ink-400 transition hover:text-mint-500"
            >
              <CheckCheck className="h-3 w-3" />
              全部已读
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <p className="px-3 py-6 text-center text-[11px] text-ink-400">加载中…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-8 text-center text-[11px] text-ink-400">
                还没有通知，等别人来点赞或评论吧。
              </p>
            ) : (
              items.map((item) => {
                const Icon =
                  item.type === "like" || item.type === "comment_like"
                    ? Heart
                    : item.type === "comment"
                      ? MessageCircle
                      : UserPlus;
                const href = item.commentId
                  ? `/moments#comment-${item.commentId}`
                  : item.momentId
                    ? `/moments#moment-${item.momentId}`
                    : item.type === "follow" && item.actor
                      ? `/u/${item.actor.username}`
                      : "/moments";
                return (
                  <Link
                    key={item.id}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-start gap-2.5 border-b border-ink-50 px-3 py-2.5 transition last:border-0 hover:bg-mint-50/60 dark:border-white/5 dark:hover:bg-white/5 ${
                      item.read ? "" : "bg-mint-50/40 dark:bg-mint-400/5"
                    }`}
                  >
                    <UserAvatar user={item.actor} size={26} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] leading-snug text-ink-600 dark:text-ink-200">
                        <span className="font-semibold text-ink-800 dark:text-white/90">
                          {item.actor?.displayName ?? "有人"}
                        </span>
                        {item.type === "like" ? " 赞了你的动态" : null}
                        {item.type === "comment" ? " 评论了你的动态" : null}
                        {item.type === "comment_like" ? " 赞了你的评论" : null}
                        {item.type === "follow" ? " 关注了你" : null}
                      </p>
                      {item.preview ? (
                        <p className="mt-0.5 line-clamp-1 text-[10.5px] text-ink-400">
                          {item.preview}
                        </p>
                      ) : null}
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-ink-300">
                        <Icon className={`h-3 w-3 ${DOT[item.type] ?? ""}`} />
                        {formatDate(item.createdAt, "readable")}
                      </p>
                    </div>
                    {item.read ? null : (
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sakura-400" />
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
