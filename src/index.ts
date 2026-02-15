import { Hono } from 'hono';
import api from './api';
import { getDatabase } from './lib/db';
import index from './index.html';

const isProduction = Bun.env.NODE_ENV === 'production';

function resolvePort(): number {
  const argv = Bun.argv;

  const portArgEq = argv.find((arg) => arg.startsWith('--port='));
  if (portArgEq) {
    const value = Number.parseInt(portArgEq.split('=')[1] || '', 10);
    if (Number.isInteger(value) && value > 0) return value;
  }

  const portArgIndex = argv.findIndex((arg) => arg === '--port' || arg === '-p');
  if (portArgIndex >= 0) {
    const value = Number.parseInt(argv[portArgIndex + 1] || '', 10);
    if (Number.isInteger(value) && value > 0) return value;
  }

  const envPort = Number.parseInt(Bun.env.PORT || '', 10);
  if (Number.isInteger(envPort) && envPort > 0) return envPort;

  return 3000;
}

const port = resolvePort();

// 初始化数据库
await getDatabase();

const app = new Hono();

// 挂载 API 路由
app.route('/api', api);

// 启动服务器
Bun.serve({
  port,
  routes: {
    '/api/*': app.fetch,
    '/*': index,
  },
  development: isProduction
    ? undefined
    : {
        hmr: true,
        console: true,
      },
});

console.log(`🚀 WOA-Layout 服务器启动成功！`);
console.log(`📍 访问地址: http://localhost:${port}`);
console.log(`📍 API 地址: http://localhost:${port}/api`);

