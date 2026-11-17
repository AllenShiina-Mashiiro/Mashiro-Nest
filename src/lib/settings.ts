/**
 * Site-wide settings, editable from /admin/settings and cached in Redis
 * (+ a process-local fallback). Values are stored as one row per key.
 */

import type { MusicTrack } from "@/types/music";

export type MusicSource = "local" | "netease";

export type MusicSettings = {
  enabled: boolean;
  /** local：用下面 tracks 里的本地/直链；netease：从 Meting 接口拉网易云歌单 */
  source: MusicSource;
  volume: number;
  autoplay: boolean;
  shuffle: boolean;
  /** 本地曲目（后台「音乐」里维护，一行一条） */
  tracks: MusicTrack[];
  netease: {
    /** Meting 兼容接口地址，例如 https://api.injahow.cn/meting/ */
    api: string;
    /** 网易云歌单 ID */
    playlistId: string;
  };
};

export type Live2DSettings = {
  enabled: boolean;
  /** 模型入口文件：/live2d/models/xxx/model.json 或 https:// 远程地址 */
  modelPath: string;
  position: "bottom-left" | "bottom-right";
  /** canvas 尺寸（px） */
  size: number;
  /** 手机端是否显示 */
  mobile: boolean;
  /** 入场欢迎语（随机一条） */
  welcome: string[];
  /** 循环提示语 */
  messages: string[];
};

export type SiteSettings = {
  siteName: string;
  siteSubtitle: string;
  siteDescription: string;
  siteIcon: string;
  icp: string;

  /** 联系邮箱 / GitHub / Telegram：全部可以在后台改，前台名片与导航同步。 */
  contactEmail: string;
  githubUrl: string;
  telegramUrl: string;

  heroTitle: string;
  heroSubtitle: string;
  /** Multiple backgrounds; one is picked per request (rotates). */
  heroImages: string[];
  /** Diagonal light beam + split line over the hero. */
  heroBeam: boolean;

  aboutTitle: string;
  aboutContent: string;

  loginBackground: string;

  music: MusicSettings;
  live2d: Live2DSettings;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "真白屋",
  siteSubtitle: "Mashiro Nest",
  siteDescription:
    "Mashiro Nest — 一个用 Next.js、React、PostgreSQL、Prisma、Redis、S3 与 Tailwind CSS 构建的多用户个人博客。",
  siteIcon: "/favicon.svg",
  icp: "萌 ICP 备 2025000001 号",

  contactEmail: "hello@mashiro.dev",
  githubUrl: "https://github.com/",
  telegramUrl: "",

  heroTitle: "真白屋",
  heroSubtitle: "Mashiro Nest · 记录代码与樱花",
  heroImages: ["/images/banner.svg"],
  heroBeam: true,

  aboutTitle: "关于",
  aboutContent: "",

  loginBackground: "/images/banner.svg",

  music: {
    enabled: true,
    source: "local",
    volume: 0.7,
    autoplay: false,
    shuffle: false,
    tracks: [
      {
        id: "demo-chime",
        title: "风铃（示例音轨）",
        artist: "Mashiro Nest",
        cover: "/music/covers/demo.svg",
        url: "/music/tracks/demo-chime.wav",
      },
    ],
    netease: {
      api: "https://api.injahow.cn/meting/",
      playlistId: "",
    },
  },

  live2d: {
    enabled: true,
    modelPath: "https://model.hacxy.cn/cat-black/model.json",
    position: "bottom-left",
    size: 280,
    mobile: false,
    welcome: ["欢迎来到真白屋！", "好久不见，今天也来看看吧～"],
    messages: ["今天也要好好休息哦。", "记得多喝水～", "点我可以看看动作。"],
  },
};

export const SETTINGS_KEY = "site";

/** 深层合并：库里可能是老版本数据，nested 配置要按字段兜底 */
export function mergeSettings(partial: Partial<SiteSettings> | null | undefined): SiteSettings {
  const source = partial ?? {};
  const music: MusicSettings = {
    ...DEFAULT_SETTINGS.music,
    ...(source.music ?? {}),
    netease: {
      ...DEFAULT_SETTINGS.music.netease,
      ...(source.music?.netease ?? {}),
    },
    tracks: source.music?.tracks ?? DEFAULT_SETTINGS.music.tracks,
  };
  const live2d: Live2DSettings = {
    ...DEFAULT_SETTINGS.live2d,
    ...(source.live2d ?? {}),
    welcome: source.live2d?.welcome ?? DEFAULT_SETTINGS.live2d.welcome,
    messages: source.live2d?.messages ?? DEFAULT_SETTINGS.live2d.messages,
  };

  return { ...DEFAULT_SETTINGS, ...source, music, live2d };
}
