# MCBE Glyph Painter

[English] | [简体中文](./README_zh.md)

A powerful tool designed for Minecraft Bedrock Edition (MCBE) to create and manage custom font glyphs (unicode Private Use Area).

## 🎨 Overview

In Minecraft Bedrock Edition, custom icons and emojis can be implemented using `glyph_E0/E1/E?...png` files within the Unicode Private Use Area (PUA). MCBE uses a spritesheet system (typically 256x256 pixels, but scalable) that is split into a 16x16 grid. Each cell in this grid represents one glyph.

**MCBE Glyph Painter** simplifies this process by providing:
- **Instant Codepoint Access**: Quickly copy the unicode hex code for any slice.
- **Slice-Based Editing**: Precision editing within a specific 16x16 (or relevant) grid cell, preventing accidental "overflow" into adjacent glyphs.
- **Visual Feedback**: Real-time preview of how glyphs will appear.

## 🛠️ Technology Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [Chakra UI](https://chakra-ui.com/)
- **State Management**: [React Hooks](https://react.dev/reference/react/hooks) & [LocalForage](https://github.com/localForage/localForage)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Internationalization**: [i18next](https://www.i18next.com/)

## 📂 Project Structure
*Updated as of February 20, 2026*

```text
MCBE Glyph Painter/
├── src/
│   ├── components/       # Reusable UI components (GlyphEditor, SliceEditor, etc.)
│   ├── pages/            # Page-level components (Home, ProjectEditor, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── i18n/             # Internationalization config
│   ├── utils/            # Utility functions (Storage, image processing)
│   ├── types.ts          # Global type definitions
│   └── App.tsx           # Main application entry
├── public/               # Static assets
└── LICENSE               # MIT License
```

## 🚀 Roadmap (To-Do List)

- [ ] 📋 **Cross-image Slice Copying**: Copy a slice from one spritesheet and paste it into another.
- [ ] 🖼️ **Independent PNG Editing**: Support editing standalone PNG files without project constraints.
- [ ] ⌨️ **Keyboard Shortcuts**: Add hotkeys for faster workflow.
- [x] 🎨 **Core Painting Engine**: Basic slice editing and drawing functionality.

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

