import { NextResponse } from "next/server";
import { getSettings } from "@/lib/data";
import { fetchNeteaseTracks } from "@/lib/netease";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 播放器曲目接口。
 * - source=local：直接返回后台配置的本地曲目；
 * - source=netease：服务端代拉 Meting 歌单（10 分钟缓存），避免浏览器跨域。
 */
export async function GET() {
  const settings = await getSettings();
  const music = settings.music;

  if (!music.enabled || music.source !== "netease") {
    return NextResponse.json({ source: "local", tracks: music.tracks });
  }

  const result = await fetchNeteaseTracks(music.netease.api, music.netease.playlistId);
  return NextResponse.json(
    {
      source: "netease",
      tracks: result.tracks,
      cached: result.ok ? result.cached : false,
      error: result.ok ? null : result.error,
    },
    { status: result.ok ? 200 : 502 },
  );
}
