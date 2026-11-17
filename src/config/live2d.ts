import type { Live2DConfig } from "@/types/live2d";

/**
 * 看板娘配置（基于 l2d-widget，见 https://github.com/hacxy/l2d-widget）。
 *
 * 放模型：
 *   public/live2d/models/character-01/model.json      ← Cubism 2 模型，开箱即用
 *   public/live2d/models/character-02/model.model3.json ← Cubism 3/4，需要 Cubism Core
 * Cubism 3/4 还需要把 live2dcubismcore.min.js 放到 public/live2d/core/，
 * 并在下面打开 cubismCoreSrc。
 *
 * 模型没放进来时组件不会渲染任何东西（开发环境控制台会给一条提示），不会留下半截 UI。
 */
export const live2dConfig: Live2DConfig = {
  enabled: true,

  position: "bottom-left",

  size: 280,

  primaryColor: "rgba(76, 186, 155, 0.92)",

  transitionDuration: 900,

  transitionType: "slide",

  loadDelayMs: 1600,

  mobile: {
    enabled: false,
    maxWidth: 767,
  },

  respectReducedMotion: true,

  restMenuLabel: "让她休息一下",

  // Cubism 3/4 模型才需要：
  // cubismCoreSrc: "/live2d/core/live2dcubismcore.min.js",

  models: [
    {
      path: "/live2d/models/character-01/model.json",
      scale: 1,
      tips: {
        welcome: ["欢迎来到真白屋！", "好久不见，今天也来看看吧～"],
        messages: [
          "今天也要好好休息哦。",
          "记得多喝水～",
          "点我可以看看动作。",
        ],
        durationMs: 3200,
        intervalMs: 12000,
        typingSpeed: 90,
      },
    },
  ],
};
