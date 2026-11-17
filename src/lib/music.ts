/** 音乐播放器用到的小工具。 */

/** 秒 -> m:ss，非法值统一显示 0:00 */
export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

/** 随机取一个不同于当前曲目的下标；只有一首歌时直接返回 0 */
export function pickShuffleIndex(current: number, length: number) {
  if (length <= 1) return 0;
  const offset = 1 + Math.floor(Math.random() * (length - 1));
  return (current + offset) % length;
}

export function clampVolume(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
