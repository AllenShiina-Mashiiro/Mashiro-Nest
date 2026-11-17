"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clampVolume, pickShuffleIndex } from "@/lib/music";
import type { MusicTrack, RepeatMode } from "@/types/music";

const STORAGE_KEY = "mashiro:music";

type StoredState = {
  volume?: number;
  muted?: boolean;
  repeat?: RepeatMode;
  shuffle?: boolean;
  index?: number;
};

export type UseAudioPlayerOptions = {
  tracks: MusicTrack[];
  autoplay?: boolean;
  loop?: boolean;
  shuffle?: boolean;
  volume?: number;
};

/**
 * 播放器状态机：只创建一个 HTMLAudioElement（模块内单实例），
 * 通过 audio 自身的事件驱动 UI，避免"状态和真实播放不同步"。
 * 卸载时暂停、解绑、清空 src，防止返回页面后继续出声或内存泄漏。
 */
export function useAudioPlayer({
  tracks,
  autoplay = false,
  loop = false,
  shuffle = false,
  volume = 0.7,
}: UseAudioPlayerOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** 下一次 src 变化后是否要自动播放（切歌时置 true） */
  const wantPlayRef = useRef(autoplay);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volumeState, setVolumeState] = useState(() => clampVolume(volume));
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>(loop ? "all" : "off");
  const [shuffleOn, setShuffleOn] = useState(shuffle);
  const [error, setError] = useState<string | null>(null);

  const track: MusicTrack | null = tracks[index] ?? null;

  // 1) 只创建一次 audio 实例，并恢复上次的音量等偏好
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onPlay = () => {
      setPlaying(true);
      setError(null);
    };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onError = () => {
      setBuffering(false);
      setPlaying(false);
      setError("音频加载失败：请检查文件是否存在、格式是否被浏览器支持。");
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("error", onError);

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as StoredState;
        if (typeof saved.volume === "number") {
          const nextVolume = clampVolume(saved.volume);
          setVolumeState(nextVolume);
          audio.volume = nextVolume;
        }
        if (typeof saved.muted === "boolean") {
          setMuted(saved.muted);
          audio.muted = saved.muted;
        }
        if (saved.repeat === "off" || saved.repeat === "all" || saved.repeat === "one") {
          setRepeat(saved.repeat);
        }
        if (typeof saved.shuffle === "boolean") setShuffleOn(saved.shuffle);
        if (
          typeof saved.index === "number" &&
          Number.isInteger(saved.index) &&
          saved.index >= 0 &&
          saved.index < tracks.length
        ) {
          setIndex(saved.index);
        }
      }
    } catch {
      // 本地存储不可用（隐私模式等）时静默降级
    }

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
    // tracks 只在首屏读取一次用于校验下标，后续切歌由下面的 effect 负责
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) 切歌：换 src，并在需要时接着播
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;

    const absolute = new URL(track.url, window.location.href).href;
    if (audio.src === absolute) {
      if (wantPlayRef.current) {
        wantPlayRef.current = false;
        void audio.play().catch(() => {
          setError("浏览器阻止了自动播放，请点一下播放按钮。");
        });
      }
      return;
    }

    audio.src = absolute;
    setCurrentTime(0);
    setDuration(0);
    setError(null);

    if (wantPlayRef.current) {
      wantPlayRef.current = false;
      void audio.play().catch(() => {
        setError("浏览器阻止了自动播放，请点一下播放按钮。");
      });
    }
  }, [track]);

  // 3) 音量 / 静音同步到 audio
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volumeState;
  }, [volumeState]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.muted = muted;
  }, [muted]);

  // 4) 一首放完后的行为：单曲循环 -> 列表循环 -> 随机 -> 停止
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      const total = tracks.length;
      if (total === 0) return;

      if (repeat === "one") {
        audio.currentTime = 0;
        void audio.play().catch(() => setError("浏览器阻止了自动播放，请点一下播放按钮。"));
        return;
      }

      if (shuffleOn) {
        wantPlayRef.current = true;
        setIndex(pickShuffleIndex(index, total));
        return;
      }

      if (index + 1 < total) {
        wantPlayRef.current = true;
        setIndex(index + 1);
        return;
      }

      if (repeat === "all") {
        wantPlayRef.current = true;
        setIndex(0);
        return;
      }

      setPlaying(false);
      setCurrentTime(audio.duration || 0);
    };

    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [repeat, shuffleOn, index, tracks]);

  // 5) 记住音量 / 循环 / 随机 / 当前曲目
  useEffect(() => {
    try {
      const payload: StoredState = {
        volume: volumeState,
        muted,
        repeat,
        shuffle: shuffleOn,
        index,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // 忽略：写入失败不影响播放
    }
  }, [volumeState, muted, repeat, shuffleOn, index]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    void audio.play().catch(() => {
      setError("播放失败：浏览器可能拦截了自动播放，请再点一次播放按钮。");
    });
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) play();
    else audio.pause();
  }, [play]);

  const selectTrack = useCallback(
    (next: number, autoPlay = true) => {
      if (tracks.length === 0) return;
      const wrapped = ((next % tracks.length) + tracks.length) % tracks.length;
      wantPlayRef.current = autoPlay;
      if (wrapped === index) {
        // 点的就是当前这首：不换 src，直接接着播
        if (autoPlay) play();
        return;
      }
      setIndex(wrapped);
    },
    [index, play, tracks.length],
  );

  const next = useCallback(() => {
    if (tracks.length === 0) return;
    if (shuffleOn) selectTrack(pickShuffleIndex(index, tracks.length));
    else selectTrack(index + 1);
  }, [index, selectTrack, shuffleOn, tracks.length]);

  const prev = useCallback(() => {
    if (tracks.length === 0) return;
    selectTrack(index - 1);
  }, [index, selectTrack, tracks.length]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const max = Number.isFinite(audio.duration) ? audio.duration : time;
    audio.currentTime = Math.min(Math.max(time, 0), max);
    setCurrentTime(audio.currentTime);
  }, []);

  const changeVolume = useCallback((value: number) => {
    const nextVolume = clampVolume(value);
    setVolumeState(nextVolume);
    if (nextVolume > 0) setMuted(false);
  }, []);

  const toggleMute = useCallback(() => setMuted((current) => !current), []);

  const cycleRepeat = useCallback(() => {
    setRepeat((current) => (current === "off" ? "all" : current === "all" ? "one" : "off"));
  }, []);

  const toggleShuffle = useCallback(() => setShuffleOn((current) => !current), []);

  return {
    tracks,
    track,
    index,
    playing,
    buffering,
    currentTime,
    duration,
    volume: volumeState,
    muted,
    repeat,
    shuffle: shuffleOn,
    error,
    play,
    pause,
    toggle,
    next,
    prev,
    selectTrack,
    seek,
    setVolume: changeVolume,
    toggleMute,
    cycleRepeat,
    toggleShuffle,
  };
}
