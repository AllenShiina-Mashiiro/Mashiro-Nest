"use client";

import { useEffect } from "react";
import type { ModelOptions, Widget } from "l2d-widget";
import type { Live2DSettings } from "@/lib/settings";

/**
 * 看板娘：运行时是 public/vendor/l2d-widget.min.js（官方 IIFE 构建）。
 *
 * 为什么不用 `import("l2d-widget")`：
 * 它的 ESM 产物在模块初始化阶段就读取 `Live2DCubismCore` 全局，经 webpack
 * 生产构建压缩后这个读取会被提前到模块顶层执行，没预加载 Cubism Core 时会
 * 直接抛 `ReferenceError: Live2DCubismCore is not defined`（dev 模式不压缩，
 * 所以看不出来）。IIFE 构建自带 Cubism 2 / 4 两份 Core，用 <script> 按需加载最稳。
 */

type WidgetGlobal = { createWidget: (options: unknown) => Widget };
type WindowWithWidget = Window & { L2D_WIDGET?: WidgetGlobal };

const BUNDLE_SRC = "/vendor/l2d-widget.min.js";
const LOAD_DELAY_MS = 1600;
const TRANSITION_MS = 900;

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

export function Live2D({ settings }: { settings: Live2DSettings }) {
  useEffect(() => {
    if (!settings.enabled || !settings.modelPath) return;

    // 移动端策略：关掉就完全不创建实例（也就不下载模型）
    if (!settings.mobile && window.matchMedia("(max-width: 767px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let widget: Widget | null = null;
    let timer = 0;

    const boot = async () => {
      if (!(await modelExists(settings.modelPath))) {
        warnSetup(
          `[live2d] 没有找到模型文件：${settings.modelPath}。` +
            "把模型放进 public/live2d/models/，或在后台「看板娘」里改路径。",
        );
        return;
      }

      const api = await loadWidgetBundle(BUNDLE_SRC);
      if (!api) {
        warnFailure(`[live2d] 运行时加载失败：${BUNDLE_SRC}`);
        return;
      }
      if (disposed) return;

      const model: ModelOptions = {
        path: settings.modelPath,
        scale: 1,
        tips: {
          welcomeMessage: settings.welcome.length ? settings.welcome : undefined,
          messages: settings.messages.length ? settings.messages : undefined,
          duration: 3200,
          interval: 12000,
          typing: { speed: 90 },
        },
      };

      try {
        widget = api.createWidget({
          model,
          position: settings.position,
          size: settings.size,
          primaryColor: "rgba(76, 186, 155, 0.92)",
          transitionDuration: TRANSITION_MS,
          transitionType: "slide",
          // 图标来自 Iconify，加载不到时会退化成文字；不锁住换行就会被挤成竖排
          menus: {
            style: { whiteSpace: "nowrap", fontSize: "12px", lineHeight: "1.4" },
          },
          statusBar: {
            style: { whiteSpace: "nowrap", fontSize: "12px", lineHeight: "1.4" },
          },
        });
      } catch (error) {
        warnFailure("[live2d] 看板娘初始化失败：", error);
      }
    };

    // 延后加载：不让运行时的下载和首屏抢带宽
    timer = window.setTimeout(() => {
      void boot();
    }, LOAD_DELAY_MS);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      if (widget) {
        void widget.destroy();
        widget = null;
      }
    };
  }, [settings]);

  return null;
}
