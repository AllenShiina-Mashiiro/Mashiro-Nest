"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Eye,
  ImagePlus,
  Loader2,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { savePostAction, type FormState } from "@/app/admin/actions";
import { MediaPicker } from "@/components/media-picker";

export type EditorPost = {
  slug: string;
  title: string;
  description: string;
  content: string;
  coverUrl: string;
  category: string;
  tags: string;
  published: boolean;
  featured: boolean;
  pinned: boolean;
};

const initialState: FormState = { status: "idle" };

function slugifyTitle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function PostEditor({
  post,
  mode,
  categories,
  tags,
  canFeature,
}: {
  post: EditorPost;
  mode: "create" | "edit";
  categories: string[];
  tags: string[];
  canFeature: boolean;
}) {
  const [state, formAction, pending] = useActionState(savePostAction, initialState);
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(post.slug));
  const [content, setContent] = useState(post.content);
  const [cover, setCover] = useState(post.coverUrl);
  const [picker, setPicker] = useState<null | "cover" | "content">(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const words = content.replace(/\s/g, "").length;

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) {
      setContent((current) => `${current}\n${text}\n`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = `${content.slice(0, start)}${content.slice(start, end) ? "" : ""}${text}${content.slice(end)}`;
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + text.length;
      el.setSelectionRange(caret, caret);
    });
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900 dark:text-white">
            {mode === "create" ? "写新文章" : "编辑文章"}
          </h1>
          <p className="mt-1 text-[11.5px] text-ink-400">
            使用 Markdown 撰写，保存后自动计算字数与阅读时长。
          </p>
        </div>

        <div className="flex items-center gap-2">
          {mode === "edit" && post.published ? (
            <Link
              href={`/posts/${post.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-200/80 bg-white/70 px-3.5 py-2 text-[11.5px] font-semibold text-ink-500 transition hover:border-mint-300 hover:text-mint-500 dark:border-white/10 dark:bg-white/5 dark:text-ink-300"
            >
              <Eye className="h-3.5 w-3.5" />
              预览
            </Link>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-mint-400 to-mint-500 px-4 py-2 text-[12px] font-semibold text-white shadow-[0_14px_26px_-16px_rgba(76,186,155,0.95)] transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            保存
          </button>
        </div>
      </div>

      {state.status === "error" ? (
        <p className="flex items-start gap-1.5 rounded-xl bg-sakura-50 px-3 py-2 text-[11.5px] font-medium text-sakura-500 dark:bg-sakura-400/10 dark:text-sakura-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-3 rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">标题</span>
            <input
              name="title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!slugTouched) setSlug(slugifyTitle(event.target.value));
              }}
              required
              placeholder="给这篇文章起个名字"
              className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-3 py-2 text-[15px] font-semibold text-ink-900 outline-none transition focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
            {state.fieldErrors?.title ? (
              <span className="mt-1 block text-[10.5px] text-sakura-500">
                {state.fieldErrors.title}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1 flex items-center justify-between text-[11px] font-semibold text-ink-400">
              Slug（链接地址）
              <button
                type="button"
                onClick={() => {
                  setSlug(slugifyTitle(title) || `post-${Date.now().toString(36)}`);
                  setSlugTouched(true);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-mint-500 hover:text-sakura-500"
              >
                <Sparkles className="h-2.5 w-2.5" />
                由标题生成
              </button>
            </span>
            <div className="flex items-center gap-1.5 rounded-xl border border-ink-200/80 bg-white/70 px-2 dark:border-white/10 dark:bg-white/5">
              <span className="pl-1 text-[11px] text-ink-300">/posts/</span>
              <input
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value);
                  setSlugTouched(true);
                }}
                required
                className="w-full bg-transparent py-2 font-mono text-[12px] text-ink-700 outline-none dark:text-white/90"
              />
            </div>
            {state.fieldErrors?.slug ? (
              <span className="mt-1 block text-[10.5px] text-sakura-500">
                {state.fieldErrors.slug}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold text-ink-400">摘要</span>
            <textarea
              name="description"
              defaultValue={post.description}
              rows={2}
              placeholder="一句话概括，会显示在卡片与搜索结果里"
              className="w-full resize-none rounded-xl border border-ink-200/80 bg-white/70 px-3 py-2 text-[12.5px] leading-relaxed text-ink-700 outline-none transition focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
          </label>

          <div className="block">
            <span className="mb-1 flex items-center justify-between text-[11px] font-semibold text-ink-400">
              <span>正文（Markdown）</span>
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPicker("content")}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-mint-500 transition hover:bg-mint-50 dark:hover:bg-mint-400/10"
                >
                  <ImagePlus className="h-3 w-3" />
                  插入图片
                </button>
                <span className="font-normal text-ink-300">{words.toLocaleString("en-US")} 字符</span>
              </span>
            </span>
            <textarea
              ref={textareaRef}
              name="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              rows={24}
              spellCheck={false}
              placeholder={"## 小标题\n\n在这里写正文，支持 GFM、表格、代码块…"}
              className="w-full resize-y rounded-xl border border-ink-200/80 bg-white/70 px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-ink-700 outline-none transition focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
            />
            {state.fieldErrors?.content ? (
              <span className="mt-1 block text-[10.5px] text-sakura-500">
                {state.fieldErrors.content}
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <section className="rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]">
            <h2 className="text-[12px] font-bold text-ink-800 dark:text-white/90">发布</h2>
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 text-[11.5px] text-ink-500 dark:text-ink-300">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={post.published}
                  className="h-3.5 w-3.5 accent-mint-500"
                />
                立即发布
              </label>
              {canFeature ? (
                <>
                  <label className="flex items-center gap-2 text-[11.5px] text-ink-500 dark:text-ink-300">
                    <input
                      type="checkbox"
                      name="featured"
                      defaultChecked={post.featured}
                      className="h-3.5 w-3.5 accent-mint-500"
                    />
                    标记为精选
                  </label>
                  <label className="flex items-center gap-2 text-[11.5px] text-ink-500 dark:text-ink-300">
                    <input
                      type="checkbox"
                      name="pinned"
                      defaultChecked={post.pinned}
                      className="h-3.5 w-3.5 accent-mint-500"
                    />
                    置顶
                  </label>
                </>
              ) : null}
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-ink-100 bg-white/80 p-4 dark:border-white/8 dark:bg-white/[0.04]">
            <div>
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">封面</span>
              <div className="flex gap-2">
                <input
                  name="coverUrl"
                  value={cover}
                  onChange={(event) => setCover(event.target.value)}
                  placeholder="/images/covers/xxx.svg 或 https://…"
                  className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11px] outline-none transition focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
                />
                <button
                  type="button"
                  onClick={() => setPicker("cover")}
                  className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-xl bg-mint-50 text-mint-500 transition hover:bg-mint-100 dark:bg-mint-400/10"
                  aria-label="选择封面"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
              </div>
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt=""
                  className="mt-2 aspect-[16/9] w-full rounded-lg object-cover ring-1 ring-ink-100 dark:ring-white/10"
                />
              ) : null}
            </div>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">分类</span>
              <input
                name="category"
                defaultValue={post.category}
                list="category-options"
                placeholder="Technology"
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none transition focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
              <datalist id="category-options">
                {categories.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-ink-400">
                标签（逗号分隔）
              </span>
              <input
                name="tags"
                defaultValue={post.tags}
                list="tag-options"
                placeholder="Next.js, Prisma"
                className="w-full rounded-xl border border-ink-200/80 bg-white/70 px-2.5 py-2 text-[11.5px] outline-none transition focus:border-mint-300 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
              />
              <datalist id="tag-options">
                {tags.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </label>

            <Link
              href="/admin/media"
              className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-mint-500 hover:text-sakura-500 dark:text-mint-300"
            >
              <Check className="h-3 w-3" />
              打开媒体库
            </Link>
          </section>

          {mode === "edit" ? (
            <p className="flex items-start gap-1.5 rounded-xl border border-dashed border-ink-200/80 p-3 text-[10.5px] leading-relaxed text-ink-400 dark:border-white/10">
              <Trash2 className="mt-0.5 h-3 w-3 shrink-0" />
              删除文章请回到列表页操作。
            </p>
          ) : null}
        </div>
      </div>

      <MediaPicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        title={picker === "cover" ? "选择封面" : "插入图片"}
        onPick={(url) => {
          if (picker === "cover") setCover(url);
          else insertAtCursor(`\n![图片](${url})\n`);
        }}
      />
    </form>
  );
}
