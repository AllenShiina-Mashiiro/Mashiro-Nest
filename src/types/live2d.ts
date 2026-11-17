/** 看板娘（Live2D）配置类型。 */

export type Live2DPosition = "bottom-left" | "bottom-right";

export type Live2DTips = {
  /** 入场后随机显示一条欢迎语 */
  welcome?: string[];
  /** 循环提示内容 */
  messages?: string[];
  /** 每条显示多久（ms） */
  durationMs?: number;
  /** 循环间隔（ms） */
  intervalMs?: number;
  /** 逐字打字速度（ms/字）；配置后启用打字动画 */
  typingSpeed?: number;
  /** 嘴型参数名，例如 PARAM_MOUTH_OPEN_Y；不填只打字不驱动嘴型 */
  mouthParam?: string;
};

export type Live2DModel = {
  /** Cubism 2 用 model.json，Cubism 3/4 用 xxx.model3.json */
  path: string;
  /** 缩放比例，默认 1 */
  scale?: number;
  /** 位置微调 [x, y]，范围通常 -2 ~ 2 */
  offset?: [number, number];
  /** 该模型专属气泡配置，传 false 关闭 */
  tips?: Live2DTips | false;
};

export type Live2DConfig = {
  enabled: boolean;
  /** 传多个模型时，悬浮菜单里会自动出现切换按钮 */
  models: Live2DModel[];
  position: Live2DPosition;
  size: number | { width: number; height: number };
  /** 菜单、状态条的强调色 */
  primaryColor: string;
  /** 入场/退场动画时长（ms） */
  transitionDuration: number;
  transitionType: "slide" | "fade";
  /** 延迟多久再加载，避免和首屏抢带宽 */
  loadDelayMs: number;
  mobile: { enabled: boolean; maxWidth: number };
  /** 系统开启“减少动态效果”时是否直接不显示 */
  respectReducedMotion: boolean;
  /** Cubism 3/4 模型必须先加载 Cubism Core，这里填 public 下的相对路径 */
  cubismCoreSrc?: string;
  /** 追加一个“让她休息”的菜单项，不填则不加 */
  restMenuLabel?: string;
};
