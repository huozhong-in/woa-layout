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
