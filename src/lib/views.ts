import { getRedis } from "@/lib/redis";

const HASH_KEY = (process.env.CACHE_PREFIX ?? "mizuki") + ":views:delta";
const memory = new Map<string, number>();

/**
 * View counters are written to Redis (a hash field per slug) and only flushed
 * into PostgreSQL by the scheduler; that keeps the hot path write-free.
 */
export async function incrementViews(slug: string): Promise<number> {
  const redis = getRedis();
  if (redis) {
    try {
      return await redis.hincrby(HASH_KEY, slug, 1);
    } catch {
      // fall through to memory
    }
  }

  const next = (memory.get(slug) ?? 0) + 1;
  memory.set(slug, next);
  return next;
}

export async function readViewDeltas(): Promise<Record<string, number>> {
  const redis = getRedis();
  if (redis) {
    try {
      const raw = await redis.hgetall(HASH_KEY);
      const parsed: Record<string, number> = {};
      for (const [slug, value] of Object.entries(raw)) parsed[slug] = Number(value) || 0;
      return { ...parsed, ...Object.fromEntries(memory) };
    } catch {
      // fall through
    }
  }
  return Object.fromEntries(memory);
}

export async function viewDeltaFor(slug: string): Promise<number> {
  const deltas = await readViewDeltas();
  return deltas[slug] ?? 0;
}

export async function flushViewDeltas(
  persist: (deltas: Record<string, number>) => Promise<void>,
) {
  const deltas = await readViewDeltas();
  if (!Object.keys(deltas).length) return;
  await persist(deltas);

  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(HASH_KEY);
    } catch {
      // ignore
    }
  }
  memory.clear();
}
