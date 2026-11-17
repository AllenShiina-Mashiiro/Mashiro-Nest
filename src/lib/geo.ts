import { headers } from "next/headers";

/**
 * Best-effort visitor location for the About page. Never blocks the render for
 * more than ~700ms and silently falls back to the profile location.
 */
const cache = new Map<string, { value: string | null; expires: number }>();

function normalizeIp(ip: string | null): string | null {
  if (!ip) return null;
  const first = ip.split(",")[0]?.trim();
  if (!first) return null;
  if (first === "::1" || first.startsWith("127.") || first.startsWith("192.168.") || first.startsWith("10.")) {
    return null;
  }
  return first.replace(/^::ffff:/, "");
}

export async function visitorLocation(): Promise<string | null> {
  if (process.env.DISABLE_IP_LOCATION === "1") return null;

  let ip: string | null = null;
  try {
    const store = await headers();
    ip = normalizeIp(store.get("x-forwarded-for") ?? store.get("x-real-ip"));
  } catch {
    return null;
  }
  if (!ip) return null;

  const hit = cache.get(ip);
  if (hit && hit.expires > Date.now()) return hit.value;

  let value: string | null = null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 700);
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (response.ok) {
      const data = (await response.json()) as {
        country_name?: string;
        region?: string;
        city?: string;
      };
      value = [data.country_name, data.region, data.city].filter(Boolean).join(" · ") || null;
    }
  } catch {
    value = null;
  }

  cache.set(ip, { value, expires: Date.now() + 3_600_000 });
  return value;
}
