import { getRedis } from "@/lib/redis";

type Entry = { value: string; expiresAt: number };

const memory = new Map<string, Entry>();
const PREFIX = process.env.CACHE_PREFIX ?? "mizuki";

export function cacheEnabled() {
  return process.env.CACHE_DISABLED !== "1";
}

function redisKey(key: string) {
  return `${PREFIX}:${key}`;
}

export async function cacheGet(key: string): Promise<string | null> {
  if (!cacheEnabled()) return null;

  const redis = getRedis();
  if (redis) {
    try {
      return await redis.get(redisKey(key));
    } catch {
      // fall through to memory
    }
  }

  const hit = memory.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    memory.delete(key);
    return null;
  }
  return hit.value;
}

export async function cacheSet(key: string, value: string, ttlSeconds = 60) {
  if (!cacheEnabled()) return;

  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(redisKey(key), value, "EX", ttlSeconds);
      return;
    } catch {
      // fall through to memory
    }
  }

  if (memory.size > 500) memory.clear();
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDel(...keys: string[]) {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(...keys.map(redisKey));
    } catch {
      // ignore
    }
  }
  for (const key of keys) memory.delete(key);
}

export async function cacheDelByPrefix(prefix: string) {
  for (const key of [...memory.keys()]) {
    if (key.startsWith(prefix)) memory.delete(key);
  }

  const redis = getRedis();
  if (!redis) return;
  try {
    let cursor = "0";
    do {
      const [next, found] = await redis.scan(
        cursor,
        "MATCH",
        redisKey(`${prefix}*`),
        "COUNT",
        200,
      );
      cursor = next;
      if (found.length) await redis.del(...found);
    } while (cursor !== "0");
  } catch {
    // ignore
  }
}

/** Read-through cache helper. Never throws because of a cache problem. */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = await cacheGet(key);
  if (hit) {
    try {
      return JSON.parse(hit) as T;
    } catch {
      // corrupted payload, ignore
    }
  }

  const value = await loader();
  try {
    await cacheSet(key, JSON.stringify(value), ttlSeconds);
  } catch {
    // ignore
  }
  return value;
}

/** Best-effort cache invalidation used by the admin mutations. */
export async function invalidateContent() {
  await cacheDelByPrefix("content:");
  await cacheDelByPrefix("post:");
  await cacheDelByPrefix("search:");
}
