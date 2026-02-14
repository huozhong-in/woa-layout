// src/components/Layout.tsx
// 主布局组件：三栏布局

import React from 'react';
import type { PanelImperativeHandle } from 'react-resizable-panels';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './ui/resizable';

interface LayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

export function Layout({ left, center, right }: LayoutProps) {
  const rightPanelRef = React.useRef<PanelImperativeHandle | null>(null);
  const [previewMode, setPreviewMode] = React.useState<'phone' | 'pc'>('phone');

  const setPhonePreview = React.useCallback(() => {
    rightPanelRef.current?.resize('30%');
    setPreviewMode('phone');
  }, []);

  const setPcPreview = React.useCallback(() => {
    rightPanelRef.current?.resize('60%');
    setPreviewMode('pc');
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* 左侧：样式配置器 */}
      <aside className="w-80 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        {left}
      </aside>

      <ResizablePanelGroup
        orientation="horizontal"
        className="flex-1"
      >
        {/* 中间：Markdown 编辑器 */}
        <ResizablePanel defaultSize="70%" minSize="30%">
          <main className="flex h-full min-w-0 flex-col overflow-hidden">{center}</main>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-gray-200" />

        {/* 右侧：预览区（支持手机/PC 视宽切换 + 拖拽） */}
        <ResizablePanel panelRef={rightPanelRef} defaultSize="30%" minSize="320px" maxSize="70%">
          <aside className="relative h-full min-w-0 overflow-y-auto border-l border-gray-200 bg-white">
            <div className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-md border border-gray-200 bg-white/95 p-1 shadow-sm">
              <button
                type="button"
                onClick={setPhonePreview}
                className={`rounded px-2 py-1 text-xs ${previewMode === 'phone' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                手机
              </button>
              <button
                type="button"
                onClick={setPcPreview}
                className={`rounded px-2 py-1 text-xs ${previewMode === 'pc' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                PC
              </button>
            </div>
            {right}
          </aside>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
