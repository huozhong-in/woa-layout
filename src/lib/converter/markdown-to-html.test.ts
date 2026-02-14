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
    p: 'my-4 leading-relaxed',
    strong: 'font-bold text-[var(--brandColor)]',
    code: 'bg-gray-100 px-2 py-1 rounded',
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
});
