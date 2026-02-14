import { Hono } from 'hono';
import api from './api';
import { getDatabase } from './lib/db';
import index from './index.html';

// 初始化数据库
await getDatabase();

const app = new Hono();

// 挂载 API 路由
app.route('/api', api);

// 启动服务器
Bun.serve({
  port: 3000,
  routes: {
    '/api/*': app.fetch,
    '/*': index,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 WOA-Layout 服务器启动成功！`);
console.log(`📍 访问地址: http://localhost:3000`);
console.log(`📍 API 地址: http://localhost:3000/api`);

