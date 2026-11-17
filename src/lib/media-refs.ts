import { storeInstance } from "@/lib/data";
import { dedupeMedia, keyFromUrl, listMedia } from "@/lib/media";
import type { MediaItem } from "@/lib/types";

/**
 * Orphan detection: anything in `uploads/` that no post, moment, user, friend,
 * anime entry or site setting references can be deleted safely.
 */

export type OrphanReport = {
  total: number;
  referenced: number;
  orphans: Array<MediaItem & { copies: number }>;
  duplicates: number;
  bytes: number;
};

export async function referencedKeys() {
  const store = await storeInstance();
  const references = await store.listMediaReferences();
  const keys = new Set<string>();
  for (const url of references) {
    const key = keyFromUrl(url);
    if (key) keys.add(key);
  }
  return keys;
}

export async function scanMedia(): Promise<OrphanReport> {
  const [items, keys] = await Promise.all([listMedia(), referencedKeys()]);

  const unique = dedupeMedia(items);
  const orphans = unique.filter((item) => !keys.has(item.key));
  const duplicates = items.length - unique.length;

  return {
    total: items.length,
    referenced: unique.length - orphans.length,
    orphans,
    duplicates,
    bytes: orphans.reduce((total, item) => total + item.size, 0),
  };
}

/** Media list plus an "is it used" flag, for the library grid. */
export async function listMediaWithUsage() {
  const [items, keys] = await Promise.all([listMedia(), referencedKeys()]);
  return dedupeMedia(items).map((item) => ({ ...item, used: keys.has(item.key) }));
}
