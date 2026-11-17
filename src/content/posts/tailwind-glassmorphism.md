---
title: Tailwind CSS v4 里的「玻璃拟态」
description: Mizuki 的视觉核心是半透明卡片、斜切色块与光斑。用 Tailwind v4 的 @theme 把设计令牌收敛到一处，换主题时只改变量。
date: 2025-01-10
category: Design
tags: [Tailwind, CSS, 设计]
cover: /images/covers/design.svg
---

## 设计令牌先落地

Tailwind v4 不再推荐 `tailwind.config.js`，设计令牌直接写在 CSS 里：

```css
@import "tailwindcss";

@theme {
  --color-ink: #1c2030;
  --color-sakura-50: #fff5f8;
  --color-sakura-400: #f7a8c4;
  --color-mint-200: #b9ecd8;
  --color-mint-400: #7dd3b8;
  --radius-card: 1.25rem;
}
```

这样 `bg-sakura-50`、`text-ink`、`rounded-card` 都能直接用，同时这些变量在暗色模式下可以被覆盖。

## 玻璃卡片

三层叠加：半透明底色 + 背景模糊 + 极细的白色描边。

```html
<div class="rounded-card bg-white/80 backdrop-blur-xl ring-1 ring-white/60 
            shadow-[0_8px_30px_-12px_rgba(28,32,48,0.25)]">
  ...
</div>
```

`backdrop-blur` 在低端安卓上开销不小，所以只在卡片层和导航栏使用，背景图本身不加。

## 斜切的浅绿按钮

原主题里卡片右侧有一条斜切的浅绿色色带。用 `clip-path` 实现，比伪装成 border 更干净：

```css
.slash {
  clip-path: polygon(22% 0, 100% 0, 100% 100%, 0 100%);
}
```

再叠一层渐变让它「亮起来」：

```css
background: linear-gradient(180deg, rgba(233, 248, 241, 0.95), rgba(215, 242, 230, 0.75));
```

## 光斑

截图里那种「从左上角斜射下来的光」不是图片，是两层径向渐变：

```css
background-image:
  radial-gradient(120% 90% at 8% 0%, rgba(255, 255, 255, 0.95), transparent 60%),
  radial-gradient(90% 60% at 100% 100%, rgba(247, 168, 196, 0.35), transparent 65%);
```

便宜、可动画、不增加请求。

## 暗色模式

v4 默认跟随系统，想用 class 控制需要一行自定义变体：

```css
@custom-variant dark (&:where(.dark, .dark *));
```

然后所有卡片统一写成 `bg-white/80 dark:bg-ink/70`，描边换成 `dark:ring-white/10`。

## 小结

玻璃拟态不难写，难的是**一致**。把透明度、模糊半径、描边、阴影都收进令牌，才不至于三个月后回来看不懂自己写的 class。
