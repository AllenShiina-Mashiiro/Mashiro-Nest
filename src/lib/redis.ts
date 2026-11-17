import Redis from "ioredis";

/**
 * Redis is optional. When `REDIS_URL` is absent (or the server is unreachable)
 * every cache helper degrades to an in-process Map so the site keeps working.
 */
let client: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (client !== undefined) return client;

  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    client = null;
    return client;
  }

  try {
    const instance = new Redis(url, {
      lazyConnect: false,
      connectTimeout: 1500,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 250, 1000)),
    });
    // Cache failures must never crash the request.
    instance.on("error", () => undefined);
    client = instance;
  } catch {
    client = null;
  }

  return client;
}

export function hasRedis() {
  return Boolean(process.env.REDIS_URL?.trim());
}
