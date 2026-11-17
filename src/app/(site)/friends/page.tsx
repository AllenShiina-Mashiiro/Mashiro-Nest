import type { Metadata } from "next";
import { ArrowUpRight, Link2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getFriends } from "@/lib/data";
import { siteConfig } from "@/lib/config";
import { hostnameOf } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "友人帐",
  description: "一些值得一看的站点与朋友。",
};

export default async function FriendsPage() {
  const friends = await getFriends();

  return (
    <>
      <PageHeader
        eyebrow="Friends"
        title="友人帐"
        description={`共 ${friends.length} 位朋友。如果你想交换友链，请带上站点地址与一句话介绍来信。`}
      />

      <div className="mx-auto max-w-[1180px] px-4 pb-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {friends.map((friend, index) => (
            <a
              key={friend.id}
              href={friend.url}
              target="_blank"
              rel="noreferrer"
              style={{ animationDelay: `${index * 50}ms` }}
              className="group card animate-fade-up relative overflow-hidden p-4 transition duration-300 hover:-translate-y-1 hover:border-mint-200"
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl transition group-hover:opacity-40"
                style={{ backgroundColor: friend.color }}
              />
              <div className="flex items-center gap-3">
                {friend.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={friend.avatar}
                    alt={friend.name}
                    className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/70"
                  />
                ) : (
                  <span
                    className="grid h-11 w-11 place-items-center rounded-xl text-[15px] font-bold text-white shadow-inner"
                    style={{
                      background: `linear-gradient(140deg, ${friend.color}, ${friend.color}99)`,
                    }}
                  >
                    {friend.name.slice(0, 1).toUpperCase()}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="truncate text-[13.5px] font-bold text-ink-900 dark:text-white/95">
                      {friend.name}
                    </h2>
                    <ArrowUpRight className="h-3 w-3 shrink-0 text-ink-300 transition group-hover:text-mint-400" />
                  </div>
                  <p className="truncate text-[10.5px] text-ink-300">
                    {hostnameOf(friend.url)}
                  </p>
                </div>
              </div>

              <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-ink-500 dark:text-ink-300/85">
                {friend.description}
              </p>

              <div className="mt-3 flex items-center gap-1 text-[10px] text-ink-300">
                <Link2 className="h-3 w-3" />
                友链 · 常去看看
              </div>
            </a>
          ))}
        </div>

        <section className="card mt-6 flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900 dark:text-white/95">
              <Sparkles className="h-4 w-4 text-mint-400" />
              申请友链
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-500 dark:text-ink-300/85">
              要求：原创内容为主、能正常访问、已经加上本站链接。把站点名称、地址、头像与一句话介绍发到邮箱即可。
            </p>
          </div>
          <a
            href={`mailto:${siteConfig.author.email}?subject=友链申请`}
            className="shrink-0 rounded-full bg-gradient-to-br from-mint-400 to-mint-500 px-4 py-2 text-[12px] font-semibold text-white shadow-[0_12px_24px_-14px_rgba(76,186,155,0.9)] transition hover:-translate-y-0.5"
          >
            发送邮件
          </a>
        </section>
      </div>
    </>
  );
}
