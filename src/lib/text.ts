/**
 * Dependency-free text helpers shared by the site, the seed script and the
 * demo data source. Keep this module free of imports so it can run under tsx.
 */

export const PALETTE = [
  "#f48fb6",
  "#7dd3b8",
  "#8fb8f4",
  "#f4b78f",
  "#b79bf4",
  "#f4d78f",
  "#8fe0f4",
  "#f48f9e",
];

export function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100_000;
  }
  return PALETTE[hash % PALETTE.length];
}

export function slugifyTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "");
}

/** Counts CJK characters as one word each, and latin words as one word. */
export function countWords(source: string) {
  const text = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*-]/g, " ");

  const cjk = text.match(/[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g);
  const latin = text
    .replace(/[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g, " ")
    .match(/[A-Za-z0-9][A-Za-z0-9'’.-]*/g);

  return (cjk?.length ?? 0) + (latin?.length ?? 0);
}

export function estimateReadingTime(wordCount: number) {
  return Math.max(1, Math.round(wordCount / 300));
}
