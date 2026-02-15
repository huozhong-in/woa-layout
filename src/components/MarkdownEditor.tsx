// src/components/MarkdownEditor.tsx
// Markdown 编辑器组件：带防抖的 textarea

import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store';
import { useConverter } from '../hooks/useConverter';
import { PRESET_MARKDOWNS } from '../lib/preset-markdown';

export function MarkdownEditor() {
  const { markdown, setMarkdown } = useAppStore();
  const { convert } = useConverter();
  const timeoutRef = useRef<Timer | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState(PRESET_MARKDOWNS[0]?.id || '');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = e.target.value;
    setMarkdown(newMarkdown);

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

  const handlePresetSwitch = async (presetId: string) => {
    const preset = PRESET_MARKDOWNS.find((item) => item.id === presetId);
    if (!preset) return;

    setSelectedPresetId(presetId);
    setMarkdown(preset.content);
    await convert();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">样式调试文档</h2>
        <div className="flex items-center gap-2">
          <select
            value={selectedPresetId}
            onChange={(e) => handlePresetSwitch(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
          >
            {PRESET_MARKDOWNS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
          <button className="text-xs text-gray-500 hover:text-gray-700">
            调试说明
          </button>
        </div>
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
