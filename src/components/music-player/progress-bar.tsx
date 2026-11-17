"use client";

import { formatTime } from "@/lib/music";

/** 播放进度：原生 range 保证键盘与读屏可用，样式交给 accent-color。 */
export function ProgressBar({
  currentTime,
  duration,
  onSeek,
}: {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}) {
  const max = duration > 0 ? duration : 0;
  const value = Math.min(currentTime, max);

  return (
    <div>
      <input
        type="range"
        min={0}
        max={max}
        step={0.1}
        value={value}
        disabled={max === 0}
        onChange={(event) => onSeek(Number(event.target.value))}
        aria-label="播放进度"
        className="h-1.5 w-full cursor-pointer accent-mint-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="mt-0.5 flex items-center justify-between text-[10px] tabular-nums text-ink-400 dark:text-ink-500">
        <span>{formatTime(value)}</span>
        <span>{formatTime(max)}</span>
      </div>
    </div>
  );
}
