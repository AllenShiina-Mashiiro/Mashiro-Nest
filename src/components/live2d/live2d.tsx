"use client";

import { useEffect } from "react";
import type { ModelOptions, TipsOptions, Widget } from "l2d-widget";
import { live2dConfig } from "@/config/live2d";
import type { Live2DModel, Live2DTips } from "@/types/live2d";

/**
 * 看板娘：底层用 l2d-widget（hacxy/l2d-widget），不用静态 import ——
 * 它会在模块求值阶段访问 document，必须在浏览器里按需 import。
 * 组件只负责"什么时候挂、挂什么配置、什么时候销毁"，渲染交给库。
 */

function isDev() {
  return process.env.NODE_ENV !== "production";
}

function warn(message: string, error?: unknown) {
  if (isDev()) console.warn(message, error ?? "");
}

/** Cubism Core 只加载一次；已加载过就直接返回 */
function loadCubismCore(src: string) {
  return new Promise<boolean>((resolve) => {
    if (document.querySelector(`script[data-live2d-core="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.live2dCore = src;
    script.addEventListener("load", () => resolve(true), { once: true });
    script.addEventListener(
      "error",
      () => {
        script.remove();
        resolve(false);
      },
      { once: true },
    );
    document.head.appendChild(script);
  });
}

/**
 * 先用 HEAD 探一下模型文件在不在。
 * 不做这一步的话，模型缺失时库会把「加载中」状态条永久留在页面上。
 */
async function modelExists(path: string) {
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

    // 移动端策略：配置里关掉就完全不创建实例（也就不下载模型）
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
        warn(
          `[live2d] 没有找到模型文件：${first.path}。` +
            "把模型放进 public/live2d/models/，或在 src/config/live2d.ts 里改路径。",
        );
        return;
      }

      if (config.cubismCoreSrc) {
        const loaded = await loadCubismCore(config.cubismCoreSrc);
        if (!loaded) {
          warn(`[live2d] Cubism Core 加载失败：${config.cubismCoreSrc}（Cubism 3/4 模型必需）`);
          return;
        }
      }

      if (disposed) return;

      try {
        const { createWidget } = await import("l2d-widget");
        if (disposed) return;

        widget = createWidget({
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
                    onClick: (instance) => instance.sleep(),
                  },
                ],
              }
            : undefined,
        });
      } catch (error) {
        warn("[live2d] 看板娘初始化失败：", error);
      }
    };

    // 延后加载：不让 800KB 的运行时和首屏抢带宽
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
