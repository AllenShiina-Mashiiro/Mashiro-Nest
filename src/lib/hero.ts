/** 首页/关于页主视觉的轮换逻辑（按时间桶取图，天然支持多实例、无需存状态）。 */

export const HERO_ROTATE_OPTIONS = [1, 5, 20, 60, 1440] as const;

export const HERO_ROTATE_LABELS: Record<number, string> = {
  1: "每 1 分钟",
  5: "每 5 分钟",
  20: "每 20 分钟",
  60: "每 1 小时",
  1440: "每 1 天",
};

export function normalizeHeroRotate(minutes: number): number {
  return (HERO_ROTATE_OPTIONS as readonly number[]).includes(minutes) ? minutes : 1440;
}

export function heroRotateSeconds(minutes: number): number {
  return normalizeHeroRotate(minutes) * 60;
}

/** 同一时间桶内返回同一张图，桶切换时换下一张 */
export function pickHeroImage(images: string[], rotateMinutes: number): string {
  if (!images.length) return "/images/banner.svg";
  const bucket = Math.floor(Date.now() / (heroRotateSeconds(rotateMinutes) * 1000));
  return images[((bucket % images.length) + images.length) % images.length];
}

/** 距离下一个时间桶还有多少毫秒 */
export function msUntilNextBucket(rotateMinutes: number): number {
  const period = heroRotateSeconds(rotateMinutes) * 1000;
  return period - (Date.now() % period);
}
