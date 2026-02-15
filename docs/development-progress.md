# WOA-Layout 开发进度报告

> 更新时间：2026-02-15  
> 状态：MVP 可用 ✅（后端/API/转换链路/前端主流程均已打通）

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
- ✅ 实现 Rehype 插件（样式注入）
- ✅ 实现完整的 Markdown → HTML 转换管道
- ✅ 微信兼容性过滤器（移除 `position`, `transform`, `animation` 等）
- ✅ CSS 变量替换功能
- ✅  移除不支持的 TailwindCSS 前缀（`hover:`, `before:`, `sm:` 等）
- ✅ 支持素材别名 `@bg(alias)`（含 `url()` 引号规范化）
- ✅ 支持内容标记 `{{asset:alias}}`（预处理为图片）
- ✅ 单元测试持续补充（核心场景已覆盖）

**文件清单**：
- `src/lib/converter/tailwind-to-inline.ts`
- `src/lib/converter/rehype-inject-styles.ts`
- `src/lib/converter/markdown-to-html.ts`
- `src/lib/converter/index.ts`
- `src/lib/converter/markdown-to-html.test.ts`

**当前重点测试覆盖**：
```
✓ @bg(alias) 自动替换为素材 URL
✓ 行内 code 与块级 pre>code 样式分离
✓ {{asset:alias}} 可解析为图片
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

## ✅ 前端状态

### 5. 前端 React 组件（100%，MVP）
已实现的组件：
- ✅ 主布局（三栏：配置器 | 编辑器 | 预览区）
- ✅ 样式配置器（分类折叠面板 + 实时编辑）
- ✅ Markdown 编辑器（textarea + 300ms 防抖）
- ✅ 实时预览区（HTML 渲染 + 警告提示）
- ✅ 复制 HTML 功能
- ✅ Zustand 状态管理
- ✅ 初始化加载和自动转换
- ✅ 模板切换即时生效（切换后立即重新渲染）
- ✅ 模板操作区重构（保存模板 + 三点菜单）
- ✅ 模板菜单能力（另存为 / 改名 / 删除）
- ✅ 默认模板保护（不可改名、不可删除；主按钮显示“另存为”）
- ✅ 样式输入框失焦触发重新渲染
- ✅ 未保存提示（离开/切换前确认）
- ✅ 最小素材管理 Dialog（上传 / 列表 / 复制 URL / 删除拦截提示）
- ✅ 素材别名可视化编辑区（新增/删除 alias、快捷设别名）
- ✅ 别名标记复制（`{{asset:alias}}`）
- ✅ 全局配置层最小版（主题色 / 字体 / 基准字号 / 代码主题）
- ✅ 错误处理优化（统一 toast 与失败回滚）

**文件清单**：
- `src/components/Layout.tsx`（主布局）
- `src/components/StyleConfigurator.tsx`（样式配置器）
- `src/components/MarkdownEditor.tsx`（Markdown 编辑器）
- `src/components/Preview.tsx`（预览组件）
- `src/store/index.ts`（Zustand 状态管理）
- `src/hooks/useConverter.ts`（转换逻辑）
- `src/hooks/useInitialize.ts`（初始化逻辑）
- `src/App.tsx`（主应用入口）

## 📊 整体进度

| 模块 | 进度 | 状态 |
|------|------|------|
| 设计规划 | 100% | ✅ 完成 |
| 数据库 | 100% | ✅ 完成 |
| 核心引擎 | 100% | ✅ 完成 |
| 后端 API | 100% | ✅ 完成 |
| 前端 UI | 100% | ✅ MVP 完成 |
| **总体** | **100%** | **✅ MVP 可用** |

---

## 🎯 后续可选迭代（非阻塞）

1. **素材库增强**
   - 引用来源一键定位到模板
   - 支持按名称搜索素材
   - 批量上传与批量删除

2. **体验增强**
   - 一键复制富文本到剪贴板
   - 兼容性警告分级与可读性优化

3. **能力扩展**
   - 更多预设模板
   - 导出/导入模板 JSON
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

#### 问题 6：样式系统缺少全局配置层（2026-02-15）
**现象**：主题色、字体、字号、代码块主题需要在多个标签样式中重复手工维护，成本高且易不一致。

**解决方案（最小版）**：
1. 在 `TemplateConfig` 中新增 `global`：`themeColor` / `fontFamily` / `baseFontSize` / `codeTheme`。
2. 在 `rehypeInjectStyles` 注入阶段应用全局默认样式（只补缺省，不覆盖标签手写样式）。
3. 支持代码块主题（light/dark/androidstudio）和基础文本字号映射（sm/base/lg）。
4. 默认模板补充全局配置初始值，旧模板保持兼容。

#### 问题 7：分隔线素材别名 `@bg(alias)` 用法与引号陷阱（2026-02-15）
**现象**：
- 已配置 `hr` 背景图后，分隔线仍不显示。
- DevTools 网络请求出现异常 URL：`/%22/api/assets/overseas-divider.svg%22`（包含编码后的引号）。

**根因判断**：
1. `---` 对应的是 `hr` 标签，不是段落 `p`。
2. `bg-[url("@bg(divider)")]` 写法会让引号进入最终 `url("...")`，浏览器把引号当作 URL 字符请求。
3. 某些情况下缺失 `background-size`，即使图片加载成功也不明显。

**正确用法（推荐）**：
1. 上传 SVG 到素材库，得到 URL（示例：`/api/assets/overseas-divider.svg?v=2`）。
2. 在模板配置中设置别名：`config.assets.divider = /api/assets/overseas-divider.svg?v=2`。
3. 在 `hr` 样式中引用别名（无引号）：
   - `my-[40px] border-0 h-[24px] w-full bg-[url(@bg(divider))] bg-no-repeat bg-center bg-[length:100%_100%]`
4. 在 Markdown 中使用 `---` 触发分隔线渲染。

**实现与兜底**：
- 转换器已支持 `@bg(alias)` 自动替换为 `config.assets[alias]`。
- 已增加 `url()` 引号规范化（自动去掉 `url("...")` / `url('...')` 外层引号）。
- `hr` 使用背景图且未设置 `background-size` 时，自动补 `100% 100%`。

**验收标准**：
- DevTools 中 `hr` 的 `background-image` 为 `/api/assets/...`，不含 `%22`。
- `hr` 可见且宽高、留白符合预期。
- 替换 `config.assets.divider` URL 后无需改 `hr` 样式即可切换视觉。

#### 问题 8：需要在正文中直接引用素材（`{{asset:alias}}`）（2026-02-15）
**现象**：
- 仅支持 `@bg(alias)` 只能覆盖背景图场景，正文插图仍需手贴 URL，维护成本高。

**解决方案**：
1. 新增预处理语法：`{{asset:alias}}`。
2. 在转换前将该标记替换为标准图片 Markdown：`![](assets[alias])`。
3. 若 alias 未配置，保留原标记并追加 warning，避免静默吞错。
4. 在素材管理弹窗提供 alias 可视化编辑与“复制标记”操作，降低使用门槛。

**验收标准**：
- `{{asset:cover}}` 能渲染为 `<img>`，且 `src` 指向 `config.assets.cover`。
- 删除或修改 `config.assets.cover` 后，正文无需改动即可跟随生效。
- alias 未配置时，转换结果包含可读 warning。

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
│   ├── components/             # React 组件
│   ├── index.html              # 前端入口
│   ├── frontend.tsx            # React 应用入口
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

**当前结论**：MVP 已可用于“模板样式 + 素材别名 + 正文标记”一体化工作流，后续以增强体验与批量能力为主。
