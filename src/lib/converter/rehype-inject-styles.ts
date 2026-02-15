// src/lib/converter/rehype-inject-styles.ts
// rehype 插件：将样式注入到 HTML AST 节点

import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Element } from 'hast';
import { convertTailwindToInline, stylesToString } from './tailwind-to-inline';
import type { TemplateConfig } from '../db/types';

interface StyleCache {
  [tagName: string]: Record<string, string>;
}

// 扩展 tree.data 类型以包含 warnings
interface TreeData {
  warnings?: string[];
}

/**
 * rehype 插件：根据模板配置注入内联样式
 */
export const rehypeInjectStyles: Plugin<[TemplateConfig]> = (config) => {
  return async (tree) => {
    const styleCache: StyleCache = {};
    const allWarnings: string[] = [];

    // 预处理：转换所有标签的样式
    for (const [tagName, tailwindClasses] of Object.entries(config.styles)) {
      try {
        const { styles, warnings } = await convertTailwindToInline(
          tagName,
          tailwindClasses,
          config.variables,
          config.assets || {}
        );
        
        styleCache[tagName] = styles;
        allWarnings.push(...warnings.map((warning) => `[${tagName}] ${warning}`));
      } catch (error) {
        console.error(`转换标签 ${tagName} 的样式失败:`, error);
        const message = error instanceof Error ? error.message : '未知错误';
        allWarnings.push(`[${tagName}] Tailwind 转换失败：${message}`);
      }
    }

    // 遍历 HAST 树，注入样式
    visit(tree, 'element', (node: Element) => {
      const tagName = node.tagName;
      const styles = styleCache[tagName];

      if (styles && Object.keys(styles).length > 0) {
        const styleString = stylesToString(styles);
        
        // 初始化 properties
        node.properties = node.properties || {};
        
        // 合并已有的 style 属性
        const existingStyle = node.properties.style as string || '';
        node.properties.style = existingStyle
          ? `${existingStyle}; ${styleString}`
          : styleString;
      }

      if (tagName === 'li') {
        for (const child of node.children || []) {
          if (child.type !== 'element') continue;
          if (child.tagName !== 'ul' && child.tagName !== 'ol') continue;

          const existingStyle = (child.properties?.style as string) || '';
          // 嵌套列表只需要设置左边距，不设置 list-style-position
          // 微信编辑器对 inside 的支持有问题，会导致列表标记错位
          // 2024-02-14: 已经在默认模板中添加了 pl-10 (padding-left: 40px)，这既解决了 marker 显示问题，也提供了自然的缩进
          // 因此这里不需要额外的 margin-left，否则缩进会过大
          // const nestedListStyle = 'margin-left: 1.5em';
          // child.properties = child.properties || {};
          // child.properties.style = existingStyle
          //   ? `${existingStyle}; ${nestedListStyle}`
          //   : nestedListStyle;
        }
      }
    });

    // 将警告信息附加到树的 data 上（供后续使用）
    if (!tree.data) {
      tree.data = {};
    }
    const treeData = tree.data as TreeData;
    treeData.warnings = allWarnings;
  };
};
