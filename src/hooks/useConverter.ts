// src/hooks/useConverter.ts
// 转换逻辑的自定义 Hook

import { useCallback, useRef } from 'react';
import { useAppStore } from '../store';
import { showActionErrorToast, showNetworkErrorToast } from '../lib/ui-feedback';

export function useConverter() {
  const { setHtml, setWarnings, setIsConverting, showToast } = useAppStore();
  const lastSuccessfulRenderRef = useRef<{ html: string; warnings: string[] }>({
    html: '',
    warnings: [],
  });

  const rollbackToLastSuccess = useCallback((reason: string) => {
    const previous = lastSuccessfulRenderRef.current;
    if (!previous.html) {
      setWarnings([reason]);
      return;
    }

    setHtml(previous.html);
    setWarnings([...previous.warnings, `已回滚：${reason}`]);
    showToast('转换失败，已回滚到上一次成功结果', 'error');
  }, [setHtml, setWarnings, showToast]);

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

      if (response.ok && data.success) {
        setHtml(data.html);
        const warningList = data.warnings || [];
        setWarnings(warningList);
        lastSuccessfulRenderRef.current = {
          html: data.html || '',
          warnings: warningList,
        };

        const tailwindWarning = warningList.find((warning: string) =>
          /未识别的 Tailwind 类|Tailwind 语法错误|Tailwind 转换失败/.test(warning),
        );
        if (tailwindWarning) {
          showToast(`样式配置有误：${tailwindWarning}`, 'error');
        }
      } else {
        console.error('Conversion failed:', data.error);
        const errorMessage = showActionErrorToast(showToast, '转换', data, '转换失败');
        rollbackToLastSuccess(errorMessage);
      }
    } catch (error) {
      console.error('Conversion error:', error);
      const errorMessage = showNetworkErrorToast(showToast, '转换');
      rollbackToLastSuccess(errorMessage);
    } finally {
      setIsConverting(false);
    }
  }, [setHtml, setWarnings, setIsConverting, showToast, rollbackToLastSuccess]);

  return { convert };
}
