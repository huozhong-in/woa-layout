// src/hooks/useInitialize.ts
// 初始化应用状态的自定义 Hook

import { useEffect } from 'react';
import { useAppStore } from '../store';
import { useConverter } from './useConverter';

export function useInitialize() {
  const { setTemplates, setCurrentTemplate } = useAppStore();
  const { convert } = useConverter();

  useEffect(() => {
    // 加载所有模板
    async function loadTemplates() {
      try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        
        if (data.success) {
          setTemplates(data.templates);
          
          // 设置默认模板为当前模板
          const defaultTemplate = data.templates.find(
            (t: any) => t.name === 'default-simple' || t.is_default
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

    loadTemplates();
  }, [setTemplates, setCurrentTemplate, convert]);
}
