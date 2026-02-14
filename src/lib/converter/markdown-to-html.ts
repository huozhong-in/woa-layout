// src/lib/converter/markdown-to-html.ts
// Markdown 到微信公众号 HTML 的完整转换管道

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { rehypeInjectStyles } from './rehype-inject-styles';
import type { TemplateConfig } from '../db/types';

export interface ConversionResult {
  html: string;
  warnings: string[];
}

/**
 * 将 Markdown 转换为带内联样式的 HTML
 * @param markdown Markdown 源文本
 * @param templateConfig 模板配置
 */
export async function convertMarkdownToHTML(
  markdown: string,
  templateConfig: TemplateConfig
): Promise<ConversionResult> {
  try {
    const processor = unified()
      .use(remarkParse) // Markdown → MDAST
      .use(remarkRehype) // MDAST → HAST
      .use(rehypeInjectStyles, templateConfig) // 注入内联样式
      .use(rehypeStringify); // HAST → HTML

    const result = await processor.process(markdown);
    
    // 从处理结果中提取警告
    const warnings = (result.data?.warnings as string[]) || [];

    return {
      html: String(result),
      warnings,
    };
  } catch (error) {
    console.error('Markdown 转换失败:', error);
    throw new Error(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 批量转换多个 Markdown 文档
 */
export async function convertMultipleMarkdowns(
  markdowns: string[],
  templateConfig: TemplateConfig
): Promise<ConversionResult[]> {
  return Promise.all(
    markdowns.map(md => convertMarkdownToHTML(md, templateConfig))
  );
}
