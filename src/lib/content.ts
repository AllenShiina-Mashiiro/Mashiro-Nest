import matter from "gray-matter";
import fs from "node:fs";
import path from "node:path";
import type { PostSummary, CategoryRef, TagRef } from "@/lib/types";
import { countWords, estimateReadingTime } from "@/lib/text";
import { colorFor, slugifyTag } from "@/lib/text";

/**
 * Markdown files in `src/content/posts` are the canonical seed content.
 * They power the demo data source and `prisma/seed.ts`.
 */

export const CONTENT_DIR = path.join(process.cwd(), "src", "content", "posts");

export type RawPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated: string | null;
  category: CategoryRef | null;
  tags: TagRef[];
  cover: string | null;
  featured: boolean;
  pinned: boolean;
  draft: boolean;
  content: string;
  wordCount: number;
  readingTime: number;
  views: number;
};

type Frontmatter = {
  title?: string;
  description?: string;
  date?: string | Date;
  updated?: string | Date;
  category?: string;
  tags?: string[];
  cover?: string;
  featured?: boolean;
  pinned?: boolean;
  draft?: boolean;
  views?: number;
};

export function parsePostFile(fileName: string, raw: string): RawPost {
  const { data, content } = matter(raw);
  const fm = data as Frontmatter;
  const slug = fileName.replace(/\.mdx?$/, "");

  const tags: TagRef[] = (fm.tags ?? []).map((tag) => {
    const name = String(tag).trim();
    return { slug: slugifyTag(name), name, color: colorFor(name), count: 0 };
  });

  const category = fm.category
    ? {
        slug: slugifyTag(fm.category),
        name: fm.category,
        color: colorFor(fm.category),
      }
    : null;

  const wordCount = countWords(content);
  const date = fm.date ? new Date(fm.date) : new Date();

  return {
    slug,
    title: fm.title ?? slug,
    description: fm.description ?? "",
    date: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
    updated: fm.updated ? new Date(fm.updated).toISOString() : null,
    category,
    tags,
    cover: fm.cover ?? null,
    featured: Boolean(fm.featured),
    pinned: Boolean(fm.pinned),
    draft: Boolean(fm.draft),
    content: content.trim(),
    wordCount,
    readingTime: estimateReadingTime(wordCount),
    views: fm.views ?? 0,
  };
}

let cache: RawPost[] | null = null;

export function readContentPosts(): RawPost[] {
  if (cache) return cache;

  let files: string[] = [];
  try {
    files = fs.readdirSync(CONTENT_DIR).filter((file) => /\.mdx?$/.test(file));
  } catch {
    files = [];
  }

  cache = files
    .map((file) =>
      parsePostFile(file, fs.readFileSync(path.join(CONTENT_DIR, file), "utf8")),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return cache;
}

export function toSummary(post: RawPost, tagCounts?: Map<string, number>): PostSummary {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.date,
    updated: post.updated,
    category: post.category,
    tags: post.tags.map((tag) => ({
      ...tag,
      count: tagCounts?.get(tag.slug) ?? tag.count,
    })),
    cover: post.cover,
    featured: post.featured,
    pinned: post.pinned,
    draft: post.draft,
    wordCount: post.wordCount,
    readingTime: post.readingTime,
    views: post.views,
    author: null,
  };
}

export function buildTagCounts(posts: RawPost[]) {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag.slug, (counts.get(tag.slug) ?? 0) + 1);
    }
  }
  return counts;
}
