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
    const { templateId, markdown, templateConfig } = await c.req.json();

    // 参数验证
    if (!templateId || !markdown) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '缺少必需参数：templateId 和 markdown',
        },
      }, 400);
    }

    // 获取数据库实例
    const db = await getDatabase();

    // 查找模板
    const template = getTemplateById(db, templateId);
    if (!template) {
      return c.json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: `模板 ${templateId} 不存在`,
        },
      }, 404);
    }

    // 使用提供的配置或模板的配置
    const config = templateConfig || template.config;

    // 转换 Markdown
    const { html, warnings } = await convertMarkdownToHTML(markdown, config);

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
