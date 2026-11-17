---
title: Markdown Example
description: A simple example of a Markdown blog post.
date: 2023-01-01
category: Examples
tags: [Markdown, Blogging]
cover: /images/covers/example.svg
---

# 一级标题

这是 Mizuki 主题的示例文章，用来检查各种 Markdown 元素在深色与浅色模式下的表现。

## 段落与强调

一段普通的文字，用来观察行高、字距与段间距。紧接着是 **加粗文字**、*斜体文字*、***加粗斜体***，以及行内的 `code span`。

## 列表

- 第一项
  - 嵌套项 A
  - 嵌套项 B
- 第二项
- 第三项

1. 步骤一
2. 步骤二
3. 步骤三

## 任务列表

- [x] 搭好 Next.js 骨架
- [x] 接上 Prisma
- [ ] 写满一百篇文章

## 代码

```js
const posts = await prisma.post.findMany({
  where: { published: true },
  orderBy: { publishedAt: "desc" },
  include: { tags: { include: { tag: true } } },
});
```

## 分隔线

---

## 结束

到这里，示例文章结束。
