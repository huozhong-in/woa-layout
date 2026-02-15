// src/store/index.ts
// Zustand 状态管理

import { create } from 'zustand';
import type { Template, TemplateConfig } from '../lib/db/types';

interface AppState {
  // 当前模板
  currentTemplate: Template | null;
  setCurrentTemplate: (template: Template | null) => void;

  // 所有模板列表
  templates: Template[];
  setTemplates: (templates: Template[]) => void;

  // Markdown 内容
  markdown: string;
  setMarkdown: (markdown: string) => void;

  // 转换后的 HTML
  html: string;
  setHtml: (html: string) => void;

  // 转换警告
  warnings: string[];
  setWarnings: (warnings: string[]) => void;

  // 加载状态
  isConverting: boolean;
  setIsConverting: (isConverting: boolean) => void;

  // 模板是否有未保存的修改
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasChanges: boolean) => void;

  // 临时编辑的模板配置（用于实时预览）
  tempConfig: TemplateConfig | null;
  setTempConfig: (config: TemplateConfig | null) => void;

  // 全局提示
  toast: {
    message: string;
    type: 'info' | 'success' | 'error';
  } | null;
  showToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // 初始状态
  currentTemplate: null,
  templates: [],
  markdown: DEFAULT_MARKDOWN,
  html: '',
  warnings: [],
  isConverting: false,
  hasUnsavedChanges: false,
  tempConfig: null,
  toast: null,

  // Actions
  setCurrentTemplate: (template) => set({ currentTemplate: template }),
  setTemplates: (templates) => set({ templates }),
  setMarkdown: (markdown) => set({ markdown }),
  setHtml: (html) => set({ html }),
  setWarnings: (warnings) => set({ warnings }),
  setIsConverting: (isConverting) => set({ isConverting }),
  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
  setTempConfig: (config) => set({ tempConfig: config }),
  showToast: (message, type = 'info') => set({ toast: { message, type } }),
  clearToast: () => set({ toast: null }),
}));

// 默认示例 Markdown
const DEFAULT_MARKDOWN = `# WOA-Layout 排版引擎测试

这是一段普通的段落文本，用于测试基础段落样式。段落应该包含合适的行高、字体大小和颜色配置。这里有一些**粗体文字**和*斜体文字*，以及~~删除线文字~~。

## 功能特性介绍

通过 **API 驱动 + 模板化配置** 的方式，实现 Markdown 到微信公众号样式 HTML 的工业化转换。

### 样式配置能力

支持对所有 Markdown 标签进行精细化样式控制，包括但不限于标题、段落、列表、引用等元素。

---

## 列表元素测试

### 无序列表

- 第一项：核心转换引擎
- 第二项：实时预览功能
- 第三项：素材库管理
  - 嵌套子项 1：支持图片上传
  - 嵌套子项 2：生成永久 URL

### 有序列表

1. 第一步：创建模板
2. 第二步：配置样式
3. 第三步：上传素材
4. 第四步：实时预览
5. 第五步：保存并获取 templateId

---

## 引用块测试

> 这是一段引用文字，通常用于展示重要的提示信息或引用他人的观点。
> 
> **引用中也可以使用粗体**和*斜体*等强调样式。

---

## 代码测试

### 行内代码

使用 \`const result = await fetch('/api/convert')\` 调用转换接口。

### 代码块

\`\`\`typescript
interface Template {
  id: string;
  name: string;
  variables: {
    brandColor: string;
    accentColor: string;
  };
  styles: Record<string, string>;
}
\`\`\`

---

## 链接和图片

访问 [Bun 官方文档](https://bun.sh) 了解更多。

![示例图片](https://via.placeholder.com/600x200/007aff/ffffff?text=WOA-Layout)

---

## 结语

本文档涵盖了常用的 Markdown 语法元素，可用于测试样式配置功能。

**加粗强调**：请确保所有样式都能正确转换为内联样式！
`;
