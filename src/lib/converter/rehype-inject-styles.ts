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
          config.variables
        );
        
        styleCache[tagName] = styles;
        allWarnings.push(...warnings);
      } catch (error) {
        console.error(`转换标签 ${tagName} 的样式失败:`, error);
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
    });

    // 将警告信息附加到树的 data 上（供后续使用）
    const treeData = tree.data as TreeData;
    if (!tree.data) {
      tree.data = {};
    }
    treeData.warnings = allWarnings;
  };
};
