"use client";

import Link from "next/link";
import { Eye, EyeOff, PenLine, Trash2 } from "lucide-react";
import { deletePostAction, togglePublishAction } from "@/app/admin/actions";

export function PostRowActions({
  slug,
  published,
  canManage,
}: {
  slug: string;
  published: boolean;
  canManage: boolean;
}) {
  if (!canManage) {
    return <span className="block text-right text-[10.5px] text-ink-300">只读</span>;
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/admin/posts/${slug}`}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-ink-500 transition hover:bg-mint-50 hover:text-mint-600 dark:text-ink-300 dark:hover:bg-white/5"
      >
        <PenLine className="h-3 w-3" />
        编辑
      </Link>

      <form action={togglePublishAction}>
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="next" value={published ? "false" : "true"} />
        <button
          type="submit"
          title={published ? "转为草稿" : "发布"}
          className="grid h-6 w-6 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/5"
        >
          {published ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </button>
      </form>

      <form
        action={deletePostAction}
        onSubmit={(event) => {
          if (!window.confirm(`确定要删除《${slug}》吗？该操作不可撤销。`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="slug" value={slug} />
        <button
          type="submit"
          title="删除"
          className="grid h-6 w-6 place-items-center rounded-lg text-ink-400 transition hover:bg-sakura-50 hover:text-sakura-500 dark:hover:bg-sakura-400/10"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </form>
    </div>
  );
}
