"use client";

import { Check, Copy, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { MediaItem } from "@/lib/types";

type Item = MediaItem & { used?: boolean; copies?: number };

export function MediaLibrary({
  initial,
  canDelete,
}: {
  initial: Item[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files).slice(0, 8)) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/media", { method: "POST", body: form });
        const payload = (await response.json()) as { item?: Item; error?: string };
        if (!response.ok || !payload.item) {
          setError(payload.error ?? "上传失败");
          continue;
        }
        setItems((current) => {
          const exists = current.some((item) => item.key === payload.item!.key);
          if (exists) return current;
          return [{ ...payload.item!, used: false, copies: 1 }, ...current];
        });
      }
      router.refresh();
    } catch {
      setError("上传失败，请稍后再试");
    } finally {
      setBusy(false);
    }
  }

  async function remove(key: string) {
    if (!window.confirm("删除这个文件？如果它仍被文章引用，图片会失效。")) return;
    setBusy(true);
    try {
      await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      setItems((current) => current.filter((item) => item.key !== key));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("浏览器不允许访问剪贴板，请手动复制。");
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void upload(event.dataTransfer.files);
        }}
        className={`relative grid place-items-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragging
            ? "border-mint-400 bg-mint-50 dark:bg-mint-400/10"
            : "border-ink-200/80 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          multiple
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(event) => void upload(event.target.files)}
          disabled={busy}
        />
        <span className="grid h-11 w-11 place-items-center rounded-full bg-mint-100 text-mint-500 dark:bg-mint-400/15 dark:text-mint-300">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        </span>
        <p className="mt-2.5 text-[12.5px] font-semibold text-ink-700 dark:text-white/90">
          {busy ? "处理中…" : "拖拽图片到这里，或点击选择"}
        </p>
        <p className="mt-1 text-[10.5px] text-ink-400">
          按内容哈希命名并自动去重 · 相同图片只存一份
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="overflow-hidden rounded-2xl border border-ink-100 bg-white/80 dark:border-white/8 dark:bg-white/[0.04]"
          >
            <div className="relative aspect-[4/3] bg-ink-50 dark:bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" className="h-full w-full object-cover" />
              <span
                className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9.5px] font-bold ${
                  item.used
                    ? "bg-mint-100/90 text-mint-600 dark:bg-mint-400/25 dark:text-mint-200"
                    : "bg-amber-100/90 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200"
                }`}
              >
                {item.used ? "使用中" : "孤儿文件"}
              </span>
            </div>
            <div className="p-2.5">
              <p className="truncate font-mono text-[9.5px] text-ink-400">{item.key}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[10px] text-ink-300">
                  {(item.size / 1024).toFixed(0)} KB
                </span>
                <span className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => void copy(item.url)}
                    className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] font-semibold text-mint-500 transition hover:bg-mint-50 dark:hover:bg-mint-400/10"
                  >
                    {copied === item.url ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === item.url ? "已复制" : "地址"}
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => void remove(item.key)}
                      className="grid h-6 w-6 place-items-center rounded-lg text-ink-300 transition hover:bg-sakura-50 hover:text-sakura-500 dark:hover:bg-sakura-400/10"
                      aria-label="删除"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  ) : null}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="grid place-items-center gap-2 rounded-2xl border border-dashed border-ink-200/80 px-4 py-14 text-center text-[11.5px] text-ink-400 dark:border-white/10">
          <ImagePlus className="h-6 w-6" />
          媒体库还是空的，上传第一张图片吧。
        </p>
      ) : null}
    </div>
  );
}
