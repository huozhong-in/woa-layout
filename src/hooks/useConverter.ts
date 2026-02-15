// src/hooks/useConverter.ts
// 转换逻辑的自定义 Hook

import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store';

export function useConverter() {
  const { setHtml, setWarnings, setIsConverting, showToast } = useAppStore();

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
        const warningList = data.warnings || [];
        setWarnings(warningList);

        const tailwindWarning = warningList.find((warning: string) =>
          /未识别的 Tailwind 类|Tailwind 语法错误|Tailwind 转换失败/.test(warning),
        );
        if (tailwindWarning) {
          showToast(`样式配置有误：${tailwindWarning}`, 'error');
        }
      } else {
        console.error('Conversion failed:', data.error);
        const errorMessage =
          typeof data.error === 'string'
            ? data.error
            : data.error?.message || '转换失败';
        setWarnings([errorMessage]);
        showToast(`转换失败：${errorMessage}`, 'error');
      }
    } catch (error) {
      console.error('Conversion error:', error);
      setWarnings(['网络错误：无法连接到转换服务']);
      showToast('网络错误：无法连接到转换服务', 'error');
    } finally {
      setIsConverting(false);
    }
  }, [setHtml, setWarnings, setIsConverting, showToast]);

  return { convert };
}
