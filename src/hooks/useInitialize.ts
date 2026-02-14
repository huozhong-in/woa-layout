// src/hooks/useInitialize.ts
// 初始化应用状态的自定义 Hook

import { useEffect } from 'react';
import { useAppStore } from '../store';
import { useConverter } from './useConverter';
import type { Template } from '../lib/db/types';

export function useInitialize() {
  const { markdown, setMarkdown, setTemplates, setCurrentTemplate } = useAppStore();
  const { convert } = useConverter();

  useEffect(() => {
    async function loadDefaultMarkdown() {
      const currentMarkdown = typeof markdown === 'string' ? markdown : '';
      if (currentMarkdown.trim().length > 0) return;

      try {
        const response = await fetch('/api/default-markdown');
        if (!response.ok) return;

        const content = await response.text();
        if (content.trim().length > 0) {
          setMarkdown(content);
        }
      } catch (error) {
        console.error('Failed to load default markdown:', error);
      }
    }

    // 加载所有模板
    async function loadTemplates() {
      try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        
        if (data.success) {
          const templates = (data.data ?? data.templates ?? []) as Template[];
          setTemplates(templates);
          
          // 设置默认模板为当前模板
          const defaultTemplate = templates.find(
            (t) => t.id === 'default-simple' || t.is_default === 1
          );
          if (defaultTemplate) {
            setCurrentTemplate(defaultTemplate);
            // 初始转换
            setTimeout(() => convert(), 100);
          }
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    }

    async function initialize() {
      await loadDefaultMarkdown();
      await loadTemplates();
    }

    initialize();
  }, [markdown, setMarkdown, setTemplates, setCurrentTemplate, convert]);
}
