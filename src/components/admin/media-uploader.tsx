"use client";

import { CloudUpload, Copy, Check, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

type MediaItem = {
  key: string;
  url: string;
  size: number;
  lastModified: string | null;
};

export function MediaUploader({
  configured,
  initial,
}: {
  configured: boolean;
  initial: MediaItem[];
}) {
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function upload(file: File) {
    setError(null);
    setBusy(true);
    try {
      const presign = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      const payload = (await presign.json()) as {
        uploadUrl?: string;
        publicUrl?: string;
        key?: string;
        error?: string;
        hint?: string;
      };

      if (!presign.ok || !payload.uploadUrl) {
        setError(payload.hint ?? payload.error ?? "上传失败");
        return;
      }

      const put = await fetch(payload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!put.ok) {
        setError("上传到对象存储失败，请检查桶权限与 CORS 配置。");
        return;
      }

      setItems((current) => [
        {
          key: payload.key ?? file.name,
          url: payload.publicUrl ?? "",
          size: file.size,
          lastModified: new Date().toISOString(),
        },
        ...current,
      ]);
    } catch {
      setError("网络错误，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }

  function onFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 5)
      .forEach((file) => void upload(file));
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied(null), 1600);
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
          onFiles(event.dataTransfer.files);
        }}
        className={`relative grid place-items-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragging
            ? "border-mint-400 bg-mint-50 dark:bg-mint-400/10"
            : "border-ink-200/80 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => onFiles(event.target.files)}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={!configured || busy}
        />
        <span className="grid h-11 w-11 place-items-center rounded-full bg-mint-100 text-mint-500 dark:bg-mint-400/15 dark:text-mint-300">
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CloudUpload className="h-5 w-5" />
          )}
        </span>
        <p className="mt-2.5 text-[12.5px] font-semibold text-ink-700 dark:text-white/90">
          {busy ? "正在上传…" : "拖拽图片到这里，或点击选择"}
        </p>
        <p className="mt-1 text-[10.5px] text-ink-400">
          PNG / JPEG / WebP / GIF / SVG · 单次最多 5 张
        </p>
      </div>

      {error ? (
        <p className="flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.key}
            className="overflow-hidden rounded-2xl border border-ink-100 bg-white/80 dark:border-white/8 dark:bg-white/[0.04]"
          >
            <div className="aspect-[4/3] bg-ink-50 dark:bg-white/5">
              {item.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="p-2.5">
              <p className="truncate font-mono text-[10px] text-ink-400">{item.key}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[10px] text-ink-300">
                  {(item.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={() => void copy(item.url)}
                  className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] font-semibold text-mint-500 transition hover:bg-mint-50 dark:hover:bg-mint-400/10"
                >
                  {copied === item.url ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === item.url ? "已复制" : "复制地址"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-200/80 px-4 py-10 text-center text-[11.5px] text-ink-400 dark:border-white/10">
          还没有上传过图片。
        </p>
      ) : null}
    </div>
  );
}
