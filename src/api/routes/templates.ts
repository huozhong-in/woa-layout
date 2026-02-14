// src/api/routes/templates.ts
// 模板管理 API 路由

import { Hono } from 'hono';
import {
  getDatabase,
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../../lib/db';
import type { TemplateConfig } from '../../lib/db/types';

const templates = new Hono();

/**
 * GET /api/templates
 * 获取所有模板列表
 */
templates.get('/', async (c) => {
  try {
    const db = await getDatabase();
    const allTemplates = getAllTemplates(db);

    return c.json({
      success: true,
      data: allTemplates,
    });
  } catch (error) {
    console.error('获取模板列表失败:', error);
    return c.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: '获取模板列表失败',
      },
    }, 500);
  }
});

/**
 * GET /api/templates/:id
 * 获取单个模板详情
 */
templates.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = await getDatabase();
    const template = getTemplateById(db, id);

    if (!template) {
      return c.json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: `模板 ${id} 不存在`,
        },
      }, 404);
    }

    return c.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('获取模板失败:', error);
    return c.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: '获取模板失败',
      },
    }, 500);
  }
});

/**
 * POST /api/templates
 * 创建新模板
 */
templates.post('/', async (c) => {
  try {
    const { id, name, config } = await c.req.json();

    // 参数验证
    if (!id || !name || !config) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '缺少必需参数：id, name, config',
        },
      }, 400);
    }

    const db = await getDatabase();

    // 检查 ID 是否已存在
    const existing = getTemplateById(db, id);
    if (existing) {
      return c.json({
        success: false,
        error: {
          code: 'TEMPLATE_EXISTS',
          message: `模板 ID ${id} 已存在`,
        },
      }, 409);
    }

    // 创建模板
    createTemplate(db, id, name, config as TemplateConfig);

    return c.json({
      success: true,
      message: '模板创建成功',
      data: { id, name },
    }, 201);
  } catch (error) {
    console.error('创建模板失败:', error);
    return c.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : '创建模板失败',
      },
    }, 500);
  }
});

/**
 * PUT /api/templates/:id
 * 更新现有模板
 */
templates.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { name, config } = await c.req.json();

    // 参数验证
    if (!name || !config) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: '缺少必需参数：name, config',
        },
      }, 400);
    }

    const db = await getDatabase();

    // 检查模板是否存在
    const existing = getTemplateById(db, id);
    if (!existing) {
      return c.json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: `模板 ${id} 不存在`,
        },
      }, 404);
    }

    // 更新模板
    updateTemplate(db, id, name, config as TemplateConfig);

    return c.json({
      success: true,
      message: '模板更新成功',
    });
  } catch (error) {
    console.error('更新模板失败:', error);
    return c.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : '更新模板失败',
      },
    }, 500);
  }
});

/**
 * DELETE /api/templates/:id
 * 删除模板（不能删除默认模板）
 */
templates.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = await getDatabase();

    // 检查模板是否存在
    const existing = getTemplateById(db, id);
    if (!existing) {
      return c.json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: `模板 ${id} 不存在`,
        },
      }, 404);
    }

    // 检查是否为默认模板
    if (existing.is_default === 1) {
      return c.json({
        success: false,
        error: {
          code: 'CANNOT_DELETE_DEFAULT',
          message: '不能删除默认模板',
        },
      }, 403);
    }

    // 删除模板
    deleteTemplate(db, id);

    return c.json({
      success: true,
      message: '模板删除成功',
    });
  } catch (error) {
    console.error('删除模板失败:', error);
    return c.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : '删除模板失败',
      },
    }, 500);
  }
});

export default templates;
