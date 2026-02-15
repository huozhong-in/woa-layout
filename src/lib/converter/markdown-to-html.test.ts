// src/lib/converter/markdown-to-html.test.ts
// 转换引擎测试

import { test, expect, describe } from 'bun:test';
import { convertMarkdownToHTML } from './markdown-to-html';
import type { TemplateConfig } from '../db/types';

// 测试用模板配置
const testConfig: TemplateConfig = {
  variables: {
    brandColor: '#007aff',
    textColor: '#333333',
  },
  styles: {
    h1: 'text-2xl font-bold text-center',
    h3: 'text-lg font-bold',
    p: 'my-4 leading-relaxed',
    ul: 'my-4 list-disc list-outside',
    ol: 'my-4 list-decimal list-outside',
    li: 'my-2',
    strong: 'font-bold text-[var(--brandColor)]',
    code: 'bg-gray-100 px-2 py-1 rounded',
    hr: 'border-0 h-px bg-gray-300 my-8',
    a: 'text-blue-600 underline',
    img: 'max-w-full h-auto my-4',
    table: 'w-full border-collapse my-4',
    thead: 'bg-gray-100',
    th: 'border border-gray-300 px-4 py-2 text-left font-bold',
    td: 'border border-gray-300 px-4 py-2',
  },
};

describe('Markdown to HTML Conversion', () => {
  test('基础段落转换', async () => {
    const markdown = 'This is a paragraph.';
    const result = await convertMarkdownToHTML(markdown, testConfig);
    
    expect(result.html).toContain('<p');
    expect(result.html).toContain('style=');
    expect(result.html).toContain('This is a paragraph');
  });

  test('标题转换', async () => {
    const markdown = '# Hello World';
    const result = await convertMarkdownToHTML(markdown, testConfig);
    
    expect(result.html).toContain('<h1');
    expect(result.html).toContain('style=');
    expect(result.html).toContain('Hello World');
  });

  test('粗体文字转换', async () => {
    const markdown = '**Bold Text**';
    const result = await convertMarkdownToHTML(markdown, testConfig);
    
    expect(result.html).toContain('<strong');
    expect(result.html).toContain('style=');
    expect(result.html).toContain('Bold Text');
  });

  test('行内代码转换', async () => {
    const markdown = 'Use `const x = 1` in your code.';
    const result = await convertMarkdownToHTML(markdown, testConfig);
    
    expect(result.html).toContain('<code');
    expect(result.html).toContain('style=');
    expect(result.html).toContain('const x = 1');
  });

  test('CSS 变量替换', async () => {
    const markdown = '**Brand Color**';
    const result = await convertMarkdownToHTML(markdown, testConfig);
    
    // 应该包含替换后的颜色值（Tailwind 可能输出为 rgb 或 hex 格式）
    const hasColor = result.html.includes('#007aff') || 
                     result.html.includes('rgb(0 122 255') ||
                     result.html.includes('rgb(0, 122, 255)');
    expect(hasColor).toBe(true);
  });

  test('复杂 Markdown 转换', async () => {
    const markdown = `
# Title

This is a **paragraph** with \`code\`.

## Subtitle

Another paragraph.
    `.trim();
    
    const result = await convertMarkdownToHTML(markdown, testConfig);
    
    expect(result.html).toContain('<h1');
    expect(result.html).toContain('<h2');
    expect(result.html).toContain('<p');
    expect(result.html).toContain('<strong');
    expect(result.html).toContain('<code');
  });

  test('嵌套有序列表缩进', async () => {
    const markdown = `
- 父项
  1. 子项1
  2. 子项2
`.trim();

    const result = await convertMarkdownToHTML(markdown, testConfig);
    expect(result.html).toContain('<ol');
    expect(result.html).toContain('margin-left: 1.5em');
  });

  test('GFM 表格转换', async () => {
    const markdown = `
| A | B |
| - | - |
| 1 | 2 |
`.trim();

    const result = await convertMarkdownToHTML(markdown, testConfig);
    expect(result.html).toContain('<table');
    expect(result.html).toContain('<td');
  });

  test('LaTeX 公式渲染为图片', async () => {
    const markdown = '行内公式 $E = mc^2$ 和块公式：\n\n$$a+b$$';
    const result = await convertMarkdownToHTML(markdown, testConfig);

    // 更新为 PNG 格式
    expect(result.html).toContain('https://latex.codecogs.com/png.image?');
  });

  test('Mermaid 流程图渲染为图片', async () => {
    const markdown = `
\`\`\`mermaid
graph TD;
A-->B;
\`\`\`
`.trim();

    const result = await convertMarkdownToHTML(markdown, testConfig);
    expect(result.html).toContain('https://mermaid.ink/img/');
  });

  test('文末收集并罗列外链', async () => {
    const markdown = '[Google](https://www.google.com)';
    const result = await convertMarkdownToHTML(markdown, testConfig);

    expect(result.html).toContain('参考链接');
    expect(result.html).toContain('https://www.google.com');
  });

  test('@bg(alias) 自动替换为素材 URL', async () => {
    const aliasToken = `@bg(${['divider'].join('')})`;
    const bgClass = `bg-${`[url('${aliasToken}')]`}`;
    const configWithAssets: TemplateConfig = {
      ...testConfig,
      assets: {
        divider: '/api/assets/demo-divider.svg',
      },
      styles: {
        ...testConfig.styles,
        hr: `my-8 h-px border-0 ${bgClass} bg-no-repeat bg-center bg-contain`,
      },
    };

    const result = await convertMarkdownToHTML('---', configWithAssets);
    expect(result.html).toContain('background-image:');
    expect(result.html).toContain('/api/assets/demo-divider.svg');
    expect(result.html).not.toContain('@bg(divider)');
  });
});
