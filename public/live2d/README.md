# Live2D 资源

看板娘运行时由 [`l2d-widget`](https://github.com/hacxy/l2d-widget) 提供，模型文件需要你自己放。

## 目录约定

```text
public/live2d/
├── models/
│   └── character-01/
│       ├── model.json          # Cubism 2
│       ├── *.png               # 纹理
│       └── *.mtn / *.json      # 动作、表情、物理
└── core/
    └── live2dcubismcore.min.js # 只有 Cubism 3/4 模型才需要
```

## 两种模型格式

| 格式 | 入口文件 | 额外依赖 |
| --- | --- | --- |
| Cubism 2 | `model.json` | 不需要，运行时已内置 |
| Cubism 3 / 4 | `xxx.model3.json` | 需要 `public/live2d/core/live2dcubismcore.min.js` |

Cubism Core 由 Live2D 官方发布，需要在 <https://www.live2d.com/en/sdk/download/web/> 下载并遵守其授权条款，
本项目不附带该文件。

Cubism 3/4 模型除了放好 core 文件，还要在 `src/config/live2d.ts` 里打开：

```ts
cubismCoreSrc: "/live2d/core/live2dcubismcore.min.js",
```

## 改路径

模型放好后编辑 `src/config/live2d.ts` 的 `models`：

```ts
models: [
  { path: "/live2d/models/character-01/model.json", scale: 1 },
  // 传多个模型时，悬浮菜单里会自动出现切换按钮
  // { path: "/live2d/models/character-02/model3.json" },
],
```

模型文件不存在时组件不会渲染任何东西，开发环境控制台会提示缺哪个文件。

> 请确认所用模型的授权（商用 / 二次元形象 / 作者署名要求）。
