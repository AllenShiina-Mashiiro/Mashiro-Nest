"use client";

import { GripVertical, ImagePlus, X } from "lucide-react";
import { useState } from "react";
import { MediaPicker } from "@/components/media-picker";

/**
 * 多图字段：缩略图列表 + 从媒体库追加 + 删除，提交时换行拼接给 Server Action。
 */
export function MultiMediaField({
  name,
  label,
  defaultValue = "",
  hint,
  max = 8,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  max?: number;
}) {
  const [images, setImages] = useState<string[]>(
    defaultValue
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  );
  const [open, setOpen] = useState(false);

  function add(url: string) {
    setImages((current) => (current.includes(url) ? current : [...current, url].slice(0, max)));
  }

  function remove(url: string) {
    setImages((current) => current.filter((item) => item !== url));
  }

  function move(index: number, direction: -1 | 1) {
    setImages((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div>
      <span className="mb-1 flex items-center justify-between text-[11px] font-semibold text-ink-400">
        <span>{label}</span>
        <span className="font-normal text-ink-300">
          {images.length}/{max} · 按天轮换
        </span>
      </span>

      <input type="hidden" name={name} value={images.join("\n")} />

      <div className="grid grid-cols-3 gap-2">
        {images.map((url, index) => (
          <div
            key={url}
            className="group relative overflow-hidden rounded-xl border border-ink-100 bg-ink-50 dark:border-white/10 dark:bg-white/5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="aspect-[16/10] w-full object-cover" />
            <span className="absolute left-1.5 top-1.5 rounded-md bg-black/45 px-1.5 py-0.5 text-[9.5px] font-semibold text-white">
              {index === 0 ? "主图" : `#${index + 1}`}
            </span>
            <div className="absolute inset-x-1 bottom-1 flex items-center justify-between opacity-0 transition group-hover:opacity-100">
              <span className="flex gap-0.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="rounded bg-white/85 px-1 text-[10px] text-ink-600 disabled:opacity-40"
                  aria-label="前移"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  className="rounded bg-white/85 px-1 text-[10px] text-ink-600 disabled:opacity-40"
                  aria-label="后移"
                >
                  →
                </button>
              </span>
              <button
                type="button"
                onClick={() => remove(url)}
                className="grid h-5 w-5 place-items-center rounded-full bg-white/90 text-sakura-500"
                aria-label="移除"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}

        {images.length < max ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid aspect-[16/10] place-items-center gap-1 rounded-xl border-2 border-dashed border-ink-200/80 text-ink-400 transition hover:border-mint-300 hover:bg-mint-50/40 dark:border-white/10 dark:hover:bg-white/[0.03]"
          >
            <ImagePlus className="h-4 w-4" />
            <span className="text-[10px]">添加图片</span>
          </button>
        ) : null}
      </div>

      {hint ? <p className="mt-1.5 text-[10px] leading-relaxed text-ink-300">{hint}</p> : null}

      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onPick={add}
        title={label}
      />

      <span className="mt-1 flex items-center gap-1 text-[9.5px] text-ink-300">
        <GripVertical className="h-2.5 w-2.5" />
        悬停缩略图可调整顺序或移除
      </span>
    </div>
  );
}
