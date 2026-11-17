"use client";

import {
  Command,
  Github,
  House,
  LogIn,
  LogOut,
  Menu,
  PenLine,
  Search,
  Settings2,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";
import { NavIcon } from "@/components/nav-icon";
import { NotificationBell } from "@/components/notification-bell";
import { SearchDialog } from "@/components/search-dialog";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader({
  user,
  siteName,
  siteIcon,
  github,
  unread = 0,
}: {
  user: SessionUser | null;
  unread?: number;
  siteName: string;
  siteIcon: string;
  github: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(event.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:pt-4">
        <div className="mx-auto flex h-11 w-full max-w-[1180px] items-center gap-0.5 rounded-full border border-white/10 bg-[#141925]/90 px-1.5 text-white shadow-[0_14px_40px_-18px_rgba(8,12,20,0.9)] backdrop-blur-xl">
          <Link
            href="/"
            className="group flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition hover:bg-white/5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={siteIcon} alt="" className="h-4 w-4 rounded" />
            <span className="max-w-[120px] truncate text-[13px] font-semibold tracking-wide text-mint-300">
              {siteName}
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            {siteConfig.nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12.5px] font-medium transition",
                    active
                      ? "bg-white/10 text-mint-200"
                      : "text-white/65 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <NavIcon
                    item={item}
                    className={cn(
                      "h-3.5 w-3.5 transition",
                      active ? "text-mint-300" : "text-white/40 group-hover:text-white/70",
                    )}
                  />
                  {item.label}
                  {active ? (
                    <span className="absolute inset-x-2 -bottom-[1px] h-[2px] rounded-full bg-gradient-to-r from-mint-300 to-sakura-300" />
                  ) : null}
                </Link>
              );
            })}
            {github ? (
              <a
                href={github}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12.5px] font-medium text-white/65 transition hover:bg-white/5 hover:text-white"
              >
                GitHub
              </a>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-8 items-center gap-2 rounded-full bg-white/95 px-3 text-[12px] text-ink-400 shadow-sm transition hover:bg-white md:flex md:w-36 lg:w-48"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-left">Search</span>
              <Command className="h-3 w-3 shrink-0 opacity-70" />
              <span className="text-[10px] font-semibold opacity-70">K</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="搜索"
              className="grid h-8 w-8 place-items-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white md:hidden"
            >
              <Search className="h-4 w-4" />
            </button>

            {user ? <NotificationBell initialUnread={unread} /> : null}

            <ThemeToggle />

            {user ? (
              <div ref={userRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserOpen((value) => !value)}
                  aria-label="账户菜单"
                  aria-expanded={userOpen}
                  className="flex h-8 items-center gap-1.5 rounded-full pl-0.5 pr-2 transition hover:bg-white/10"
                >
                  <UserAvatar user={user} size={26} />
                  <span className="hidden max-w-[70px] truncate text-[11.5px] text-white/80 sm:block">
                    {user.displayName}
                  </span>
                </button>

                {userOpen ? (
                  <div className="absolute right-0 top-10 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#141925]/97 p-1.5 text-white shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-2 rounded-xl px-2 py-2">
                      <UserAvatar user={user} size={32} />
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] font-semibold">
                          {user.displayName}
                        </span>
                        <span className="block truncate text-[10px] text-white/45">
                          @{user.username}
                        </span>
                      </span>
                    </div>
                    <div className="my-1 h-px bg-white/10" />
                    <Link
                      href={`/u/${user.username}`}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                      <UserRound className="h-3.5 w-3.5" />
                      个人主页
                    </Link>
                    <Link
                      href="/admin/posts/new"
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                      <PenLine className="h-3.5 w-3.5" />
                      写文章
                    </Link>
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      控制台
                    </Link>
                    <button
                      type="button"
                      onClick={() => void logout()}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] text-white/60 transition hover:bg-sakura-400/15 hover:text-sakura-200"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      退出登录
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex h-8 items-center gap-1 rounded-full bg-white/10 px-3 text-[11.5px] font-semibold text-white/85 transition hover:bg-white/20"
              >
                <LogIn className="h-3.5 w-3.5" />
                登录
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="菜单"
              aria-expanded={menuOpen}
              className="grid h-8 w-8 place-items-center rounded-full text-white/80 transition hover:bg-white/10 md:hidden"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="mx-auto mt-2 w-full max-w-[1180px] overflow-hidden rounded-3xl border border-white/10 bg-[#141925]/95 p-2 text-white shadow-xl backdrop-blur-xl md:hidden">
            <div className="grid grid-cols-2 gap-1">
              {siteConfig.nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <NavIcon item={item} className="h-4 w-4 text-white/45" />
                  {item.label}
                </Link>
              ))}
              {github ? (
                <a
                  href={github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-2xl px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <Github className="h-4 w-4" /> GitHub
                </a>
              ) : null}
              <Link
                href="/admin"
                className="rounded-2xl px-3 py-2.5 text-sm text-mint-200 transition hover:bg-white/10"
              >
                控制台
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
