"use client";

import {
  Heart,
  ImagePlus,
  Loader2,
  MapPin,
  MessageCircle,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MediaPicker } from "@/components/media-picker";
import { UserAvatar } from "@/components/user-avatar";
import type { Moment, PublicUser } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Session = { id: string; displayName: string; username: string; avatarUrl: string | null; role: string };

function toUser(session: Session): PublicUser {
  return {
    id: session.id,
    username: session.username,
    displayName: session.displayName,
    role: session.role === "ADMIN" ? "ADMIN" : "USER",
    avatarUrl: session.avatarUrl,
    bannerUrl: null,
    bio: "",
    status: "",
    location: null,
    website: null,
    github: null,
    telegram: null,
    createdAt: new Date().toISOString(),
    followers: 0,
    following: 0,
    postCount: 0,
    momentCount: 0,
  };
}

export function MomentComposer({ session }: { session: Session }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!content.trim()) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, images, location: location.trim() || null }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "发布失败");
        return;
      }
      setContent("");
      setImages([]);
      setLocation("");
      router.refresh();
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <UserAvatar user={toUser(session)} size={38} />
        <div className="min-w-0 flex-1">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            placeholder="今天想说点什么…"
            className="w-full resize-none rounded-xl border border-ink-200/70 bg-white/70 px-3 py-2 text-[13px] leading-relaxed text-ink-700 outline-none transition focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
          />

          {images.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((image) => (
                <span key={image} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover ring-1 ring-white/60 dark:ring-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setImages((current) => current.filter((item) => item !== image))}
                    className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-ink-900 text-white"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-ink-200/70 px-2 py-1 text-[11px] text-ink-500 transition hover:border-mint-300 hover:text-mint-500 dark:border-white/10 dark:text-ink-300"
            >
              <ImagePlus className="h-3 w-3" />
              图片
            </button>

            <label className="inline-flex items-center gap-1 rounded-lg border border-ink-200/70 px-2 py-1 text-[11px] text-ink-500 focus-within:border-mint-300 dark:border-white/10 dark:text-ink-300">
              <MapPin className="h-3 w-3" />
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                list="moment-locations"
                placeholder="地点"
                className="w-24 bg-transparent text-[11px] outline-none placeholder:text-ink-300"
              />
            </label>
            <datalist id="moment-locations">
              {["杭州", "西湖", "家", "公司", "路上"].map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>

            <span className="ml-auto text-[10.5px] text-ink-300">{content.length}/2000</span>

            <button
              type="button"
              onClick={() => void submit()}
              disabled={pending || !content.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-mint-400 to-mint-500 px-3.5 py-1.5 text-[11.5px] font-semibold text-white shadow-[0_12px_24px_-14px_rgba(76,186,155,0.95)] transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              发布
            </button>
          </div>

          {error ? <p className="mt-2 text-[11px] text-sakura-500">{error}</p> : null}
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(url) => setImages((current) => [...current, url].slice(0, 9))}
        title="插入图片"
      />
    </div>
  );
}

function MomentInteractions({
  moment,
  currentUser,
  isAdmin,
}: {
  moment: Moment;
  currentUser: Session | null;
  isAdmin: boolean;
}) {
  const [liked, setLiked] = useState(moment.likedByMe);
  const [count, setCount] = useState(moment.likeCount);
  const [comments, setComments] = useState(moment.comments);
  const [open, setOpen] = useState(moment.comments.length > 0);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  async function toggleLike() {
    if (!currentUser) {
      setError("登录后才能点赞");
      setOpen(true);
      return;
    }
    const next = !liked;
    setError(null);
    setLiked(next);
    setCount((value) => Math.max(0, value + (next ? 1 : -1)));
    try {
      const response = await fetch("/api/moments/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ momentId: moment.id }),
      });
      if (!response.ok) throw new Error("LIKE_FAILED");
      const data = (await response.json()) as { liked: boolean; count: number };
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      setLiked(!next);
      setCount((value) => Math.max(0, value + (next ? -1 : 1)));
      setError("点赞失败，请稍后再试");
    }
  }

  async function submitComment() {
    if (!currentUser || !draft.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/moments/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ momentId: moment.id, content: draft.trim() }),
      });
      const data = (await response.json()) as {
        comment?: { id: string; content: string; createdAt: string; author: PublicUser | null };
        error?: string;
      };
      if (!response.ok || !data.comment) throw new Error(data.error ?? "发送失败");
      setComments((list) => [...list, data.comment!]);
      setDraft("");
      setOpen(true);
    } catch (caught) {
      setError((caught as Error).message || "发送失败");
    } finally {
      setSending(false);
    }
  }

  async function removeComment(id: string) {
    if (!window.confirm("撤回这条评论？")) return;
    const response = await fetch(`/api/moments/comment?id=${id}`, { method: "DELETE" });
    if (response.ok) {
      setComments((list) => list.filter((item) => item.id !== id));
      if (editingComment === id) setEditingComment(null);
    }
  }

  async function saveComment(id: string) {
    const text = editDraft.trim();
    if (!text) return;
    const response = await fetch("/api/moments/comment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, content: text }),
    });
    const data = (await response.json()) as {
      comment?: { id: string; content: string; createdAt: string; author: PublicUser | null };
      error?: string;
    };
    if (!response.ok || !data.comment) {
      setError(data.error ?? "修改失败");
      return;
    }
    setComments((list) => list.map((item) => (item.id === id ? data.comment! : item)));
    setEditingComment(null);
    setError(null);
  }

  return (
    <div className="mt-3 border-t border-ink-100 pt-2.5 dark:border-white/8">
      <div className="flex items-center gap-4 text-[11.5px]">
        <button
          type="button"
          onClick={() => void toggleLike()}
          aria-pressed={liked}
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition ${
            liked
              ? "bg-sakura-50 text-sakura-500 dark:bg-sakura-400/10 dark:text-sakura-300"
              : "text-ink-400 hover:bg-ink-100/70 hover:text-ink-600 dark:hover:bg-white/8 dark:hover:text-ink-200"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
          {count > 0 ? count : "赞"}
        </button>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-ink-400 transition hover:bg-ink-100/70 hover:text-ink-600 dark:hover:bg-white/8 dark:hover:text-ink-200"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {comments.length > 0 ? comments.length : "评论"}
        </button>
      </div>

      {open ? (
        <div className="mt-2 space-y-1.5">
          {comments.map((comment) => {
            const mine = comment.author?.id === currentUser?.id;
            const canManage = isAdmin || mine;
            const editing = editingComment === comment.id;
            return (
              <div
                key={comment.id}
                className="group flex items-start gap-2 rounded-xl bg-ink-50/70 px-2.5 py-1.5 dark:bg-white/5"
              >
                <UserAvatar user={comment.author} size={20} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-ink-400">
                    <span className="font-semibold text-ink-600 dark:text-ink-200">
                      {comment.author?.displayName ?? "匿名"}
                    </span>
                    <span className="ml-1">{formatDate(comment.createdAt, "readable")}</span>
                  </p>

                  {editing ? (
                    <div className="mt-1">
                      <input
                        value={editDraft}
                        onChange={(event) => setEditDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                            event.preventDefault();
                            void saveComment(comment.id);
                          }
                          if (event.key === "Escape") setEditingComment(null);
                        }}
                        maxLength={500}
                        autoFocus
                        className="h-7 w-full rounded-lg border border-mint-300 bg-white px-2 text-[11.5px] outline-none dark:bg-white/10 dark:text-white/90"
                      />
                      <div className="mt-1 flex gap-1">
                        <button
                          type="button"
                          onClick={() => void saveComment(comment.id)}
                          className="rounded-md bg-mint-500 px-2 py-0.5 text-[10px] font-semibold text-white"
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingComment(null)}
                          className="rounded-md px-2 py-0.5 text-[10px] text-ink-400"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line text-[12px] leading-relaxed text-ink-600 dark:text-ink-200/90">
                      {comment.content}
                    </p>
                  )}
                </div>

                {canManage && !editing ? (
                  <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingComment(comment.id);
                        setEditDraft(comment.content);
                      }}
                      className="rounded p-0.5 text-ink-300 transition hover:text-mint-500"
                      aria-label="修改评论"
                      title="修改"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeComment(comment.id)}
                      className="rounded p-0.5 text-ink-300 transition hover:text-sakura-500"
                      aria-label="撤回评论"
                      title="撤回"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : null}
              </div>
            );
          })}

          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    void submitComment();
                  }
                }}
                maxLength={500}
                placeholder="友善地评论一句…"
                className="h-8 flex-1 rounded-full border border-ink-200/80 bg-white/80 px-3 text-[11.5px] outline-none transition focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
              <button
                type="button"
                onClick={() => void submitComment()}
                disabled={sending || !draft.trim()}
                className="grid h-8 w-8 place-items-center rounded-full bg-mint-400 text-white transition hover:bg-mint-500 disabled:opacity-40"
                aria-label="发送评论"
              >
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          ) : (
            <p className="text-[10.5px] text-ink-400">登录后可以点赞和评论。</p>
          )}

          {error ? <p className="text-[10.5px] text-sakura-500">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function MomentTimeline({
  moments,
  currentUserId,
  isAdmin,
  currentUser = null,
}: {
  moments: Moment[];
  currentUserId?: string;
  isAdmin?: boolean;
  currentUser?: Session | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);

  async function save(id: string) {
    if (!draft.trim()) return;
    setPending(true);
    try {
      const moment = moments.find((item) => item.id === id);
      await fetch("/api/moments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          content: draft,
          images: moment?.images ?? [],
          location: moment?.location ?? null,
        }),
      });
      setEditing(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("删除这条动态？")) return;
    await fetch("/api/moments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <div className="relative space-y-4 border-l border-ink-200/70 pl-6 dark:border-white/10">
      {moments.map((moment, index) => {
        const mine = currentUserId && moment.author?.id === currentUserId;
        const canEdit = mine || isAdmin;
        return (
          <article
            key={moment.id}
            id={`moment-${moment.id}`}
            style={{ animationDelay: `${index * 50}ms` }}
            className="card-soft relative scroll-mt-28 animate-fade-up p-4 transition target:ring-2 target:ring-mint-300/70"
          >
            <span className="absolute -left-[31px] top-5 grid h-4 w-4 place-items-center rounded-full border-2 border-white bg-mint-300 dark:border-night dark:bg-mint-400">
              <span className="h-1 w-1 rounded-full bg-white" />
            </span>

            <div className="flex items-start gap-2.5">
              <UserAvatar user={moment.author} size={32} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-ink-400">
                  <span className="text-[12px] font-semibold text-ink-700 dark:text-white/85">
                    {moment.author?.displayName ?? "匿名"}
                  </span>
                  <span>@{moment.author?.username ?? "unknown"}</span>
                  <span>·</span>
                  <span>{formatDate(moment.createdAt, "readable")}</span>
                  {moment.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {moment.location}
                    </span>
                  ) : null}

                  {canEdit ? (
                    <span className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(moment.id);
                          setDraft(moment.content);
                        }}
                        className="grid h-6 w-6 place-items-center rounded-md text-ink-300 transition hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-white/10"
                        aria-label="编辑"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(moment.id)}
                        className="grid h-6 w-6 place-items-center rounded-md text-ink-300 transition hover:bg-sakura-50 hover:text-sakura-500 dark:hover:bg-sakura-400/10"
                        aria-label="删除"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null}
                </div>

                {editing === moment.id ? (
                  <div className="mt-2">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-mint-300 bg-white/80 px-3 py-2 text-[12.5px] outline-none dark:bg-white/5 dark:text-white/90"
                    />
                    <div className="mt-1.5 flex gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => void save(moment.id)}
                        className="rounded-lg bg-mint-500 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="rounded-lg px-3 py-1 text-[11px] text-ink-400"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-ink-600 dark:text-ink-200/90">
                    {moment.content}
                  </p>
                )}

                {moment.images.length ? (
                  <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {moment.images.map((image) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={image}
                        src={image}
                        alt=""
                        loading="lazy"
                        className="aspect-[4/3] w-full rounded-xl object-cover ring-1 ring-white/60 dark:ring-white/10"
                      />
                    ))}
                  </div>
                ) : null}

                <MomentInteractions
                  moment={moment}
                  currentUser={currentUser}
                  isAdmin={Boolean(isAdmin)}
                />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
