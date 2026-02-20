# MCBE Glyph Painter

[English](./README.md) | [简体中文]

一个专门为我的世界基岩版 (MCBE) 设计的强大工具，用于创建和管理自定义字体符号（Unicode 私有区）。

## 🎨 项目概览

在《我的世界》基岩版中，可以通过 Unicode 私有区 (PUA) 里的 `glyph_E0/E1/E?...png` 文件来实现自定义图标和表情包。MCBE 采用精灵图（通常为 256x256 像素，但可缩放）系统，并将其切割成 16x16 的网格。网格中的每个格子代表一个符号。

**MCBE Glyph Painter** 通过以下功能简化了这一过程：
- **快速复制码点**：快速复制任何切片的 Unicode 十六进制代码。
- **以切片为单位的编辑**：在特定的网格单元内进行精确编辑，防止意外“画出界”影响到相邻的符号。
- **实时视觉反馈**：实时预览符号在游戏中的表现。

## 🛠️ 技术栈

- **框架**: [React 19](https://react.dev/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **UI 库**: [Chakra UI](https://chakra-ui.com/)
- **状态管理**: [React Hooks](https://react.dev/reference/react/hooks) & [LocalForage](https://github.com/localForage/localForage)
- **动画**: [Framer Motion](https://www.framer.com/motion/)
- **国际化**: [i18next](https://www.i18next.com/)

## 📂 项目结构
*更新于 2026年2月20日*

```text
MCBE Glyph Painter/
├── src/
│   ├── components/       # 可复用 UI 组件 (GlyphEditor, SliceEditor 等)
│   ├── pages/            # 页面级组件 (Home, ProjectEditor 等)
│   ├── hooks/            # 自定义 React hooks
│   ├── i18n/             # 国际化配置
│   ├── utils/            # 工具函数 (存储, 图像处理)
│   ├── types.ts          # 全局类型定义
│   └── App.tsx           # 应用主入口
├── public/               # 静态资源
└── LICENSE               # MIT 开源协议
```

## 🚀 路线图 (待办事项)

- [ ] 📋 **跨图片复制切片**：可以复制某一张图的某个切片，并粘贴到另一个文件的切片中。
- [ ] 🖼️ **独立 PNG 图片编辑**：支持编辑独立的 PNG 图片，不再受限于项目。
- [ ] ⌨️ **键盘快捷键**：添加快捷键以提高工作效率。
- [x] 🎨 **核心绘画引擎**：基础的切片编辑和绘制功能。

## 📄 开源协议

本项目采用 [MIT License](./LICENSE) 开源协议。
