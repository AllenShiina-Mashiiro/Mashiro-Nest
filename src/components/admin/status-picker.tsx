"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CUSTOM = "__custom__";

/**
 * 状态选择器：带样式的下拉菜单（替代浏览器原生的 datalist 弹窗），
 * 支持预设项 + 自定义输入，提交时写到隐藏 input。
 */
export function StatusPicker({
  name,
  defaultValue = "",
  presets,
  label = "状态",
}: {
  name: string;
  defaultValue?: string;
  presets: string[];
  label?: string;
}) {
  const initialIsPreset = presets.includes(defaultValue);
  const [value, setValue] = useState(defaultValue || presets[0] || "");
  const [custom, setCustom] = useState(Boolean(defaultValue) && !initialIsPreset);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <span className="mb-1 block text-[11px] font-semibold text-ink-400">{label}</span>
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-[38px] w-full items-center justify-between rounded-xl border border-ink-200/80 bg-white/70 px-2.5 text-left text-[12px] text-ink-700 outline-none transition hover:border-mint-300 focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
      >
        <span className="flex items-center gap-1.5 truncate">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mint-400" />
          {value || "选择状态"}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-ink-400 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-ink-100 bg-white p-1 shadow-[0_18px_40px_-24px_rgba(24,32,48,0.55)] dark:border-white/10 dark:bg-[#161c28]"
        >
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              role="option"
              aria-selected={!custom && value === preset}
              onClick={() => {
                setValue(preset);
                setCustom(false);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12px] text-ink-600 transition hover:bg-mint-50 dark:text-ink-200 dark:hover:bg-white/5"
            >
              {preset}
              {!custom && value === preset ? (
                <Check className="h-3.5 w-3.5 text-mint-500" />
              ) : null}
            </button>
          ))}

          <div className="my-1 h-px bg-ink-100 dark:bg-white/10" />

          <button
            type="button"
            onClick={() => {
              setCustom(true);
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12px] text-ink-500 transition hover:bg-mint-50 dark:text-ink-300 dark:hover:bg-white/5"
          >
            自定义…
            {custom ? <Check className="h-3.5 w-3.5 text-mint-500" /> : null}
          </button>
        </div>
      ) : null}

      {custom ? (
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={20}
          placeholder="输入自定义状态"
          className="mt-1.5 w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[12px] outline-none focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
        />
      ) : null}
    </div>
  );
}
