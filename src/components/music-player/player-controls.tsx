"use client";

import {
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { RepeatMode } from "@/types/music";

const baseButton =
  "grid h-8 w-8 place-items-center rounded-full text-ink-500 transition hover:bg-ink-100 hover:text-mint-500 dark:text-ink-300 dark:hover:bg-white/10";
const activeButton =
  "grid h-8 w-8 place-items-center rounded-full bg-mint-100 text-mint-600 transition hover:bg-mint-200 dark:bg-mint-400/15 dark:text-mint-300";

/** 上一首 / 播放暂停 / 下一首 + 循环、随机。 */
export function PlayerControls({
  playing,
  buffering,
  repeat,
  shuffle,
  onPrev,
  onToggle,
  onNext,
  onCycleRepeat,
  onToggleShuffle,
}: {
  playing: boolean;
  buffering: boolean;
  repeat: RepeatMode;
  shuffle: boolean;
  onPrev: () => void;
  onToggle: () => void;
  onNext: () => void;
  onCycleRepeat: () => void;
  onToggleShuffle: () => void;
}) {
  const repeatLabel =
    repeat === "one" ? "单曲循环" : repeat === "all" ? "列表循环" : "不循环";

  return (
    <div className="mt-1 flex items-center justify-between">
      <button
        type="button"
        onClick={onToggleShuffle}
        aria-label={shuffle ? "关闭随机播放" : "开启随机播放"}
        aria-pressed={shuffle}
        className={shuffle ? activeButton : baseButton}
      >
        <Shuffle className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-center gap-1">
        <button type="button" onClick={onPrev} aria-label="上一首" className={baseButton}>
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={playing ? "暂停" : "播放"}
          className="grid h-10 w-10 place-items-center rounded-full bg-mint-500 text-white shadow-[0_10px_24px_-12px_rgba(76,186,155,0.9)] transition hover:-translate-y-0.5 hover:bg-mint-400"
        >
          {buffering && playing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="ml-0.5 h-4 w-4" />
          )}
        </button>
        <button type="button" onClick={onNext} aria-label="下一首" className={baseButton}>
          <SkipForward className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onCycleRepeat}
        aria-label={`循环方式：${repeatLabel}`}
        title={repeatLabel}
        className={repeat === "off" ? baseButton : activeButton}
      >
        {repeat === "one" ? <Repeat1 className="h-3.5 w-3.5" /> : <Repeat className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
