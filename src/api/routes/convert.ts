// src/api/routes/convert.ts
// Markdown 转换 API 路由

import { Hono } from 'hono';
import { getDatabase, getTemplateById } from '../../lib/db';
import { convertMarkdownToHTML } from '../../lib/converter';

const convert = new Hono();

/**
 * POST /api/convert
 * 将 Markdown 转换为带内联样式的 HTML
 */
convert.post('/', async (c) => {
  try {
    const payload = await c.req.json().catch(() => ({} as Record<string, unknown>));
    const templateId = (
      payload.templateId ??
      (payload.template as { id?: string } | undefined)?.id ??
      payload.id
    ) as string | undefined;
    const markdown = (payload.markdown ?? payload.content ?? payload.text) as string | undefined;
    const templateConfig = payload.templateConfig;

    const missingParams: string[] = [];
    if (!templateId) missingParams.push('templateId');
    if (markdown === undefined || markdown === null) missingParams.push('markdown');

    // 参数验证
    if (missingParams.length > 0) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: `缺少必需参数：${missingParams.join(' 和 ')}`,
        },
      }, 400);
    }

    const validTemplateId = templateId as string;
    const markdownText = typeof markdown === 'string' ? markdown : String(markdown);

    // 获取数据库实例
    const db = await getDatabase();

    // 查找模板
    const template = getTemplateById(db, validTemplateId);
    if (!template) {
      return c.json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: `模板 ${validTemplateId} 不存在`,
        },
      }, 404);
    }

    // 使用提供的配置或模板的配置
    const config = templateConfig || template.config;

    if (markdownText.trim().length === 0) {
      return c.json({
        success: true,
        html: '',
        warnings: [],
      });
    }

    // 转换 Markdown
    const { html, warnings } = await convertMarkdownToHTML(markdownText, config);

    return c.json({
      success: true,
      html,
      warnings,
    });
  } catch (error) {
    console.error('转换失败:', error);
    return c.json({
      success: false,
      error: {
        code: 'CONVERSION_ERROR',
        message: error instanceof Error ? error.message : '转换失败',
      },
    }, 500);
  }
});

export default convert;
