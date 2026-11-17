---
title: Include Video in the Posts
description: 如何在文章里优雅地嵌入视频与音乐播放器。
date: 2024-11-02
category: Technology
tags: [Markdown, Video, Blogging]
cover: /images/covers/video.svg
---

## 为什么单独写一篇

视频、音频这类富媒体在文章里很容易破坏排版：固定宽度、固定高度、移动端溢出。这里给出一套可复用的做法。

## 使用原生 video 标签

```html
<video controls playsinline class="w-full rounded-2xl">
  <source src="https://cdn.example.com/demo.mp4" type="video/mp4" />
</video>
```

## 嵌入外链播放器

```html
<iframe
  class="aspect-video w-full rounded-2xl"
  src="https://player.bilibili.com/player.html?bvid=BV1xx411c7mD"
  allowfullscreen
></iframe>
```

## 用比例容器兜底

在 CSS 中给 iframe 外层加上 `aspect-video`，这样无论视频源给出什么尺寸，都不会撑破文章容器：

```css
.media-frame iframe {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 1rem;
}
```

## 小结

富媒体本身不难，难的是在不同设备上都不出错。统一容器、统一圆角、统一 `aspect-ratio`，排版就稳了。
