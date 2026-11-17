import { getRedis } from "@/lib/redis";

/**
 * Fixed-window rate limiter. Without Redis it degrades to a process-local map,
 * which is enough to slow down brute force attempts on a single instance.
 */
const local = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const redis = getRedis();
  if (redis) {
    try {
      const namespaced = `${process.env.CACHE_PREFIX ?? "mizuki"}:rl:${key}`;
      const count = await redis.incr(namespaced);
      if (count === 1) await redis.expire(namespaced, windowSeconds);
      return { ok: count <= limit, remaining: Math.max(0, limit - count) };
    } catch {
      // fall through to the in-memory limiter
    }
  }

  const now = Date.now();
  const entry = local.get(key);
  if (!entry || entry.resetAt <= now) {
    local.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { ok: true, remaining: limit - 1 };
  }

  entry.count += 1;
  return { ok: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
}

export function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "local";
}
