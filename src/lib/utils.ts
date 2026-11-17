import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Paginated } from "@/lib/types";

export { countWords, estimateReadingTime } from "@/lib/text";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DATE_FORMATTERS = {
  long: new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }),
  iso: new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }),
  monthDay: new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }),
  readable: new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
};

export function formatDate(
  value: string | Date | null | undefined,
  style: keyof typeof DATE_FORMATTERS = "iso",
) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return DATE_FORMATTERS[style].format(date);
}

export function formatDateParts(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return {
    year: date.getFullYear(),
    month: `${date.getMonth() + 1}`.padStart(2, "0"),
    day: `${date.getDate()}`.padStart(2, "0"),
  };
}

export function formatNumber(value: number) {
  if (value >= 10_000) return `${(value / 10_000).toFixed(1)}w`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return `${value}`;
}

export function paginate<T>(items: T[], page = 1, perPage = 6): Paginated<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = (current - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    page: current,
    perPage,
    total,
    totalPages,
  };
}

export function truncate(value: string, max = 140) {
  const text = value.trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** `2025-01-20` -> `2025/01/20` is handled by formatDate; this only normalises input. */
export function toISODate(value: string | Date) {
  return (typeof value === "string" ? new Date(value) : value).toISOString();
}

export function pluralPosts(count: number) {
  return `${count} 篇`;
}

/** Safe hostname extraction for user supplied friend links. */
export function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] || url;
  }
}
