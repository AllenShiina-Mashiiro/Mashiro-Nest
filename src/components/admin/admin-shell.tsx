"use client";

import {
  Database,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  PenLine,
  Settings,
  Tv,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";
import { UserAvatar } from "@/components/user-avatar";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "概览", icon: LayoutDashboard },
  { href: "/admin/posts", label: "文章", icon: FileText },
  { href: "/admin/posts/new", label: "写文章", icon: PenLine },
  { href: "/admin/media", label: "媒体库", icon: ImageIcon },
  { href: "/admin/profile", label: "个人资料", icon: UserRound },
  { href: "/admin/friends", label: "友人帐", icon: Users, adminOnly: true },
  { href: "/admin/anime", label: "追番", icon: Tv, adminOnly: true },
  { href: "/admin/users", label: "用户", icon: UserCog, adminOnly: true },
  { href: "/admin/settings", label: "站点设置", icon: Settings, adminOnly: true },
];

export function AdminShell({
  children,
  user,
  mode,
  siteName,
}: {
  children: React.ReactNode;
  user: SessionUser;
  mode: "database";
  siteName: string;
}) {
  const pathname = usePathname();
  const nav = NAV.filter((item) => !item.adminOnly || user.role === "ADMIN");

  const isActive = (item: NavItem) => pathname === item.href;

  return (
    <div className="min-h-dvh bg-[#f6f8fb] dark:bg-[#0a0d14]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-ink-100 bg-white/80 p-4 backdrop-blur-xl lg:flex dark:border-white/8 dark:bg-[#10141d]/90">
        <Link href="/admin" className="flex items-center gap-2 px-2 py-1.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-mint-300 to-sakura-300 text-[12px] font-bold text-white">
            {siteName.slice(0, 1).toUpperCase()}
          </span>
          <span className="truncate text-[13px] font-bold text-ink-800 dark:text-white/90">
            {siteName} Admin
          </span>
        </Link>

        <nav className="mt-5 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12.5px] font-medium transition",
                isActive(item)
                  ? "bg-mint-50 text-mint-600 ring-1 ring-mint-200/70 dark:bg-mint-400/12 dark:text-mint-300 dark:ring-mint-400/20"
                  : "text-ink-500 hover:bg-ink-100/60 hover:text-ink-800 dark:text-ink-300 dark:hover:bg-white/5 dark:hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] text-ink-400 transition hover:bg-ink-100/60 hover:text-ink-700 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            查看站点
          </Link>

          <div className="rounded-2xl border border-ink-100 bg-white/70 p-3 dark:border-white/8 dark:bg-white/[0.03]">
            <div className="flex items-center gap-2">
              <UserAvatar user={user} size={32} />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-ink-800 dark:text-white/90">
                  {user.displayName}
                </p>
                <p className="truncate text-[10px] text-ink-400">@{user.username}</p>
              </div>
            </div>
            <form action={logoutAction} className="mt-2">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-ink-200/70 py-1.5 text-[11px] font-semibold text-ink-500 transition hover:border-sakura-200 hover:bg-sakura-50 hover:text-sakura-500 dark:border-white/10 dark:text-ink-300 dark:hover:bg-sakura-400/10"
              >
                <LogOut className="h-3 w-3" />
                退出登录
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-ink-100 bg-white/80 px-4 backdrop-blur-xl dark:border-white/8 dark:bg-[#10141d]/85">
          <nav className="flex items-center gap-1 overflow-x-auto lg:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition",
                  isActive(item)
                    ? "bg-mint-100 text-mint-600 dark:bg-mint-400/15 dark:text-mint-300"
                    : "text-ink-400",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-2.5 py-1 text-[10.5px] font-semibold text-mint-600 dark:bg-mint-400/10 dark:text-mint-300">
              <Database className="h-3 w-3" />
              PostgreSQL
            </span>
            <Link
              href="/"
              className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 lg:hidden dark:hover:bg-white/5"
              aria-label="查看站点"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
            <form action={logoutAction} className="lg:hidden">
              <button
                type="submit"
                aria-label="退出登录"
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/5"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
