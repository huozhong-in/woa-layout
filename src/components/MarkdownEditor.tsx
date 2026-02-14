// src/components/MarkdownEditor.tsx
// Markdown 编辑器组件：带防抖的 textarea

import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { useConverter } from '../hooks/useConverter';

export function MarkdownEditor() {
  const { markdown, setMarkdown, setHasUnsavedChanges } = useAppStore();
  const { convert } = useConverter();
  const timeoutRef = useRef<Timer | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = e.target.value;
    setMarkdown(newMarkdown);
    setHasUnsavedChanges(true);

    // 清除旧的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 设置 300ms 防抖
    timeoutRef.current = setTimeout(() => {
      convert();
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">Markdown 编辑器</h2>
        <button className="text-xs text-gray-500 hover:text-gray-700">
          快捷键帮助
        </button>
      </div>
      <textarea
        value={markdown}
        onChange={handleChange}
        className="flex-1 resize-none px-4 py-3 font-mono text-sm focus:outline-none"
        placeholder="在此输入 Markdown 内容..."
        spellCheck={false}
      />
    </div>
  );
}
