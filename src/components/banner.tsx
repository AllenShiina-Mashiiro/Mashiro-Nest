import Link from "next/link";
import { siteConfig } from "@/lib/config";

export function Banner() {
  return (
    <section className="relative isolate h-[460px] w-full overflow-hidden sm:h-[560px] lg:h-[600px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={siteConfig.hero.image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-105 object-cover object-center saturate-[1.12]"
      />

      {/* top scrim keeps the floating navbar legible */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(20,18,36,0.52),rgba(20,18,36,0.06)_26%,transparent_46%)]" />

      <div className="pointer-events-none absolute -left-1/4 bottom-[-10%] h-[85%] w-[75%] -rotate-[16deg] bg-gradient-to-r from-white/20 via-white/5 to-transparent blur-3xl" />

      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent via-paper/85 to-paper dark:via-night/85 dark:to-night" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pb-16 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-[#241d3a]/30 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/90 backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-mint-300" />
          PERSONAL BLOG
        </span>

        <h1 className="text-[2.75rem] font-bold tracking-[0.01em] text-white [text-shadow:0_1px_2px_rgba(46,28,62,0.35),0_8px_30px_rgba(46,28,62,0.55),0_18px_60px_rgba(46,28,62,0.4)] sm:text-6xl lg:text-[4.5rem]">
          {siteConfig.title}
        </h1>

        <p className="mt-3 text-[15px] font-medium text-white [text-shadow:0_1px_2px_rgba(46,28,62,0.4),0_4px_22px_rgba(46,28,62,0.6)] sm:text-lg">
          {siteConfig.subtitle}
        </p>

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
      </div>
    </section>
  );
}
