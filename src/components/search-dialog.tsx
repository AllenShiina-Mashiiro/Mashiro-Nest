"use client";

import { ArrowRight, Loader2, MessageSquareText, Search, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { formatDate, truncate } from "@/lib/utils";

type PostHit = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string | null;
  author: string | null;
};
type MomentHit = { id: string; content: string; date: string; author: string | null };
type UserHit = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
};

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    posts: PostHit[];
    moments: MomentHit[];
    users: UserHit[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        const payload = await response.json();
        if (!cancelled) setResults(payload);
      } catch {
        if (!cancelled) setResults({ posts: [], moments: [], users: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const submit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const term = query.trim();
      if (!term) return;
      onClose();
      router.push(`/search?q=${encodeURIComponent(term)}`);
    },
    [onClose, query, router],
  );

  if (!open) return null;

  const empty =
    results &&
    results.posts.length === 0 &&
    results.moments.length === 0 &&
    results.users.length === 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[10vh]">
      <button
        type="button"
        aria-label="关闭搜索"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/45 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-float dark:border-white/10 dark:bg-[#121722]/95">
        <form
          onSubmit={submit}
          className="flex items-center gap-3 border-b border-ink-100 px-5 py-4 dark:border-white/10"
        >
          <Search className="h-4 w-4 text-ink-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索文章、动态或用户…"
            className="w-full bg-transparent text-sm text-ink-800 outline-none placeholder:text-ink-300 dark:text-white/90"
          />
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-mint-400" /> : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-1.5 py-1 text-[11px] font-semibold text-ink-400 ring-1 ring-ink-200 transition hover:text-ink-700 dark:ring-white/15"
          >
            ESC
          </button>
        </form>

        <div className="max-h-[54vh] overflow-y-auto p-2">
          {!results && !loading ? (
            <p className="px-4 py-8 text-center text-xs text-ink-400">
              输入关键词开始搜索，支持文章、动态与用户。
            </p>
          ) : null}

          {empty ? (
            <p className="px-4 py-8 text-center text-xs text-ink-400">
              没有找到「{query}」相关的内容。
            </p>
          ) : null}

          {results?.posts.length ? (
            <div className="mb-1">
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-300">
                文章
              </p>
              {results.posts.map((hit) => (
                <button
                  key={hit.slug}
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/posts/${hit.slug}`);
                  }}
                  className="group flex w-full items-start gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-mint-50 dark:hover:bg-white/5"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-800 dark:text-white/90">
                      {hit.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-400">
                      {formatDate(hit.date)}
                      {hit.category ? ` · ${hit.category}` : ""}
                      {hit.author ? ` · ${hit.author}` : ""}
                    </span>
                  </span>
                  <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-mint-400" />
                </button>
              ))}
            </div>
          ) : null}

          {results?.moments.length ? (
            <div className="mb-1">
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-300">
                动态
              </p>
              {results.moments.map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push("/moments");
                  }}
                  className="group flex w-full items-start gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-mint-50 dark:hover:bg-white/5"
                >
                  <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sakura-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] text-ink-700 dark:text-white/85">
                      {truncate(hit.content, 70)}
                    </span>
                    <span className="mt-0.5 block truncate text-[10.5px] text-ink-400">
                      {hit.author ?? "匿名"} · {formatDate(hit.date)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {results?.users.length ? (
            <div>
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-300">
                用户
              </p>
              {results.users.map((hit) => (
                <button
                  key={hit.username}
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/u/${hit.username}`);
                  }}
                  className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-mint-50 dark:hover:bg-white/5"
                >
                  <UserAvatar user={{ displayName: hit.displayName, avatarUrl: hit.avatarUrl }} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold text-ink-800 dark:text-white/90">
                      {hit.displayName}
                    </span>
                    <span className="block truncate text-[10.5px] text-ink-400">
                      @{hit.username} · {hit.bio || "这个人很懒"}
                    </span>
                  </span>
                  <UserRound className="h-3.5 w-3.5 shrink-0 text-ink-300" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-ink-100 px-5 py-2.5 text-[11px] text-ink-400 dark:border-white/10">
          <span>回车查看完整结果</span>
          <button type="button" onClick={onClose} className="flex items-center gap-1">
            关闭
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
