"use client";

import { ImagePlus } from "lucide-react";
import { useState } from "react";
import { MediaPicker } from "@/components/media-picker";

/** A form input paired with the media picker (works inside server-action forms). */
export function MediaField({
  name,
  label,
  defaultValue = "",
  placeholder = "/images/… 或 https://…",
  preview = true,
  aspect = "aspect-[16/9]",
  previewClassName,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  preview?: boolean;
  aspect?: string;
  previewClassName?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <span className="mb-1 block text-[11px] font-semibold text-ink-400">{label}</span>
      <div className="flex gap-2">
        <input
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none transition focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-xl bg-mint-50 text-mint-500 transition hover:bg-mint-100 dark:bg-mint-400/10"
          aria-label="从媒体库选择"
        >
          <ImagePlus className="h-4 w-4" />
        </button>
      </div>

      {preview && value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className={`mt-2 rounded-lg object-cover ring-1 ring-ink-100 dark:ring-white/10 ${
            previewClassName ?? `w-full ${aspect}`
          }`}
        />
      ) : null}

      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onPick={(url) => setValue(url)}
        title={label}
      />
    </div>
  );
}
