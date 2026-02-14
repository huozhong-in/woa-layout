// src/components/Preview.tsx
// 预览组件：显示转换后的 HTML

import React, { useState } from 'react';
import { useAppStore } from '../store';

export function Preview() {
  const { html, warnings, isConverting } = useAppStore();
  const [copied, setCopied] = useState(false);

  const handleCopyHTML = async () => {
    if (!html) return;
    
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">预览</h2>
        <div className="flex gap-2">
          {isConverting && (
            <span className="text-xs text-blue-600">转换中...</span>
          )}
          <button
            onClick={handleCopyHTML}
            disabled={!html}
            className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            {copied ? '已复制' : '复制 HTML'}
          </button>
        </div>
      </div>
      
      {warnings.length > 0 && (
        <div className="mx-4 mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <div className="font-semibold text-yellow-800 mb-1">⚠️ 转换警告：</div>
          <ul className="list-disc list-inside text-yellow-700 space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {html ? (
          <div
            className="wechat-preview"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            左侧输入 Markdown 后自动生成预览
          </div>
        )}
      </div>
    </div>
  );
}
