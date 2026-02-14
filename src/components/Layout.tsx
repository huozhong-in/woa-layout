// src/components/Layout.tsx
// 主布局组件：三栏布局

import React from 'react';

interface LayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

export function Layout({ left, center, right }: LayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* 左侧：样式配置器 */}
      <aside className="w-80 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        {left}
      </aside>

      {/* 中间：Markdown 编辑器 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {center}
      </main>

      {/* 右侧：预览区 */}
      <aside className="w-96 shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
        {right}
      </aside>
    </div>
  );
}
