---
description: MP-Formatter 项目技术栈指南：使用 Bun + Hono + unified + SQLite
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: true
---

# MP-Formatter 项目技术栈

这是一个微信公众号 Markdown 排版工具，使用 Bun 作为运行时。

## 项目特定技术栈

### 核心技术
- **运行时**: Bun（原生 TypeScript 支持）
- **后端框架**: Hono（轻量级 Web 框架，替代 Express）
- **前端**: React + TailwindCSS + shadcn/ui
- **Markdown 解析**: unified 生态（remark-parse + remark-rehype + rehype-stringify）
- **数据库**: bun:sqlite（存储模板配置和素材元数据）
- **文件处理**: Bun.file（处理素材上传）

### 关键架构决策
1. **不使用 Express**：使用 Hono 作为 API 框架
2. **不使用 Vite**：使用 Bun 的内置 HTML imports 和 HMR
3. **不使用外部数据库**：使用 Bun 内置的 SQLite
4. **样式转换**：TailwindCSS → 标准 CSS → 内联样式（注入到 HTML `style` 属性）

### 核心转换流程
```
Markdown → (remark-parse) → MDAST → (remark-rehype) → HAST 
     → (自定义插件注入样式) → HAST with inline styles 
     → (rehype-stringify) → HTML
```

### 微信公众号 HTML/CSS 限制（关键）

#### ⚠️ 必须遵守的限制
1. **只能使用内联样式**：所有样式必须写在元素的 `style` 属性中
2. **定位属性会被过滤**：`position: absolute/fixed/relative` 全部无效
3. **伪元素/伪类不可用**：
   - TailwindCSS 的 `before:`, `after:`, `hover:` 等前缀无效
   - `:before`, `:after` 会被微信过滤
4. **`id` 属性会被删除**：无法使用锚点跳转
5. **`class` 保留但无用**：因为无法定义 CSS 选择器

#### 转换要点
- **TailwindCSS 类名转换时需过滤**：
  - 移除所有定位相关类（`relative`, `absolute`, `fixed`, `sticky`）
  - 移除所有伪元素类（`before:*`, `after:*`）
  - 移除所有伪类（`hover:*`, `focus:*`, `active:*`）
  - 谨慎处理 `transform` 相关类（兼容性不稳定）
  
- **推荐使用的单位**：`px`, `vw`, `vh`, `em`, `rem`
- **不推荐使用的单位**：百分比 `%`（特别是用于高度和偏移）

- **图片素材**：
  - 必须使用微信素材库链接（特别是 SVG 内的图片）
  - 不支持 Base64 编码的图片
  - 支持 `border-radius`, `box-shadow` 等装饰样式

#### 列表自定义标记的正确方法
❌ **错误**（会被过滤）：
```css
/* 使用伪元素 */
li { position: relative; }
li:before { content: '•'; position: absolute; }
```

✅ **正确**：
- 使用原生 `list-style-type` 或 `list-style-image`
- 通过实际的 HTML 元素插入（如 `<span>` 包裹标记符号）
- 使用背景图片（`background-image` 指向素材库）

---

## Bun 使用指南

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.
