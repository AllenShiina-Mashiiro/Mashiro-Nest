import type { Metadata } from "next";
import { HardDrive, Sparkles, Trash2 } from "lucide-react";
import { cleanupMediaAction } from "@/app/admin/actions";
import { MediaLibrary } from "@/components/admin/media-library";
import { StorageTester } from "@/components/admin/storage-tester";
import { getSession } from "@/lib/auth";
import { storageStatus } from "@/lib/media";
import { listMediaWithUsage, scanMedia } from "@/lib/media-refs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "媒体库",
  robots: { index: false, follow: false },
};

export default async function MediaPage() {
  const [items, report, session] = await Promise.all([
    listMediaWithUsage(),
    scanMedia(),
    getSession(),
  ]);
  const isAdmin = session?.role === "ADMIN";
  const storage = storageStatus();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-900 dark:text-white">媒体库</h1>
        <p className="mt-1 text-[11.5px] text-ink-400">
          图片以内容哈希命名，重复上传会自动复用同一个文件；未被任何地方引用的「孤儿文件」可以一键清理。
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "文件数", value: report.total },
          { label: "去重后", value: report.total - report.duplicates },
          { label: "使用中", value: report.referenced },
          { label: "孤儿文件", value: report.orphans.length },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-ink-100 bg-white/80 p-3.5 dark:border-white/8 dark:bg-white/[0.04]"
          >
            <p className="text-[10.5px] text-ink-400">{card.label}</p>
            <p className="mt-1 text-xl font-bold text-ink-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {report.orphans.length ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-amber-200 bg-amber-50/70 p-4 dark:border-amber-400/20 dark:bg-amber-400/[0.06]">
          <div>
            <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-amber-700 dark:text-amber-300">
              <Trash2 className="h-3.5 w-3.5" />
              {report.orphans.length} 个孤儿文件（{(report.bytes / 1024 / 1024).toFixed(1)} MB）
            </p>
            <p className="mt-1 text-[11px] text-amber-700/70 dark:text-amber-200/70">
              这些文件没有被文章、动态、头像、设置引用，删除后不会影响页面展示。
            </p>
          </div>
          {isAdmin ? (
            <form action={cleanupMediaAction}>
              <input type="hidden" name="mode" value="orphans" />
              <button
                type="submit"
                className="rounded-full bg-amber-500 px-4 py-2 text-[11.5px] font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
              >
                清理全部孤儿文件
              </button>
            </form>
          ) : null}
        </div>
      ) : (
        <p className="flex items-center gap-1.5 rounded-xl bg-mint-50 px-3 py-2 text-[11.5px] text-mint-600 dark:bg-mint-400/10 dark:text-mint-300">
          <Sparkles className="h-3.5 w-3.5" />
          没有孤儿文件，存储很干净。
        </p>
      )}

      <MediaLibrary initial={items} canDelete={Boolean(isAdmin)} />

      <section className="rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-[12.5px] font-bold text-ink-800 dark:text-white/90">
            <HardDrive className="h-3.5 w-3.5" />
            存储
          </h2>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              storage.driver === "s3"
                ? "bg-mint-100 text-mint-600 dark:bg-mint-400/15 dark:text-mint-300"
                : "bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-300"
            }`}
          >
            {storage.driver === "s3" ? "S3 对象存储" : "本地磁盘"}
          </span>
        </div>

        <dl className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl bg-ink-100/50 px-2.5 py-1.5 dark:bg-white/5">
            <dt className="text-ink-400">驱动</dt>
            <dd className="font-mono text-ink-700 dark:text-ink-200">
              {storage.driver === "s3" ? "s3" : "local"}
            </dd>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-ink-100/50 px-2.5 py-1.5 dark:bg-white/5">
            <dt className="text-ink-400">{storage.driver === "s3" ? "Bucket" : "目录"}</dt>
            <dd className="max-w-[180px] truncate font-mono text-ink-700 dark:text-ink-200">
              {storage.driver === "s3" ? storage.bucket ?? "—" : storage.localDir}
            </dd>
          </div>
          {storage.driver === "s3" ? (
            <div className="flex items-center justify-between rounded-xl bg-ink-100/50 px-2.5 py-1.5 sm:col-span-2 dark:bg-white/5">
              <dt className="text-ink-400">Endpoint</dt>
              <dd className="max-w-[320px] truncate font-mono text-ink-700 dark:text-ink-200">
                {storage.endpoint ?? "AWS 默认"}
              </dd>
            </div>
          ) : null}
        </dl>

        <p className="mt-2.5 text-[10.5px] leading-relaxed text-ink-400">
          {storage.driver === "s3"
            ? "配置 S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY（可选 S3_ENDPOINT、S3_PUBLIC_URL）即可直传；删除会作用于桶内对象。"
            : "未配置 S3 时图片写入 public/uploads/<年份>/<hash>.<ext>；填好 S3_* 变量或设 STORAGE_DRIVER=s3 即可切换到对象存储。"}
        </p>

        <div className="mt-3">
          <StorageTester />
        </div>
      </section>
    </div>
  );
}
