"use client";

import { useEffect } from "react";
import type { ModelOptions, TipsOptions, Widget } from "l2d-widget";
import { live2dConfig } from "@/config/live2d";
import type { Live2DModel, Live2DTips } from "@/types/live2d";

/**
 * 看板娘：运行时是 public/vendor/l2d-widget.min.js（官方 IIFE 构建）。
 *
 * 为什么不用 `import("l2d-widget")`：
 * 它的 ESM 产物在模块初始化阶段就读取 `Live2DCubismCore` 全局，经 webpack
 * 生产构建（压缩/常量折叠）后这个读取会被提前到模块顶层执行，没预加载
 * Cubism Core 时会直接抛 `ReferenceError: Live2DCubismCore is not defined`，
 * 而 dev 模式不压缩所以看不出来。IIFE 构建自带 Cubism 2 / 4 两份 Core，
 * 用 <script> 按需加载最稳，也符合它官方文档的接入方式。
 */

type WidgetGlobal = { createWidget: (options: unknown) => Widget };
type WindowWithWidget = Window & { L2D_WIDGET?: WidgetGlobal };

/** 同一个运行时只加载一次；失败后允许下次重试 */
let bundlePromise: Promise<WidgetGlobal | null> | null = null;

function loadWidgetBundle(src: string) {
  if (bundlePromise) return bundlePromise;

  bundlePromise = new Promise<WidgetGlobal | null>((resolve) => {
    const ready = (window as WindowWithWidget).L2D_WIDGET;
    if (ready) {
      resolve(ready);
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.l2dWidget = src;
    script.addEventListener(
      "load",
      () => resolve((window as WindowWithWidget).L2D_WIDGET ?? null),
      { once: true },
    );
    script.addEventListener(
      "error",
      () => {
        script.remove();
        bundlePromise = null;
        resolve(null);
      },
      { once: true },
    );
    document.head.appendChild(script);
  });

  return bundlePromise;
}

function isDev() {
  return process.env.NODE_ENV !== "production";
}

/** 配置缺失（模型没放进去）只在开发环境提示，生产环境保持安静 */
function warnSetup(message: string) {
  if (isDev()) console.warn(message);
}

/** 初始化失败是真实故障，任何环境都留一条可查的日志 */
function warnFailure(message: string, error?: unknown) {
  console.warn(message, error ?? "");
}

/**
 * 先用 HEAD 探一下模型文件在不在。
 * 不做这一步的话，模型缺失时库会把「加载中」状态条永久留在页面上。
 */
async function modelExists(path: string) {
  // 远程模型不做预检：跨域 HEAD 可能被 CORS 拦，交给库自己报错
  if (!path.startsWith("/")) return true;
  try {
    const response = await fetch(path, { method: "HEAD", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

function toTipsOptions(tips: Live2DTips): TipsOptions {
  return {
    welcomeMessage: tips.welcome,
    messages: tips.messages,
    duration: tips.durationMs,
    interval: tips.intervalMs,
    typing: tips.typingSpeed
      ? { speed: tips.typingSpeed, param: tips.mouthParam }
      : undefined,
  };
}

function toModelOptions(model: Live2DModel): ModelOptions {
  const tips =
    model.tips === false ? false : model.tips ? toTipsOptions(model.tips) : undefined;

  return {
    path: model.path,
    scale: model.scale,
    offset: model.offset,
    tips,
  };
}

export function Live2D() {
  useEffect(() => {
    const config = live2dConfig;
    if (!config.enabled || config.models.length === 0) return;

    // 移动端策略：关掉就完全不创建实例（也就不下载模型）
    if (!config.mobile.enabled) {
      if (window.matchMedia(`(max-width: ${config.mobile.maxWidth}px)`).matches) return;
    }
    if (
      config.respectReducedMotion &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let disposed = false;
    let widget: Widget | null = null;
    let timer = 0;

    const boot = async () => {
      const first = config.models[0];
      if (!first) return;

      if (!(await modelExists(first.path))) {
        warnSetup(
          `[live2d] 没有找到模型文件：${first.path}。` +
            "把模型放进 public/live2d/models/，或在 src/config/live2d.ts 里改路径。",
        );
        return;
      }

      const api = await loadWidgetBundle(config.bundleSrc);
      if (!api) {
        warnFailure(`[live2d] 运行时加载失败：${config.bundleSrc}`);
        return;
      }
      if (disposed) return;

      try {
        widget = api.createWidget({
          model: config.models.map(toModelOptions),
          position: config.position,
          size: config.size,
          primaryColor: config.primaryColor,
          transitionDuration: config.transitionDuration,
          transitionType: config.transitionType,
          menus: config.restMenuLabel
            ? {
                extraItems: [
                  {
                    label: config.restMenuLabel,
                    onClick: (instance: Widget) => instance.sleep(),
                  },
                ],
              }
            : undefined,
        });
      } catch (error) {
        warnFailure("[live2d] 看板娘初始化失败：", error);
      }
    };

    // 延后加载：不让运行时的下载和首屏抢带宽
    timer = window.setTimeout(() => {
      void boot();
    }, config.loadDelayMs);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      if (widget) {
        void widget.destroy();
        widget = null;
      }
    };
  }, []);

  return null;
}
