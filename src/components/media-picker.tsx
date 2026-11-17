"use client";

import { Check, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/lib/types";

type Item = MediaItem & { used?: boolean };

/**
 * 媒体选择器：上传（服务端按 sha256 去重）或从媒体库挑一张，
 * 选中后把 URL 回传给调用方。
 */
export function MediaPicker({
  open,
  onClose,
  onPick,
  title = "插入图片",
}: {
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
  title?: string;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"library" | "upload">("library");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/media");
      const payload = (await response.json()) as { items?: Item[]; error?: string };
      if (!response.ok) setError(payload.error ?? "加载失败");
      else setItems(payload.items ?? []);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setError(null);
      void load();
    }
  }, [open, load]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files).slice(0, 6)) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/media", { method: "POST", body: form });
        const payload = (await response.json()) as { item?: Item; error?: string };
        if (!response.ok || !payload.item) {
          setError(payload.error ?? "上传失败");
          continue;
        }
        setItems((current) => [
          { ...payload.item!, used: false },
          ...current.filter((item) => item.key !== payload.item!.key),
        ]);
        onPick(payload.item.url);
        onClose();
        return;
      }
    } catch {
      setError("上传失败，请稍后再试");
    } finally {
      setUploading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="关闭"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
      />
      <div className="relative flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl dark:border-white/10 dark:bg-[#121722]">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5 dark:border-white/10">
          <h3 className="text-sm font-bold text-ink-900 dark:text-white">{title}</h3>
          <div className="flex items-center gap-1 rounded-full bg-ink-100/70 p-0.5 text-[11px] dark:bg-white/5">
            <button
              type="button"
              onClick={() => setTab("library")}
              className={`rounded-full px-3 py-1 font-semibold transition ${
                tab === "library"
                  ? "bg-white text-ink-800 shadow-sm dark:bg-white/15 dark:text-white"
                  : "text-ink-400"
              }`}
            >
              媒体库
            </button>
            <button
              type="button"
              onClick={() => setTab("upload")}
              className={`rounded-full px-3 py-1 font-semibold transition ${
                tab === "upload"
                  ? "bg-white text-ink-800 shadow-sm dark:bg-white/15 dark:text-white"
                  : "text-ink-400"
              }`}
            >
              上传
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error ? (
          <p className="mx-5 mt-3 rounded-xl bg-sakura-50 px-3 py-2 text-[11.5px] text-sakura-500 dark:bg-sakura-400/10 dark:text-sakura-300">
            {error}
          </p>
        ) : null}

        <div className="flex-1 overflow-y-auto p-5">
          {tab === "upload" ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void upload(event.dataTransfer.files);
              }}
              className="grid w-full place-items-center gap-2 rounded-2xl border-2 border-dashed border-ink-200/80 px-6 py-14 text-center transition hover:border-mint-300 hover:bg-mint-50/40 dark:border-white/10 dark:hover:bg-white/[0.03]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-mint-100 text-mint-500 dark:bg-mint-400/15 dark:text-mint-300">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </span>
              <span className="text-[13px] font-semibold text-ink-700 dark:text-white/90">
                {uploading ? "上传中…" : "点击或拖拽图片到这里"}
              </span>
              <span className="text-[11px] text-ink-400">
                PNG / JPEG / WebP / GIF / AVIF · 单张最大 8MB · 相同图片自动复用
              </span>
            </button>
          ) : (
            <>
              {loading ? (
                <p className="grid place-items-center py-16 text-[12px] text-ink-400">
                  <Loader2 className="mb-2 h-5 w-5 animate-spin" />
                  加载媒体库…
                </p>
              ) : items.length === 0 ? (
                <p className="grid place-items-center gap-2 py-16 text-[12px] text-ink-400">
                  <ImagePlus className="h-6 w-6" />
                  媒体库还是空的，切到「上传」传一张吧。
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {items.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        onPick(item.url);
                        onClose();
                      }}
                      className="group relative overflow-hidden rounded-xl border border-ink-100 bg-ink-50 text-left dark:border-white/10 dark:bg-white/5"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt=""
                        className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.03]"
                      />
                      <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white/85 text-mint-500 opacity-0 transition group-hover:opacity-100">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="block truncate px-2 py-1.5 font-mono text-[9.5px] text-ink-400">
                        {item.key.split("/").pop()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          multiple
          hidden
          onChange={(event) => void upload(event.target.files)}
        />
      </div>
    </div>
  );
}
