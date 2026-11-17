import Link from "next/link";
import { Github, Heart, Rss } from "lucide-react";

export function SiteFooter({
  siteName,
  icp,
  github,
}: {
  siteName: string;
  icp: string;
  github: string;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20 pb-10">
      <div className="mx-auto max-w-[1180px] px-4">
        <div className="hairline" />
        <div className="flex flex-col items-center gap-3 pt-8 text-center">
          <Link href="/" className="group flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-mint-300 to-sakura-300 text-[11px] font-bold text-white shadow-sm">
              {siteName.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-sm font-bold tracking-wide text-ink-700 dark:text-white/90">
              {siteName}
            </span>
          </Link>

          <p className="text-[11.5px] text-ink-400">
            © {year} {siteName} · 内容遵循 CC BY-NC-SA 4.0 协议
          </p>

          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11.5px] text-ink-400">
            <Link href="/rss.xml" className="inline-flex items-center gap-1 transition hover:text-mint-500">
              <Rss className="h-3 w-3" /> RSS
            </Link>
            <Link href="/archive" className="transition hover:text-mint-500">
              归档
            </Link>
            <Link href="/friends" className="transition hover:text-mint-500">
              友人帐
            </Link>
            <Link href="/moments" className="transition hover:text-mint-500">
              朋友圈
            </Link>
            <a
              href={github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 transition hover:text-mint-500"
            >
              <Github className="h-3 w-3" /> GitHub
            </a>
          </nav>

          <p className="text-[10.5px] text-ink-300">
            Powered by Next.js 15 · Prisma · PostgreSQL · Redis · S3 · Tailwind CSS v4
          </p>
          <p className="flex items-center gap-1 text-[10.5px] text-ink-300">
            Made with <Heart className="h-2.5 w-2.5 text-sakura-400" /> and far too much coffee
          </p>
          {icp ? <p className="text-[10.5px] text-ink-300">{icp}</p> : null}
        </div>
      </div>
    </footer>
  );
}
