# TailwindCSS 到内联样式转换方案

> 详细说明如何将 TailwindCSS 类名转换为微信公众号兼容的内联样式

---

## 1. 核心挑战

### 1.1 微信公众号的限制
- ❌ 不支持 `<style>` 标签
- ❌ 不支持外部 CSS 文件
- ❌ 不支持 CSS 选择器（class/id）
- ✅ **只支持**内联样式（`<p style="color: #333;">...</p>`）

### 1.2 TailwindCSS 的特点
- 提供原子化的实用类名（如 `text-center`, `mb-4`）
- 支持任意值语法（如 `text-[#ff0000]`, `w-[123px]`）
- 支持响应式前缀（如 `md:text-lg`）
- 支持状态前缀（如 `hover:`, `focus:`）

### 1.3 转换目标
```
输入：TailwindCSS 类名
   "text-xl font-bold text-center mb-6 text-[#007aff]"

输出：内联 CSS 样式
   "font-size: 1.25rem; font-weight: 700; text-align: center; margin-bottom: 1.5rem; color: #007aff;"
```

---

## 2. 转换流程设计

### 2.1 整体流程

```
┌─────────────────────┐
│ 模板配置 (JSON)      │
│ styles: {           │
│   h1: "text-2xl ..." │
│   p: "my-4 ..."     │
│ }                   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 1. 变量替换         │
│ var(--brandColor)   │
│   → #007aff         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. 构造虚拟 HTML    │
│ <h1 class="...">    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. PostCSS +        │
│    Tailwind 处理    │
│ → 完整 CSS 规则     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. 解析 CSS         │
│ 提取属性值对        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 5. 微信兼容性过滤   │
│ 移除 position 等    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 6. 注入 HAST 节点   │
│ node.properties.    │
│   style = "..."     │
└─────────────────────┘
```

### 2.2 详细步骤

#### 步骤 1：读取模板并替换变量

```typescript
interface TemplateConfig {
  variables: {
    brandColor: string;
    accentColor: string;
    textColor: string;
  };
  styles: {
    h1: string;
    h2: string;
    p: string;
    // ...
  };
}

function replaceVariables(
  classString: string,
  variables: Record<string, string>
): string {
  let result = classString;
  
  // 替换 var(--variableName) 为实际值
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`var\\(--${key}\\)`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}

// 示例
const input = "text-[var(--brandColor)] border-[var(--brandColor)]";
const output = replaceVariables(input, { brandColor: '#007aff' });
// → "text-[#007aff] border-[#007aff]"
```

#### 步骤 2：构造虚拟 HTML

```typescript
function buildVirtualHTML(tagName: string, tailwindClasses: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><style>@tailwind utilities;</style></head>
    <body>
      <${tagName} class="${tailwindClasses}">Sample Content</${tagName}>
    </body>
    </html>
  `;
}

// 示例
const html = buildVirtualHTML('h1', 'text-2xl font-bold text-center');
```

#### 步骤 3：通过 PostCSS + Tailwind 生成 CSS

```typescript
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

async function generateCSS(html: string): Promise<string> {
  const tailwindConfig = {
    content: [{ raw: html, extension: 'html' }],
    theme: {
      extend: {
        // 可选：扩展默认主题
      }
    },
    corePlugins: {
      preflight: false, // 禁用基础样式重置
    }
  };

  const result = await postcss([
    tailwindcss(tailwindConfig)
  ]).process('@tailwind utilities;', { from: undefined });

  return result.css;
}

// 输出示例
/*
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.font-bold { font-weight: 700; }
.text-center { text-align: center; }
*/
```

#### 步骤 4：解析 CSS 并提取样式

```typescript
import { parse } from 'css';

function extractInlineStyles(
  css: string,
  tagName: string,
  classes: string[]
): Record<string, string> {
  const ast = parse(css);
  const styles: Record<string, string> = {};

  // 遍历所有 CSS 规则
  for (const rule of ast.stylesheet.rules) {
    if (rule.type !== 'rule') continue;

    // 匹配选择器（如 .text-2xl）
    const selector = rule.selectors?.[0];
    if (!selector) continue;

    const className = selector.replace('.', '');
    
    // 如果该类名在我们的 classes 列表中
    if (classes.includes(className)) {
      // 提取所有声明
      for (const declaration of rule.declarations || []) {
        if (declaration.type === 'declaration') {
          styles[declaration.property] = declaration.value;
        }
      }
    }
  }

  return styles;
}

// 示例
const css = `
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.font-bold { font-weight: 700; }
.text-center { text-align: center; }
`;

const classes = ['text-2xl', 'font-bold', 'text-center'];
const styles = extractInlineStyles(css, 'h1', classes);

// 输出：
// {
//   'font-size': '1.5rem',
//   'line-height': '2rem',
//   'font-weight': '700',
//   'text-align': 'center'
// }
```

#### 步骤 5：微信兼容性过滤

```typescript
// 微信不支持的 CSS 属性黑名单
const WECHAT_UNSUPPORTED_PROPERTIES = [
  'position',        // absolute/fixed/relative 都会被过滤
  'z-index',         // 依赖 position
  'transform',       // 兼容性不稳定
  'transform-origin',
  'animation',       // 不支持动画
  'animation-*',
  'transition',      // 不支持过渡
  'transition-*',
  '@keyframes',      // 不支持关键帧
];

interface FilterResult {
  filtered: Record<string, string>;
  warnings: string[];
}

function filterUnsupportedStyles(
  styles: Record<string, string>
): FilterResult {
  const filtered: Record<string, string> = {};
  const warnings: string[] = [];

  for (const [property, value] of Object.entries(styles)) {
    // 检查是否在黑名单中
    const isUnsupported = WECHAT_UNSUPPORTED_PROPERTIES.some(pattern => {
      if (pattern.endsWith('*')) {
        return property.startsWith(pattern.slice(0, -1));
      }
      return property === pattern;
    });

    if (isUnsupported) {
      warnings.push(`属性 "${property}: ${value}" 可能被微信过滤`);
    } else {
      filtered[property] = value;
    }
  }

  return { filtered, warnings };
}
```

#### 步骤 6：注入到 HAST 节点

```typescript
import { visit } from 'unist-util-visit';
import type { Element } from 'hast';

function injectStylesPlugin(styleMap: Record<string, Record<string, string>>) {
  return () => {
    return (tree: any) => {
      visit(tree, 'element', (node: Element) => {
        const tagName = node.tagName;
        const styles = styleMap[tagName];

        if (styles) {
          // 将样式对象转换为字符串
          const styleString = Object.entries(styles)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ');

          // 注入到 style 属性
          node.properties = node.properties || {};
          node.properties.style = styleString;
        }
      });
    };
  };
}

// 使用示例
const styleMap = {
  h1: { 'font-size': '1.5rem', 'font-weight': '700' },
  p: { 'margin': '1rem 0', 'line-height': '1.6' },
};

unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(injectStylesPlugin(styleMap))  // 注入样式
  .use(rehypeStringify)
  .process(markdown);
```

---

## 3. 完整代码示例

### 3.1 核心转换函数

```typescript
// src/lib/converter.ts
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { parse as parseCSS } from 'css';

export interface ConversionResult {
  styles: Record<string, string>;
  warnings: string[];
}

export async function convertTailwindToInline(
  tagName: string,
  tailwindClasses: string,
  variables: Record<string, string> = {}
): Promise<ConversionResult> {
  // 1. 替换变量
  const processedClasses = replaceVariables(tailwindClasses, variables);

  // 2. 构造虚拟 HTML
  const html = buildVirtualHTML(tagName, processedClasses);

  // 3. 生成 CSS
  const css = await generateCSS(html);

  // 4. 提取样式
  const classes = processedClasses.split(/\s+/).filter(Boolean);
  const styles = extractInlineStyles(css, tagName, classes);

  // 5. 过滤不支持的属性
  const { filtered, warnings } = filterUnsupportedStyles(styles);

  return { styles: filtered, warnings };
}

// 辅助函数
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

function buildVirtualHTML(tagName: string, classes: string): string {
  return `<${tagName} class="${classes}">content</${tagName}>`;
}

async function generateCSS(html: string): Promise<string> {
  const result = await postcss([
    tailwindcss({
      content: [{ raw: html, extension: 'html' }],
      corePlugins: { preflight: false }
    })
  ]).process('@tailwind utilities;', { from: undefined });
  
  return result.css;
}

function extractInlineStyles(
  css: string,
  tagName: string,
  classes: string[]
): Record<string, string> {
  const ast = parseCSS(css);
  const styles: Record<string, string> = {};

  for (const rule of ast.stylesheet?.rules || []) {
    if (rule.type !== 'rule') continue;

    const selector = rule.selectors?.[0]?.replace('.', '');
    if (selector && classes.includes(selector)) {
      for (const declaration of rule.declarations || []) {
        if (declaration.type === 'declaration') {
          styles[declaration.property!] = declaration.value!;
        }
      }
    }
  }

  return styles;
}

function filterUnsupportedStyles(
  styles: Record<string, string>
): { filtered: Record<string, string>; warnings: string[] } {
  const unsupported = ['position', 'z-index', 'transform', 'animation', 'transition'];
  const filtered: Record<string, string> = {};
  const warnings: string[] = [];

  for (const [key, value] of Object.entries(styles)) {
    if (unsupported.some(u => key.startsWith(u))) {
      warnings.push(`${key}: ${value} (可能被微信过滤)`);
    } else {
      filtered[key] = value;
    }
  }

  return { filtered, warnings };
}
```

### 3.2 rehype 插件集成

```typescript
// src/lib/rehype-inject-styles.ts
import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Element } from 'hast';
import { convertTailwindToInline } from './converter';

interface StyleConfig {
  variables: Record<string, string>;
  styles: Record<string, string>; // tagName → tailwind classes
}

export const rehypeInjectStyles: Plugin<[StyleConfig]> = (config) => {
  return async (tree) => {
    const styleCache = new Map<string, Record<string, string>>();

    // 预处理：转换所有标签的样式
    for (const [tagName, tailwindClasses] of Object.entries(config.styles)) {
      const { styles } = await convertTailwindToInline(
        tagName,
        tailwindClasses,
        config.variables
      );
      styleCache.set(tagName, styles);
    }

    // 遍历 HAST 树，注入样式
    visit(tree, 'element', (node: Element) => {
      const styles = styleCache.get(node.tagName);
      if (styles) {
        const styleString = Object.entries(styles)
          .map(([k, v]) => `${k}: ${v}`)
          .join('; ');
        
        node.properties = node.properties || {};
        node.properties.style = styleString;
      }
    });
  };
};
```

### 3.3 完整转换流程

```typescript
// src/lib/markdown-to-html.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { rehypeInjectStyles } from './rehype-inject-styles';
import type { TemplateConfig } from './types';

export async function convertMarkdownToHTML(
  markdown: string,
  template: TemplateConfig
): Promise<{ html: string; warnings: string[] }> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeInjectStyles, {
      variables: template.variables,
      styles: template.styles
    })
    .use(rehypeStringify);

  const result = await processor.process(markdown);
  
  return {
    html: String(result),
    warnings: [] // 可以从 rehypeInjectStyles 收集警告
  };
}
```

---

## 4. 性能优化策略

### 4.1 样式缓存

```typescript
// 缓存已转换的样式，避免重复计算
const styleCache = new LRUCache<string, Record<string, string>>({
  max: 100, // 最多缓存 100 个样式配置
  ttl: 1000 * 60 * 60, // 1 小时过期
});

async function getCachedStyles(
  tagName: string,
  tailwindClasses: string,
  variables: Record<string, string>
): Promise<Record<string, string>> {
  const cacheKey = `${tagName}:${tailwindClasses}:${JSON.stringify(variables)}`;
  
  if (styleCache.has(cacheKey)) {
    return styleCache.get(cacheKey)!;
  }

  const { styles } = await convertTailwindToInline(tagName, tailwindClasses, variables);
  styleCache.set(cacheKey, styles);
  
  return styles;
}
```

### 4.2 批量转换

```typescript
// 一次性转换所有标签样式，减少 PostCSS 调用次数
async function convertAllStyles(
  styleConfig: Record<string, string>,
  variables: Record<string, string>
): Promise<Map<string, Record<string, string>>> {
  // 构造包含所有标签的虚拟 HTML
  const allHTML = Object.entries(styleConfig)
    .map(([tag, classes]) => {
      const processed = replaceVariables(classes, variables);
      return `<${tag} class="${processed}">content</${tag}>`;
    })
    .join('\n');

  // 一次性生成所有 CSS
  const css = await generateCSS(allHTML);

  // 解析并分配给各标签
  const result = new Map<string, Record<string, string>>();
  
  for (const [tagName, classes] of Object.entries(styleConfig)) {
    const processed = replaceVariables(classes, variables);
    const classList = processed.split(/\s+/).filter(Boolean);
    const styles = extractInlineStyles(css, tagName, classList);
    result.set(tagName, styles);
  }

  return result;
}
```

---

## 5. 测试用例

### 5.1 基础转换测试

```typescript
import { test, expect } from 'bun:test';
import { convertTailwindToInline } from './converter';

test('基础类名转换', async () => {
  const { styles } = await convertTailwindToInline('p', 'text-center font-bold');
  
  expect(styles).toHaveProperty('text-align', 'center');
  expect(styles).toHaveProperty('font-weight', '700');
});

test('任意值语法', async () => {
  const { styles } = await convertTailwindToInline('p', 'text-[#ff0000] w-[123px]');
  
  expect(styles).toHaveProperty('color', '#ff0000');
  expect(styles).toHaveProperty('width', '123px');
});

test('变量替换', async () => {
  const { styles } = await convertTailwindToInline(
    'p',
    'text-[var(--brandColor)]',
    { brandColor: '#007aff' }
  );
  
  expect(styles).toHaveProperty('color', '#007aff');
});
```

### 5.2 兼容性过滤测试

```typescript
test('过滤不支持的属性', async () => {
  const { styles, warnings } = await convertTailwindToInline(
    'div',
    'relative absolute z-10'
  );
  
  expect(styles).not.toHaveProperty('position');
  expect(styles).not.toHaveProperty('z-index');
  expect(warnings.length).toBeGreaterThan(0);
});
```

---

## 6. 注意事项

### 6.1 TailwindCSS 特殊前缀处理

以下 Tailwind 前缀在微信中**无效**，需要在转换前过滤：

- `hover:` / `focus:` / `active:` - 伪类（微信无 `<style>` 标签）
- `before:` / `after:` - 伪元素（会被微信过滤）
- `md:` / `lg:` / `xl:` - 响应式（微信不支持媒体查询）

```typescript
function removeUnsupportedPrefixes(classes: string): string {
  return classes
    .split(/\s+/)
    .filter(cls => {
      // 移除伪类/伪元素前缀
      if (/^(hover|focus|active|before|after):/.test(cls)) return false;
      // 移除响应式前缀
      if (/^(sm|md|lg|xl|2xl):/.test(cls)) return false;
      return true;
    })
    .join(' ');
}
```

### 6.2 URL 引用处理

在 TailwindCSS 中使用 `url()` 时，需要引用素材库的 URL：

```typescript
// 用户配置
"hr": "border-0 h-8 bg-[url(var(--divider))] bg-center"

// 变量替换后
"hr": "border-0 h-8 bg-[url(/api/assets/divider-123.svg)] bg-center"

// 最终 CSS
background-image: url(/api/assets/divider-123.svg);
background-position: center;
```

### 6.3 颜色透明度

TailwindCSS 的颜色透明度语法需要转换为标准格式：

```typescript
// Tailwind: bg-blue-500/50
// 转换为: background-color: rgb(59 130 246 / 0.5);

// 确保浏览器兼容性，可能需要转换为 rgba()
// 最终: background-color: rgba(59, 130, 246, 0.5);
```

---

## 7. 总结

### 7.1 转换流程总结

1. **变量替换** → `var(--xxx)` 转为实际值
2. **构造虚拟 HTML** → 包含 TailwindCSS 类名
3. **PostCSS 处理** → 生成完整 CSS
4. **解析 CSS** → 提取属性值对
5. **兼容性过滤** → 移除微信不支持的属性
6. **注入 HAST** → 写入 `style` 属性

### 7.2 关键优势

- ✅ 使用官方 Tailwind，支持所有语法特性
- ✅ 转换规则清晰，易于调试
- ✅ 自动处理任意值和变量
- ✅ 内置兼容性检查

### 7.3 潜在风险

- ⚠️ PostCSS 处理有一定性能开销（可通过缓存缓解）
- ⚠️ 需要维护微信兼容性黑名单（可能需要根据微信更新调整）
- ⚠️ 响应式和伪类前缀无法使用（用户需要理解限制）

---

**文档版本**：v1.0  
**创建日期**：2026-02-14  
**维护者**：开发团队
