"use client";

import { Volume1, Volume2, VolumeX } from "lucide-react";

/** 音量：滑杆 + 一键静音。 */
export function VolumeControl({
  volume,
  muted,
  onChange,
  onToggleMute,
}: {
  volume: number;
  muted: boolean;
  onChange: (value: number) => void;
  onToggleMute: () => void;
}) {
  const Icon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? "取消静音" : "静音"}
        aria-pressed={muted}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-mint-500 dark:hover:bg-white/10"
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={muted ? 0 : volume}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="音量"
        className="h-1 w-full cursor-pointer accent-mint-500"
      />
    </div>
  );
}
