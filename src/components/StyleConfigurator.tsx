// src/components/StyleConfigurator.tsx
// 样式配置器：折叠面板展示不同标签类型的样式配置

import React, { useState } from 'react';
import { useAppStore } from '../store';
import type { TemplateConfig } from '../lib/db/types';

type TagCategory = string;

interface CategoryConfig {
  key: TagCategory;
  label: string;
  tags: string[];
}

const categories: CategoryConfig[] = [
  { key: 'h1', label: '标题类', tags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
  { key: 'p', label: '段落类', tags: ['p', 'blockquote'] },
  { key: 'ul', label: '列表类', tags: ['ul', 'ol', 'li'] },
  { key: 'a', label: '链接与强调', tags: ['a', 'strong', 'em', 'code'] },
  { key: 'pre', label: '代码块', tags: ['pre'] },
  { key: 'img', label: '图片', tags: ['img'] },
];

export function StyleConfigurator() {
  const { currentTemplate, tempConfig, setTempConfig, setHasUnsavedChanges } = useAppStore();
  const [openCategory, setOpenCategory] = useState<string | null>('h1');

  // 使用当前模板配置或临时配置
  const config = tempConfig || currentTemplate?.config || { variables: {}, styles: {} };

  const handleStyleChange = (tag: string, value: string) => {
    setTempConfig({
      ...config,
      styles: {
        ...config.styles,
        [tag]: value,
      },
    });
    setHasUnsavedChanges(true);
  };

  const toggleCategory = (categoryKey: string) => {
    setOpenCategory(openCategory === categoryKey ? null : categoryKey);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">样式配置</h2>
        <select className="w-full text-sm border border-gray-300 rounded px-2 py-1">
          <option>默认模板</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {categories.map((category) => (
          <div key={category.key} className="border-b border-gray-200">
            <button
              onClick={() => toggleCategory(category.key)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                {category.label}
              </span>
              <span className="text-gray-400">
                {openCategory === category.key ? '−' : '+'}
              </span>
            </button>
            
            {openCategory === category.key && (
              <div className="px-4 py-3 space-y-3 bg-white">
                {category.tags.map((tag) => (
                  <div key={tag}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {tag}
                    </label>
                    <input
                      type="text"
                      value={config.styles[tag] || ''}
                      onChange={(e) => handleStyleChange(tag, e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="输入 TailwindCSS 类名"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-gray-200 space-y-2">
        <button className="w-full py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
          保存模板
        </button>
        <button className="w-full py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors">
          重置为默认
        </button>
      </div>
    </div>
  );
}
