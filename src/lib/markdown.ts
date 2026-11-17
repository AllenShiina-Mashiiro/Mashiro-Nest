import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { RenderedMarkdown, TocItem } from "@/lib/types";
import { countWords, estimateReadingTime } from "@/lib/utils";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypePrettyCode, {
    theme: { light: "min-light", dark: "github-dark-dimmed" },
    keepBackground: false,
    defaultLang: "text",
    bypassInlineCode: true,
  })
  .use(rehypeStringify);

const cache = new Map<string, RenderedMarkdown>();
const CACHE_LIMIT = 40;

function stripTags(value: string) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractToc(html: string): TocItem[] {
  const items: TocItem[] = [];
  const heading = /<h([2-3]) id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  let match: RegExpExecArray | null;
  while ((match = heading.exec(html))) {
    const text = stripTags(match[3]);
    if (!text) continue;
    items.push({ level: Number(match[1]), id: match[2], text });
  }
  return items;
}

/** Renders markdown to HTML with syntax highlighting and a table of contents. */
export async function renderMarkdown(source: string): Promise<RenderedMarkdown> {
  const cached = cache.get(source);
  if (cached) return cached;

  const file = await processor.process(source);
  const html = String(file);
  const wordCount = countWords(source);
  const result: RenderedMarkdown = {
    html,
    toc: extractToc(html),
    wordCount,
    readingTime: estimateReadingTime(wordCount),
  };

  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(source, result);

  return result;
}
