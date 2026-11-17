import type { MusicTrack } from "@/types/music";

/**
 * 网易云歌单：服务端走 Meting 兼容接口取数据，前端不直连（避免 CORS 与密钥暴露）。
 * Meting 返回值是数组，字段名在不同部署上有差异，这里做一次兼容映射。
 */

type MetingItem = {
  name?: string;
  title?: string;
  artist?: string;
  author?: string;
  url?: string;
  pic?: string;
  cover?: string;
  id?: string | number;
};

const TTL = 10 * 60 * 1000;
const cache = new Map<string, { at: number; tracks: MusicTrack[] }>();

export type RemotePlaylistResult =
  | { ok: true; tracks: MusicTrack[]; cached: boolean }
  | { ok: false; error: string; tracks: MusicTrack[] };

export function buildMetingUrl(api: string, playlistId: string) {
  const base = api.trim();
  if (!base || !playlistId.trim()) return null;
  const url = new URL(base);
  url.searchParams.set("server", "netease");
  url.searchParams.set("type", "playlist");
  url.searchParams.set("id", playlistId.trim());
  return url.toString();
}

function mapItem(item: MetingItem, index: number): MusicTrack | null {
  const url = (item.url ?? "").trim();
  if (!url) return null;
  return {
    id: String(item.id ?? `netease-${index}`),
    title: (item.name ?? item.title ?? "未知曲目").trim(),
    artist: (item.artist ?? item.author ?? "网易云音乐").trim(),
    cover: (item.pic ?? item.cover ?? "").trim(),
    url,
  };
}

export async function fetchNeteaseTracks(
  api: string,
  playlistId: string,
): Promise<RemotePlaylistResult> {
  const target = buildMetingUrl(api, playlistId);
  if (!target) return { ok: false, error: "请先在后台填写 Meting 接口地址和歌单 ID", tracks: [] };

  const hit = cache.get(target);
  if (hit && Date.now() - hit.at < TTL) {
    return { ok: true, tracks: hit.tracks, cached: true };
  }

  try {
    const response = await fetch(target, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return { ok: false, error: `歌单接口返回 ${response.status}`, tracks: [] };
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      return { ok: false, error: "歌单接口返回的不是数组，请确认是 Meting 兼容接口", tracks: [] };
    }

    const tracks = (payload as MetingItem[])
      .slice(0, 200)
      .map(mapItem)
      .filter((track): track is MusicTrack => Boolean(track));

    cache.set(target, { at: Date.now(), tracks });
    return { ok: true, tracks, cached: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return { ok: false, error: `歌单拉取失败：${message}`, tracks: [] };
  }
}
