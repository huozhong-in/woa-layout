import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import api from './api';
import { getDatabase } from './lib/db';
import index from './index.html';

// 初始化数据库
await getDatabase();

const app = new Hono();

// 挂载 API 路由
app.route('/api', api);

// 静态文件服务
app.use('/assets/*', serveStatic({ root: './' }));

// 前端路由（返回 index.html）
app.get('/*', (c) => {
  return c.html(index);
});

// 启动服务器
export default {
  port: 3000,
  fetch: app.fetch,
};

console.log(`🚀 WOA-Layout 服务器启动成功！`);
console.log(`📍 访问地址: http://localhost:3000`);
console.log(`📍 API 地址: http://localhost:3000/api`);

