/** 音乐播放器的公共类型。 */

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  /** 封面地址；留空时播放器显示占位封面 */
  cover: string;
  /** 音频地址，第一阶段只用 public/music 下的本地文件 */
  url: string;
}

/** off：播到最后一首停止；all：列表循环；one：单曲循环 */
export type RepeatMode = "off" | "all" | "one";

export interface MusicConfig {
  enabled: boolean;
  /** 浏览器通常会拦截自动播放，默认保持关闭 */
  autoplay: boolean;
  /** 初始是否列表循环 */
  loop: boolean;
  /** 初始是否随机播放 */
  shuffle: boolean;
  /** 初始音量 0~1 */
  volume: number;
  tracks: MusicTrack[];
}
