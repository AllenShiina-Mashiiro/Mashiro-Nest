import type { MusicConfig } from "@/types/music";

/**
 * 网页音乐播放器配置。
 *
 * 加歌步骤：
 * 1. 把音频放到 public/music/tracks/，封面放到 public/music/covers/；
 * 2. 在下面的 tracks 里追加一条（id 唯一即可）；
 * 3. 不需要改任何组件代码。
 *
 * demo-chime.wav / demo.svg 只是让播放器开箱可见的示例资源，可以整个删掉。
 */
export const musicConfig: MusicConfig = {
  enabled: true,

  autoplay: false,

  loop: true,

  shuffle: false,

  volume: 0.7,

  tracks: [
    {
      id: "demo-chime",
      title: "风铃（示例音轨）",
      artist: "Mashiro Nest",
      cover: "/music/covers/demo.svg",
      url: "/music/tracks/demo-chime.wav",
    },
  ],
};
