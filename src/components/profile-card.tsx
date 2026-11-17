import Link from "next/link";
import { ArrowUpRight, Github, Mail, Send } from "lucide-react";
import type { SiteSettings } from "@/lib/settings";
import type { PublicUser } from "@/lib/types";
import { UserAvatar } from "@/components/user-avatar";

export function ProfileCard({
  user,
  settings,
}: {
  user: PublicUser | null;
  settings: SiteSettings;
}) {
  if (!user) {
    return (
      <aside className="card p-4 text-center text-[11.5px] text-ink-400">
        还没有站长资料，去后台「站点设置」填一下吧。
      </aside>
    );
  }

  const github = user.github || settings.githubUrl;
  const telegram = user.telegram || settings.telegramUrl;
  const email = settings.contactEmail;

  return (
    <aside className="card p-4">
      <div className="mx-auto max-w-[160px] overflow-hidden rounded-[1.15rem] bg-gradient-to-br from-sakura-100 via-white to-mint-100 p-[3px] sm:max-w-[200px] lg:max-w-none dark:from-sakura-400/25 dark:via-white/10 dark:to-mint-400/25">
        <div className="relative aspect-square w-full overflow-hidden rounded-[1rem] bg-white/70">
          <UserAvatar
            user={user}
            size={240}
            rounded="rounded-[1rem]"
            className="h-full w-full"
          />
          <span className="pointer-events-none absolute inset-0 rounded-[1rem] ring-1 ring-inset ring-white/50" />
        </div>
      </div>

      <h2 className="mt-4 flex items-center justify-center gap-1.5 text-center text-[1.05rem] font-bold tracking-wide text-ink-900 dark:text-white/95">
        {user.displayName}
        {user.role === "ADMIN" ? (
          <span className="rounded-full bg-sakura-100 px-1.5 py-0.5 text-[9px] font-bold text-sakura-500 dark:bg-sakura-400/15 dark:text-sakura-300">
            站长
          </span>
        ) : null}
      </h2>
      <div className="mx-auto mt-1.5 h-[3px] w-9 rounded-full bg-gradient-to-r from-mint-300 to-sakura-300" />

      <p className="mt-2.5 text-center text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-400">
        @{user.username}
      </p>
      <p className="mt-2 text-center text-[12.5px] leading-relaxed text-ink-500 dark:text-ink-300/85">
        {user.bio || "This is a description"}
      </p>

      <div className="mt-4 flex justify-center gap-2">
        {email ? (
          <a
            href={`mailto:${email}`}
            aria-label={`发邮件 ${email}`}
            title={email}
            className="grid h-8 w-8 place-items-center rounded-xl border border-ink-200/80 text-ink-400 transition hover:-translate-y-0.5 hover:border-mint-300 hover:bg-mint-50 hover:text-mint-500 dark:border-white/12 dark:text-ink-300 dark:hover:bg-mint-400/10 dark:hover:text-mint-300"
          >
            <Mail className="h-3.5 w-3.5" />
          </a>
        ) : null}
        {github ? (
          <a
            href={github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            title="GitHub"
            className="grid h-8 w-8 place-items-center rounded-xl border border-ink-200/80 text-ink-400 transition hover:-translate-y-0.5 hover:border-mint-300 hover:bg-mint-50 hover:text-mint-500 dark:border-white/12 dark:text-ink-300 dark:hover:bg-mint-400/10 dark:hover:text-mint-300"
          >
            <Github className="h-3.5 w-3.5" />
          </a>
        ) : null}
        {telegram ? (
          <a
            href={telegram}
            target="_blank"
            rel="noreferrer"
            aria-label="Telegram"
            title="Telegram"
            className="grid h-8 w-8 place-items-center rounded-xl border border-ink-200/80 text-ink-400 transition hover:-translate-y-0.5 hover:border-mint-300 hover:bg-mint-50 hover:text-mint-500 dark:border-white/12 dark:text-ink-300 dark:hover:bg-mint-400/10 dark:hover:text-mint-300"
          >
            <Send className="h-3.5 w-3.5" />
          </a>
        ) : null}
        <a
          href={`/u/${user.username}`}
          aria-label="个人主页"
          title="个人主页"
          className="grid h-8 w-8 place-items-center rounded-xl border border-ink-200/80 text-ink-400 transition hover:-translate-y-0.5 hover:border-mint-300 hover:bg-mint-50 hover:text-mint-500 dark:border-white/12 dark:text-ink-300 dark:hover:bg-mint-400/10 dark:hover:text-mint-300"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-mint-50/80 py-1.5 text-[10.5px] font-medium text-mint-500 dark:bg-mint-400/10 dark:text-mint-300">
        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-mint-400" />
        {user.status || "写代码中"} · {settings.siteName}
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-3 text-[10.5px] text-ink-400">
        <span>
          <b className="text-[12px] text-ink-700 dark:text-white/85">{user.postCount}</b> 文章
        </span>
        <span className="h-3 w-px bg-ink-200 dark:bg-white/15" />
        <Link href={`/u/${user.username}`} className="transition hover:text-mint-500">
          <b className="text-[12px] text-ink-700 dark:text-white/85">{user.followers}</b> 粉丝
        </Link>
      </div>
    </aside>
  );
}
