# WOA-Layout 开发进度报告

> 更新时间：2026-02-15  
> 状态：后端完成 ✅ | 前端基础完成 ✅ | 微信列表兼容修复完成 ✅

---

## ✅ 已完成的工作

### 1. 设计阶段（100%）
- ✅ 确认所有设计决策
- ✅ 更新设计文档至 v1.0
- ✅ 定义支持的 Markdown 标签范围（~20个常用标签）
- ✅ 确定技术栈：Zustand（状态管理）、纯文本输入（样式配置）

### 2. 数据库层（100%）
- ✅ 创建 SQLite Schema（`templates` 和 `assets` 表）
- ✅ 实现数据库初始化脚本
- ✅ 实现 CRUD 操作函数
- ✅ 添加默认模板（`default-simple`）
- ✅ 类型定义（TypeScript）

**文件清单**：
- `src/lib/db/schema.sql`
- `src/lib/db/types.ts`
- `src/lib/db/index.ts`

### 3. 核心转换引擎（100%）
- ✅ 实现 TailwindCSS → 内联样式转换器
- ✅ 实现 Markdownhtype 插件（样式注入）
- ✅ 实现完整的 Markdown → HTML 转换管道
- ✅ 微信兼容性过滤器（移除 `position`, `transform`, `animation` 等）
- ✅ CSS 变量替换功能
- ✅  移除不支持的 TailwindCSS 前缀（`hover:`, `before:`, `sm:` 等）
- ✅ 单元测试（6个测试用例，全部通过）

**文件清单**：
- `src/lib/converter/tailwind-to-inline.ts`
- `src/lib/converter/rehype-inject-styles.ts`
- `src/lib/converter/markdown-to-html.ts`
- `src/lib/converter/index.ts`
- `src/lib/converter/markdown-to-html.test.ts`

**测试结果**：
```
✓ 基础段落转换
✓ 标题转换
✓ 粗体文字转换
✓ 行内代码转换
✓ CSS 变量替换
✓ 复杂 Markdown 转换
6 pass, 0 fail
```

### 4. 后端 API（100%）
- ✅ 搭建 Hono 框架
- ✅ 实现 `/api/convert` 转换接口
- ✅ 实现 `/api/templates` 模板管理接口（CRUD）
- ✅ 实现 `/api/assets` 素材管理接口（上传、列表、访问、删除）
- ✅ 错误处理和参数验证
- ✅ CORS 和日志中间件
- ✅ 健康检查接口

**文件清单**：
- `src/api/index.ts`
- `src/api/routes/convert.ts`
- `src/api/routes/templates.ts`
- `src/api/routes/assets.ts`
- `src/index.ts`（服务器入口）

**API 端点**：
| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/convert` | Markdown → HTML 转换 |
| GET | `/api/templates` | 获取模板列表 |
| GET | `/api/templates/:id` | 获取单个模板 |
| POST | `/api/templates` | 创建模板 |
| PUT | `/api/templates/:id` | 更新模板 |
| DELETE | `/api/templates/:id` | 删除模板 |
| GET | `/api/assets` | 获取素材列表 |
| GET | `/api/assets/:filename` | 访问素材文件 |
| GET | `/api/assets/references/:id` | 查询素材被哪些模板引用 |
| POST | `/api/assets` | 上传素材 |
| DELETE | `/api/assets/:id` | 删除素材（有引用时拦截） |
| GET | `/api/health` | 健康检查 |

**测试结果**：
```bash
✅ /api/health → { status: "ok" }
✅ /api/templates → { success: true, data: [1 template] }
✅ /api/convert → { success: true, html: "...", warnings: [] }
```

---

## 🚧 进行中的工作

### 5. 前端 React 组件（95%）
已实现的组件：
- ✅ 主布局（三栏：配置器 | 编辑器 | 预览区）
- ✅ 样式配置器（分类折叠面板 + 实时编辑）
- ✅ Markdown 编辑器（textarea + 300ms 防抖）
- ✅ 实时预览区（HTML 渲染 + 警告提示）
- ✅ 复制 HTML 功能
- ✅ Zustand 状态管理
- ✅ 初始化加载和自动转换

**文件清单**：
- `src/components/Layout.tsx`（主布局）
- `src/components/StyleConfigurator.tsx`（样式配置器）
- `src/components/MarkdownEditor.tsx`（Markdown 编辑器）
- `src/components/Preview.tsx`（预览组件）
- `src/store/index.ts`（Zustand 状态管理）
- `src/hooks/useConverter.ts`（转换逻辑）
- `src/hooks/useInitialize.ts`（初始化逻辑）
- `src/App.tsx`（主应用入口）

待完成功能：
- [x] 模板切换即时生效（切换后立即重新渲染）
- [x] 模板操作区重构（保存模板 + 三点菜单）
- [x] 模板菜单能力（另存为 / 改名 / 删除）
- [x] 默认模板保护（不可改名、不可删除；主按钮显示“另存为”）
- [x] 样式输入框失焦触发重新渲染
- [x] 未保存提示（离开/切换前确认）
- [x] 最小素材管理 Dialog（上传 / 列表 / 复制 URL / 删除拦截提示）
- [ ] 错误处理优化（统一 toast 与失败回滚）

---

## 📊 整体进度

| 模块 | 进度 | 状态 |
|------|------|------|
| 设计规划 | 100% | ✅ 完成 |
| 数据库 | 100% | ✅ 完成 |
| 核心引擎 | 100% | ✅ 完成 |
| 后端 API | 100% | ✅ 完成 |
| 前端 UI | 96% | 🚧 收尾 |
| **总体** | **97%** | **🚧 收尾** |

---

## 🎯 下一步计划

### 短期目标（本周）
1. **错误处理收尾**
   - 模板操作失败统一提示（toast）
   - 转换失败时回滚到上次成功结果

2. **模板交互打磨**
   - 未保存状态可视化（按钮/标题提示）
   - 模板名校验与重复提示优化

3. **回归测试与验收**
   - 微信编辑器复制粘贴回归（列表/嵌套/加粗）
   - 模板全流程回归（切换/另存为/改名/删除）

### 中期目标（下周）
4. **素材库（剩余增强）**
   - 引用来源一键定位到模板
   - 支持按名称搜索素材
   - 批量上传与批量删除

5. **增强功能**
   - 一键复制富文本到剪贴板
   - 兼容性警告提示
   - 错误提示 UI

### 长期目标（后续迭代）
6. **优化与增强**
   - 样式配置自动补全
   - 更多预设模板
   - 导出/导入模板JSON
   - 批量转换接口

---

## 💡 技术亮点

### 1. TailwindCSS 转换方案
使用 Tailwind CSS 官方 PostCSS 插件，支持：
- ✅ 任意值语法：`text-[#ff0000]`
- ✅ CSS 变量替换：`text-[var(--brandColor)]`
- ✅ 自动过滤微信不支持的属性
- ✅ 完全内联化（无 `<style>` 标签）

### 2. 性能优化
- ✅ 数据库索引（模板、素材）
- ✅ 长期文件缓存（素材 1 年）
- ⏸ 样式转换缓存（待实现）
- ⏸ Web Worker 后台转换（可选）

### 3. 开发体验
- ✅ TypeScript 全栈类型安全
- ✅ Bun 原生支持（零配置）
- ✅ 热重载（`bun --hot`）
- ✅ 单元测试覆盖

---

## 📝 开发笔记

### 遇到的问题与解决方案

#### 问题 1：Tailwind CSS v4 PostCSS 插件不兼容
**现象**：`tailwindcss` v4 的 PostCSS 插件已移至独立包
**解决**：降级至 Tailwind CSS v3.4.17（稳定版本）

#### 问题 2：颜色输出格式不一致
**现象**：Tailwind 输出 `rgb(0 122 255 / var(--tw-text-opacity, 1))`  
**解决**：修改测试断言，支持多种颜色格式

#### 问题 3：数据库初始化异步问题
**现象**：`Bun.file()` 是异步的，但在同步函数中使用
**解决**：将 `initDatabase()` 改为 `async function`

#### 问题 4：微信编辑器中“列表标记后紧跟粗体”导致换行（2026-02-15）
**现象**：
- 在微信公众号后台编辑器中，`- **无序列表**：...` 与 `1. **有序**列表项 1` 会出现“粗体后续文本被强制换行”。
- 预览区正常，微信编辑器异常；且同一列表项内“中间位置粗体”通常正常。

**根因判断**：
- 微信编辑器对列表项（`li`）中的隐形空白节点/换行节点和开头粗体节点解析不稳定。
- 当 `marker + leading-bold` 组合出现时，更容易触发错误断行。

**最终生效方案（与当前代码一致）**：
1. 在复制预处理中强制列表相关元素使用 `white-space: normal`。
2. 清理列表项中的文本空白节点（换行、制表符、纯空白文本节点）。
3. 仅对“开头为粗体、且无直接嵌套子列表”的 `li` 做定点扁平化为单一行内流。
4. 在最终复制前对 HTML 执行压缩：移除 `pre` 外换行和标签间空白（保留 `pre` 内容）。

**明确不采用（已验证会引入副作用）**：
- 全量改写为手动列表标记（`•` / `1.`）——会导致缩进和层级表现异常。
- 全量注入零宽字符（ZWSP）——会导致编辑态退格/光标行为异常。

**关键实现位置**：
- `src/lib/clipboard.ts`
   - `cleanupListStyles`
   - `normalizeListWhitespaceNodes`
   - `ensureLeadingTextNodeForBoldListItems`
   - `flattenLeadingBoldListItemFlow`
   - `compactHtmlForWechat`

**回归测试清单（必测）**：
- `- **无序列表**：用 \`-\`、\`*\` 或 \`+\` ...` 不换行。
- `1. **有序**列表项 1` 不换行。
- 同一段中“非开头粗体”保持正常。
- 嵌套列表缩进层级保持正确。
- 粘贴到微信编辑器与应用预览区表现一致。

#### 问题 5：素材删除需要全模板引用保护（2026-02-15）
**现象**：素材是全局资源，若被模板引用后直接删除，会导致模板渲染缺图或样式失效。

**解决方案**：
1. 新增引用扫描接口：`GET /api/assets/references/:id`。
2. 删除素材前服务端扫描所有模板（`config.assets`、`config.styles`、`@bg(alias)`）。
3. 若有引用，`DELETE /api/assets/:id` 返回 `409 ASSET_IN_USE` 并附带引用清单。
4. 仅在无引用时允许删除，并同步删除上传目录文件。

**说明**：前端已接入最小素材管理 Dialog，支持上传、列表、复制 URL、删除拦截与引用明细展示。

---

## 🚀 启动项目

### 开发模式
```bash
# 安装依赖
bun install

# 启动开发服务器（热重载）
bun --hot ./src/index.ts

# 访问地址
http://localhost:3000

# API 测试
curl http://localhost:3000/api/health
curl http://localhost:3000/api/templates
```

### 运行测试
```bash
# 运行所有测试
bun test

# 运行特定测试
bun test src/lib/converter/markdown-to-html.test.ts
```

---

## 📦 项目结构

```
woa-layout/
├── src/
│   ├── api/                    # 后端 API
│   │   ├── routes/
│   │   │   ├── convert.ts      # 转换接口
│   │   │   ├── templates.ts    # 模板接口
│   │   │   └── assets.ts       # 素材接口
│   │   └── index.ts            # API 入口
│   ├── lib/
│   │   ├── db/                 # 数据库
│   │   │   ├── schema.sql
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── converter/          # 转换引擎
│   │       ├── tailwind-to-inline.ts
│   │       ├── rehype-inject-styles.ts
│   │       ├── markdown-to-html.ts
│   │       ├── markdown-to-html.test.ts
│   │       └── index.ts
│   ├── components/             # React 组件（待开发）
│   ├── index.html              # 前端入口
│   ├── frontend.tsx            # React 应用（待开发）
│   └── index.ts                # 服务器入口
├── data/                       # 数据库文件
│   └── woa-layout.db
├── uploads/                    # 素材上传目录
├── docs/                       # 文档
│   ├── PRD.md
│   ├── phase1-design.md
│   └── tailwind-to-inline-conversion.md
├── package.json
├── tsconfig.json
└── README.md
```

---

**下次开发重点**：开始实现前端 React 组件，从主布局开始。
