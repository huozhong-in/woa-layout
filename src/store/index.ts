// src/store/index.ts
// Zustand 状态管理

import { create } from 'zustand';
import type { Template, TemplateConfig } from '../lib/db/types';
import { DEFAULT_MARKDOWN } from '../lib/preset-markdown';

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
