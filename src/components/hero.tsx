import Link from "next/link";
import { HeroImage } from "@/components/hero-image";

/**
 * 首页 / 关于页的主视觉：图片 + 顶部压暗 + 底部渐隐 + 斜切光束（还原原主题的
 * 「左右层次对比」）。
 */
export function Hero({
  title,
  subtitle,
  image,
  images = [],
  rotateMinutes = 1440,
  beam = true,
  compact = false,
}: {
  title: string;
  subtitle: string;
  image: string;
  /** 候选图列表；传了 2 张以上才会自动轮换 */
  images?: string[];
  /** 轮换间隔（分钟） */
  rotateMinutes?: number;
  beam?: boolean;
  compact?: boolean;
}) {
  return (
    <section
      className={`relative isolate w-full overflow-hidden ${
        compact ? "h-[300px] sm:h-[340px]" : "h-[460px] sm:h-[560px] lg:h-[600px]"
      }`}
    >
      <HeroImage
        images={images.length ? images : [image]}
        initial={image}
        rotateMinutes={rotateMinutes}
        className="absolute inset-0 h-full w-full scale-105 object-cover object-center saturate-[1.12] transition-opacity duration-700"
      />

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(20,18,36,0.52),rgba(20,18,36,0.06)_26%,transparent_46%)]" />

      {/* 斜切光束：右侧更亮，边缘一条细线 */}
      {beam ? (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="beam-fill" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.10" />
              <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="beam-line" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <polygon points="62,0 100,0 100,100 28,100" fill="url(#beam-fill)" />
          <line
            x1="28"
            y1="100"
            x2="62"
            y2="0"
            stroke="url(#beam-line)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : null}

      <div className="pointer-events-none absolute -left-1/4 bottom-[-10%] h-[85%] w-[75%] -rotate-[16deg] bg-gradient-to-r from-white/20 via-white/5 to-transparent blur-3xl" />

      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent via-paper/85 to-paper dark:via-night/85 dark:to-night" />

      <div
        className={`relative z-10 flex h-full flex-col items-center justify-center px-6 text-center ${
          compact ? "pb-10" : "pb-16"
        }`}
      >
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-[#241d3a]/30 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/90 backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-mint-300" />
          PERSONAL BLOG
        </span>

        <h1
          className={`font-bold tracking-[0.01em] text-white [text-shadow:0_1px_2px_rgba(46,28,62,0.35),0_8px_30px_rgba(46,28,62,0.55),0_18px_60px_rgba(46,28,62,0.4)] ${
            compact ? "text-3xl sm:text-4xl" : "text-[2.75rem] sm:text-6xl lg:text-[4.5rem]"
          }`}
        >
          {title}
        </h1>

        <p className="mt-3 text-[15px] font-medium text-white [text-shadow:0_1px_2px_rgba(46,28,62,0.4),0_4px_22px_rgba(46,28,62,0.6)] sm:text-lg">
          {subtitle}
        </p>

        {compact ? null : (
          <div className="mt-6 flex items-center gap-2.5">
            <Link
              href="/archive"
              className="rounded-full border border-white/40 bg-[#2a2138]/40 px-4 py-1.5 text-[11.5px] font-medium text-white shadow-[0_6px_20px_-8px_rgba(46,28,62,0.8)] backdrop-blur-md transition hover:border-white/60 hover:bg-[#2a2138]/55"
            >
              浏览归档
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-white/30 bg-[#2a2138]/30 px-4 py-1.5 text-[11.5px] font-medium text-white shadow-[0_6px_20px_-10px_rgba(46,28,62,0.7)] backdrop-blur-md transition hover:border-white/50 hover:bg-[#2a2138]/45"
            >
              关于本站
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
