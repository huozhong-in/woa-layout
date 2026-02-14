// src/api/index.ts
// API 入口，汇总所有路由

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import convert from './routes/convert';
import templates from './routes/templates';
import assets from './routes/assets';

const api = new Hono();

// 中间件
api.use('*', logger()); // 请求日志
api.use('*', cors()); // CORS 支持

// 挂载路由
api.route('/convert', convert);
api.route('/templates', templates);
api.route('/assets', assets);

// 默认 Markdown 内容
api.get('/default-markdown', async (c) => {
  try {
    const file = Bun.file(new URL('../default.md', import.meta.url));
    const content = await file.text();

    return c.text(content, 200, {
      'Content-Type': 'text/markdown; charset=utf-8',
    });
  } catch (error) {
    console.error('读取默认 Markdown 失败:', error);
    return c.json({
      success: false,
      error: {
        code: 'DEFAULT_MARKDOWN_NOT_FOUND',
        message: '默认 Markdown 文件不存在或读取失败',
      },
    }, 500);
  }
});

// 健康检查
api.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// 404 处理
api.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '接口不存在',
    },
  }, 404);
});

// 错误处理
api.onError((err, c) => {
  console.error('未捕获的错误:', err);
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
    },
  }, 500);
});

export default api;
