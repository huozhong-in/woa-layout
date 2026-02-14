// src/hooks/useConverter.ts
// 转换逻辑的自定义 Hook

import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store';

export function useConverter() {
  const { setHtml, setWarnings, setIsConverting } = useAppStore();

  const convert = useCallback(async () => {
    const { markdown, currentTemplate, tempConfig } = useAppStore.getState();

    if (!currentTemplate) return;

    setIsConverting(true);
    
    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: currentTemplate.id,
          markdown,
          // 如果有临时配置，使用临时配置
          templateConfig: tempConfig || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setHtml(data.html);
        setWarnings(data.warnings || []);
      } else {
        console.error('Conversion failed:', data.error);
        const errorMessage =
          typeof data.error === 'string'
            ? data.error
            : data.error?.message || '转换失败';
        setWarnings([errorMessage]);
      }
    } catch (error) {
      console.error('Conversion error:', error);
      setWarnings(['网络错误：无法连接到转换服务']);
    } finally {
      setIsConverting(false);
    }
  }, [setHtml, setWarnings, setIsConverting]);

  return { convert };
}
