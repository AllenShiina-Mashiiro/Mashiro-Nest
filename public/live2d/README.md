# Live2D 资源

看板娘运行时是 `public/vendor/l2d-widget.min.js`（[l2d-widget](https://github.com/hacxy/l2d-widget) 的官方
IIFE 构建，自带 Cubism 2 / 4 运行时），由 `src/components/live2d/live2d.tsx` 在页面空闲后按需加载。

## 目录约定

```text
public/live2d/
└── models/
    └── character-01/
        ├── model.json          # Cubism 2
        ├── *.png               # 纹理
        └── *.mtn / *.json      # 动作、表情、物理
```

Cubism 3/4 模型用 `xxx.model3.json` 作为入口，同样放在这里，不需要额外的 Core 文件。

## 换模型

编辑 `src/config/live2d.ts`：

```ts
models: [
  { path: "/live2d/models/character-01/model.json", scale: 1 },
  // 传多个模型时，悬浮菜单里会自动出现切换按钮
  // { path: "/live2d/models/character-02/model3.json" },
],
```

默认配置指向库作者的演示模型（`https://model.hacxy.cn/cat-black/model.json`），
换成自己的模型后不要依赖那个地址。

模型文件不存在时组件不会渲染任何东西，开发环境控制台会提示缺哪个文件。

## 升级运行时

npm 包只用来取这个构建产物，升级后要手动同步一次：

```bash
npm update l2d-widget
cp node_modules/l2d-widget/dist/index.min.js public/vendor/l2d-widget.min.js
```

> 请确认所用模型的授权（商用 / 二次元形象 / 作者署名要求）。
