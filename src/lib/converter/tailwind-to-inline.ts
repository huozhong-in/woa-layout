// src/lib/converter/tailwind-to-inline.ts
// TailwindCSS 类名转内联样式转换器

import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { parse as parseCSS } from 'css';

// 微信不支持的 CSS 属性黑名单
const WECHAT_UNSUPPORTED_PROPERTIES = [
  'position',
  'z-index',
  'transform',
  'transform-origin',
  'animation',
  'animation-name',
  'animation-duration',
  'animation-timing-function',
  'animation-delay',
  'animation-iteration-count',
  'animation-direction',
  'animation-fill-mode',
  'animation-play-state',
  'transition',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'transition-delay',
];

export interface ConversionResult {
  styles: Record<string, string>;
  warnings: string[];
}

/**
 * 将 TailwindCSS 类名转换为内联样式
 * @param tagName HTML 标签名
 * @param tailwindClasses TailwindCSS 类名字符串
 * @param variables CSS 变量映射（用于替换 var(--xxx)）
 */
export async function convertTailwindToInline(
  tagName: string,
  tailwindClasses: string,
  variables: Record<string, string> = {}
): Promise<ConversionResult> {
  // 1. 替换 CSS 变量
  const processedClasses = replaceVariables(tailwindClasses, variables);

  // 2. 移除不支持的前缀（hover:, before: 等）
  const cleanedClasses = removeUnsupportedPrefixes(processedClasses);

  // 3. 构造虚拟 HTML
  const html = buildVirtualHTML(tagName, cleanedClasses);

  // 4. 通过 PostCSS + Tailwind 生成 CSS
  const css = await generateCSS(html);

  // 5. 解析 CSS 并提取样式
  const classList = cleanedClasses.split(/\s+/).filter(Boolean);
  const styles = extractInlineStyles(css, classList);

  // 6. 过滤微信不支持的属性
  const { filtered, warnings } = filterUnsupportedStyles(styles);

  return { styles: filtered, warnings };
}

/**
 * 替换 CSS 变量引用
 * 例如：var(--brandColor) → #007aff
 */
function replaceVariables(
  classString: string,
  variables: Record<string, string>
): string {
  let result = classString;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`var\\(--${key}\\)`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}

/**
 * 移除微信不支持的 TailwindCSS 前缀
 * - 伪类：hover:, focus:, active:
 * - 伪元素：before:, after:
 * - 响应式：sm:, md:, lg:, xl:, 2xl:
 */
function removeUnsupportedPrefixes(classes: string): string {
  return classes
    .split(/\s+/)
    .filter(cls => {
      // 移除伪类前缀
      if (/^(hover|focus|active|visited):/.test(cls)) return false;
      // 移除伪元素前缀
      if (/^(before|after):/.test(cls)) return false;
      // 移除响应式前缀
      if (/^(sm|md|lg|xl|2xl):/.test(cls)) return false;
      return true;
    })
    .join(' ');
}

/**
 * 构造虚拟 HTML 片段
 */
function buildVirtualHTML(tagName: string, classes: string): string {
  return `<${tagName} class="${classes}">content</${tagName}>`;
}

/**
 * 使用 PostCSS + Tailwind 生成 CSS
 */
async function generateCSS(html: string): Promise<string> {
  const tailwindConfig = {
    content: [{ raw: html, extension: 'html' }],
    corePlugins: {
      preflight: false, // 禁用基础样式重置
    },
  };

  try {
    const result = await postcss([
      tailwindcss(tailwindConfig)
    ]).process('@tailwind utilities;', { from: undefined });

    return result.css;
  } catch (error) {
    console.error('PostCSS 处理失败:', error);
    return '';
  }
}

/**
 * 解析 CSS 并提取内联样式
 */
function extractInlineStyles(
  css: string,
  classes: string[]
): Record<string, string> {
  const styles: Record<string, string> = {};

  try {
    const ast = parseCSS(css);

    for (const rule of ast.stylesheet?.rules || []) {
      if (rule.type !== 'rule') continue;

      // 提取选择器中的类名（去掉前导的 .）
      const selector = rule.selectors?.[0];
      if (!selector) continue;

      const className = selector.replace(/^\./, '').replace(/\\/g, '');
      
      // 检查是否在我们的类名列表中
      const isMatched = classes.some(cls => {
        // 处理特殊字符（如方括号）的转义
        const escapedCls = cls.replace(/[[\]]/g, '\\$&');
        return className === escapedCls || className.includes(cls);
      });

      if (isMatched) {
        // 提取所有 CSS 声明
        for (const declaration of rule.declarations || []) {
          if (declaration.type === 'declaration' && declaration.property && declaration.value) {
            styles[declaration.property] = declaration.value;
          }
        }
      }
    }
  } catch (error) {
    console.error('CSS 解析失败:', error);
  }

  return styles;
}

/**
 * 过滤微信不支持的 CSS 属性
 */
function filterUnsupportedStyles(
  styles: Record<string, string>
): { filtered: Record<string, string>; warnings: string[] } {
  const filtered: Record<string, string> = {};
  const warnings: string[] = [];

  for (const [property, value] of Object.entries(styles)) {
    const isUnsupported = WECHAT_UNSUPPORTED_PROPERTIES.some(
      unsupported => property === unsupported || property.startsWith(unsupported + '-')
    );

    if (isUnsupported) {
      warnings.push(`属性 "${property}: ${value}" 可能被微信过滤`);
    } else {
      filtered[property] = value;
    }
  }

  return { filtered, warnings };
}

/**
 * 将样式对象转换为内联样式字符串
 */
export function stylesToString(styles: Record<string, string>): string {
  return Object.entries(styles)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}
