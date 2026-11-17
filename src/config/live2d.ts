import type { Live2DConfig } from "@/types/live2d";

/**
 * 看板娘配置（基于 l2d-widget，见 https://github.com/hacxy/l2d-widget）。
 *
 * 模型：
 *   默认用库作者的演示模型（Cubism 2），第一次打开就能看到效果；
 *   正式使用请换成自己的本地模型：
 *   1. 模型放到 public/live2d/models/<名字>/model.json（连同纹理、动作、物理文件）；
 *   2. 把下面的 path 改成 "/live2d/models/<名字>/model.json"；
 *   3. Cubism 3/4 模型（*.model3.json）也可以直接用，运行时自带 Cubism Core。
 *
 * 模型文件不存在时组件不会渲染任何东西（开发环境控制台会给提示），不会留下半截 UI。
 */
export const live2dConfig: Live2DConfig = {
  enabled: true,

  /** 官方 IIFE 构建，自带 Cubism 2 / 4 运行时；放在 public 下，按需加载 */
  bundleSrc: "/vendor/l2d-widget.min.js",

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

  models: [
    {
      // 演示模型，来源：l2d-widget 官方示例
      path: "https://model.hacxy.cn/cat-black/model.json",
      scale: 1,
      tips: {
        welcome: ["欢迎来到真白屋！", "好久不见，今天也来看看吧～"],
        messages: ["今天也要好好休息哦。", "记得多喝水～", "点我可以看看动作。"],
        durationMs: 3200,
        intervalMs: 12000,
        typingSpeed: 90,
      },
    },
  ],
};
