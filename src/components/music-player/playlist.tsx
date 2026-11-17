"use client";

import { Music } from "lucide-react";
import type { MusicTrack } from "@/types/music";

/** 歌单：当前曲目高亮，点击切歌。 */
export function Playlist({
  tracks,
  index,
  playing,
  onSelect,
}: {
  tracks: MusicTrack[];
  index: number;
  playing: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <ul className="mt-2 max-h-44 space-y-0.5 overflow-y-auto border-t border-ink-100 pt-2 dark:border-white/10">
      {tracks.map((track, i) => {
        const active = i === index;
        return (
          <li key={track.id}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={active ? "true" : undefined}
              className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition ${
                active
                  ? "bg-mint-50 text-mint-600 dark:bg-mint-400/10 dark:text-mint-300"
                  : "text-ink-600 hover:bg-ink-100/70 dark:text-ink-300 dark:hover:bg-white/5"
              }`}
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-white/70 font-mono text-[9.5px] text-ink-400 dark:bg-white/10">
                {active && playing ? (
                  <Music className="h-3 w-3 animate-pulse-soft" />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11.5px] font-medium">{track.title}</span>
                <span className="block truncate text-[10px] text-ink-400">{track.artist}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
