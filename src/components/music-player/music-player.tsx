"use client";

import { AlertCircle, Disc3, ListMusic, Music, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { MusicSettings } from "@/lib/settings";
import type { MusicTrack } from "@/types/music";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { PlayerControls } from "@/components/music-player/player-controls";
import { Playlist } from "@/components/music-player/playlist";
import { ProgressBar } from "@/components/music-player/progress-bar";
import { VolumeControl } from "@/components/music-player/volume-control";

/**
 * 网页音乐播放器：挂在 (site) 布局里，App Router 的布局在客户端导航时不会重新挂载，
 * 所以切页面能继续播放，且全程只有一个 audio 实例。
 * 曲目来源由后台设置决定：本地列表，或服务端代拉的网易云歌单。
 */
export function MusicPlayer({ settings }: { settings: MusicSettings }) {
  const [remote, setRemote] = useState<MusicTrack[] | null>(null);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings.enabled || settings.source !== "netease") return;
    let cancelled = false;

    void fetch("/api/music/tracks")
      .then(async (response) => {
        const payload = (await response.json()) as {
          tracks?: MusicTrack[];
          error?: string | null;
        };
        if (cancelled) return;
        setRemote(Array.isArray(payload.tracks) ? payload.tracks : []);
        setRemoteError(payload.error ?? null);
      })
      .catch(() => {
        if (!cancelled) setRemoteError("歌单加载失败，请检查后台的 Meting 接口设置");
      });

    return () => {
      cancelled = true;
    };
  }, [settings.enabled, settings.source]);

  const tracks = useMemo<MusicTrack[]>(() => {
    if (!settings.enabled) return [];
    if (settings.source === "netease") return remote ?? [];
    return settings.tracks;
  }, [remote, settings.enabled, settings.source, settings.tracks]);

  const player = useAudioPlayer({
    tracks,
    autoplay: settings.autoplay,
    loop: true,
    shuffle: settings.shuffle,
    volume: settings.volume,
  });

  const [open, setOpen] = useState(false);
  const [showList, setShowList] = useState(false);
  const [coverBroken, setCoverBroken] = useState(false);

  useEffect(() => {
    setCoverBroken(false);
  }, [player.track?.cover]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!settings.enabled || !player.track) return null;

  const track = player.track;
  const error = remoteError ?? player.error;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2 sm:right-6">
      {open ? (
        <section
          aria-label="音乐播放器"
          className="w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/70 bg-white/92 p-3.5 shadow-[0_18px_44px_-24px_rgba(26,31,43,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-[#151b27]/95"
        >
          <header className="flex items-start gap-2.5">
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-mint-100 text-mint-500 dark:bg-mint-400/15 dark:text-mint-300">
              {track.cover && !coverBroken ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={track.cover}
                  alt={`${track.title} 封面`}
                  className="h-full w-full object-cover"
                  onError={() => setCoverBroken(true)}
                />
              ) : (
                <Music className="h-5 w-5" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-ink-800 dark:text-white/90">
                {track.title}
              </p>
              <p className="mt-0.5 truncate text-[10.5px] text-ink-400">{track.artist || "未知歌手"}</p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="收起播放器"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 dark:hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </header>

          <div className="mt-2">
            <ProgressBar
              currentTime={player.currentTime}
              duration={player.duration}
              onSeek={player.seek}
            />
          </div>

          <PlayerControls
            playing={player.playing}
            buffering={player.buffering}
            repeat={player.repeat}
            shuffle={player.shuffle}
            onPrev={player.prev}
            onToggle={player.toggle}
            onNext={player.next}
            onCycleRepeat={player.cycleRepeat}
            onToggleShuffle={player.toggleShuffle}
          />

          <div className="mt-1.5 flex items-center gap-2">
            <VolumeControl
              volume={player.volume}
              muted={player.muted}
              onChange={player.setVolume}
              onToggleMute={player.toggleMute}
            />
            <button
              type="button"
              onClick={() => setShowList((current) => !current)}
              aria-label={showList ? "收起歌单" : "展开歌单"}
              aria-expanded={showList}
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg transition ${
                showList
                  ? "bg-mint-100 text-mint-600 dark:bg-mint-400/15 dark:text-mint-300"
                  : "text-ink-400 hover:bg-ink-100 hover:text-mint-500 dark:hover:bg-white/10"
              }`}
            >
              <ListMusic className="h-3.5 w-3.5" />
            </button>
          </div>

          {showList ? (
            <Playlist
              tracks={player.tracks}
              index={player.index}
              playing={player.playing}
              onSelect={(next) => player.selectTrack(next)}
            />
          ) : null}

          {error ? (
            <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              {error}
            </p>
          ) : null}
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "收起音乐播放器" : "打开音乐播放器"}
        aria-expanded={open}
        className="relative grid h-12 w-12 place-items-center rounded-full border border-white/70 bg-white/85 text-mint-500 shadow-[0_12px_30px_-16px_rgba(26,31,43,0.6)] backdrop-blur-md transition hover:-translate-y-0.5 hover:text-mint-600 dark:border-white/10 dark:bg-[#151b27]/90 dark:text-mint-300"
      >
        <Disc3 className={`h-5 w-5 ${player.playing ? "animate-[spin_6s_linear_infinite]" : ""}`} />
        {player.playing ? (
          <span className="absolute right-1 top-1 h-2 w-2 animate-pulse-soft rounded-full bg-mint-400" />
        ) : null}
      </button>
    </div>
  );
}
