// src/lib/converter/rehype-inject-styles.ts
// rehype 插件：将样式注入到 HTML AST 节点

import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Element } from 'hast';
import { convertTailwindToInline, stylesToString } from './tailwind-to-inline';
import type { GlobalConfig, TemplateConfig } from '../db/types';

interface StyleCache {
  [tagName: string]: Record<string, string>;
}

// 扩展 tree.data 类型以包含 warnings
interface TreeData {
  warnings?: string[];
}

const BLOCK_CODE_INNER_RESET: Record<string, string> = {
  'background-color': 'transparent',
  color: 'inherit',
  'padding-top': '0',
  'padding-right': '0',
  'padding-bottom': '0',
  'padding-left': '0',
  'border-radius': '0px',
  'font-size': 'inherit',
  'line-height': 'inherit',
};

/**
 * rehype 插件：根据模板配置注入内联样式
 */
export const rehypeInjectStyles: Plugin<[TemplateConfig]> = (config) => {
  return async (tree) => {
    const styleCache: StyleCache = {};
    const allWarnings: string[] = [];
    const globalDefaults = buildGlobalStyleDefaults(config.global);
    const effectiveVariables = {
      ...config.variables,
      ...(config.global?.themeColor && !config.variables?.brandColor
        ? { brandColor: config.global.themeColor }
        : {}),
    };

    // 预处理：转换所有标签的样式
    for (const [tagName, tailwindClasses] of Object.entries(config.styles)) {
      try {
        const { styles, warnings } = await convertTailwindToInline(
          tagName,
          tailwindClasses,
          effectiveVariables,
          config.assets || {}
        );
        
        styleCache[tagName] = mergeWithDefaults(styles, globalDefaults[tagName]);
        allWarnings.push(...warnings.map((warning) => `[${tagName}] ${warning}`));
      } catch (error) {
        console.error(`转换标签 ${tagName} 的样式失败:`, error);
        const message = error instanceof Error ? error.message : '未知错误';
        allWarnings.push(`[${tagName}] Tailwind 转换失败：${message}`);
      }
    }

    for (const [tagName, defaults] of Object.entries(globalDefaults)) {
      styleCache[tagName] = mergeWithDefaults(styleCache[tagName] || {}, defaults);
    }

    const hrStyles = styleCache.hr;
    if (hrStyles?.['background-image'] && !hrStyles['background-size']) {
      styleCache.hr = {
        ...hrStyles,
        'background-size': '100% 100%',
      };
    }

    // 遍历 HAST 树，注入样式
    visit(tree, 'element', (node: Element, _index, parent: any) => {
      const tagName = node.tagName;
      let styles = styleCache[tagName];

      if (tagName === 'code') {
        const isInPre = parent && parent.type === 'element' && parent.tagName === 'pre';

        if (isInPre) {
          styles = BLOCK_CODE_INNER_RESET;
        } else {
          styles = styleCache['code-inline'] || styleCache.code;
        }
      }

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

function mergeWithDefaults(
  base: Record<string, string>,
  defaults?: Record<string, string>
): Record<string, string> {
  if (!defaults) return base;

  const merged: Record<string, string> = { ...base };
  for (const [key, value] of Object.entries(defaults)) {
    if (merged[key] === undefined || merged[key] === '') {
      merged[key] = value;
    }
  }
  return merged;
}

function buildGlobalStyleDefaults(global?: GlobalConfig): StyleCache {
  if (!global) return {};

  const defaults: StyleCache = {};

  const textTags = ['p', 'li', 'blockquote', 'td', 'th'];
  const titleTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const codeTags = ['code', 'pre'];

  if (global.fontFamily) {
    for (const tag of [...textTags, ...titleTags, ...codeTags]) {
      defaults[tag] = {
        ...(defaults[tag] || {}),
        'font-family': global.fontFamily,
      };
    }
  }

  if (global.baseFontSize) {
    const sizeMap: Record<NonNullable<GlobalConfig['baseFontSize']>, string> = {
      sm: '14px',
      base: '16px',
      lg: '18px',
    };
    const fontSize = sizeMap[global.baseFontSize];

    for (const tag of textTags) {
      defaults[tag] = {
        ...(defaults[tag] || {}),
        'font-size': fontSize,
      };
    }
  }

  if (global.themeColor) {
    defaults.a = {
      ...(defaults.a || {}),
      color: global.themeColor,
    };

    defaults.h2 = {
      ...(defaults.h2 || {}),
      'border-left-color': global.themeColor,
    };
  }

  if (global.codeTheme) {
    const themes: Record<NonNullable<GlobalConfig['codeTheme']>, { pre: Record<string, string>; code: Record<string, string> }> = {
      light: {
        pre: {
          'background-color': '#f6f8fa',
          color: '#24292f',
        },
        code: {
          'background-color': '#f3f4f6',
          color: '#c7254e',
        },
      },
      dark: {
        pre: {
          'background-color': '#1f2937',
          color: '#e5e7eb',
        },
        code: {
          'background-color': '#111827',
          color: '#93c5fd',
        },
      },
      androidstudio: {
        pre: {
          'background-color': '#2b2b2b',
          color: '#a9b7c6',
        },
        code: {
          'background-color': '#2b2b2b',
          color: '#a9b7c6',
        },
      },
    };

    const selected = themes[global.codeTheme];
    defaults.pre = {
      ...(defaults.pre || {}),
      ...selected.pre,
    };
    defaults.code = {
      ...(defaults.code || {}),
      ...selected.code,
    };
  }

  return defaults;
}
