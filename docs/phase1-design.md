# WOA-Layout 第一期（MVP）详细设计文档

> 记录第一期功能的详细设计方案和沟通决策

---

## ✅ 已确认的核心决策（2026-02-14）

### 架构层面
1. **三栏布局**：配置器（左，300-350px）| Markdown 编辑器（中）| 预览区（右）
2. **TailwindCSS 转换**：使用官方 `tailwindcss` + `postcss` → 内联样式
3. **素材存储**：独立 `uploads/` 目录，通过 `/api/assets/{filename}` 访问
4. **CSS 变量处理**：编译时替换为实际值（完全内联化）

### 用户体验
- 默认加载样式元素齐全的 Markdown 示例（见附录A）
- 实时预览防抖 300ms
- 样式配置采用分类折叠面板（Accordion）

### 技术约束
- 第一期不支持多用户/租户
- 第一期不需要 API 认证（内部工具）
- 预留 CDN 扩展接口

---

## 待确认的设计决策

### 1. 样式配置器 UI 设计

#### 1.1 配置界面布局
- [x] **问题**：样式配置器放在哪里？
  - ✅ **已确认**：三栏布局（配置器 | Markdown 编辑器 | 预览区）
  - 配置器：固定左侧边栏（可折叠，宽度约 300-350px）
  - Markdown：中间编辑区（可调整宽度）
  - 预览区：右侧实时预览（模拟手机屏幕宽度）

#### 1.2 标签样式配置组织方式
- [ ] **问题**：如何组织 15+ 个 HTML 标签的样式配置？
  - 选项A：单一长列表（带滚动）
  - 选项B：分类折叠面板（标题/段落/列表/强调）
  - 选项C：标签页切换
  - **建议**：选项B - 按标签类型分组的折叠面板（Accordion）

#### 1.3 样式输入方式
- [ ] **问题**：TailwindCSS 类名输入的交互形式？
  - 选项A：纯文本输入框（自由输入）
  - 选项B：文本输入 + 自动补全（提示常用类名）
  - 选项C：可视化选择器（颜色选择器、间距滑块等）
  - **建议**：选项B（第一期）→ 后续逐步增强到选项C

#### 1.4 实时预览触发机制
- [ ] **问题**：何时更新预览区？
  - 选项A：每次输入立即更新（防抖 300ms）
  - 选项B：失焦后更新
  - 选项C：手动点击"应用"按钮
  - **建议**：选项A - 防抖 300ms，提供更流畅的体验

---

### 2. Markdown 编辑器功能范围

#### 2.1 编辑器组件选型
- [ ] **问题**：使用哪种编辑器？
  - 选项A：基础 `<textarea>` + 语法高亮（react-syntax-highlighter）
  - 选项B：CodeMirror 6（完整代码编辑器）
  - 选项C：Monaco Editor（VS Code 内核）
  - **建议**：选项A（第一期轻量化）→ 根据反馈升级

#### 2.2 默认示例文章
- [x] **问题**：示例文章包含哪些元素？
  - ✅ **已确认**：默认加载一个样式元素齐全的 Markdown 示例
  - **必须包含**：h1~h6、段落、粗体、斜体、列表（有序/无序）、引用、行内代码、代码块、分割线、链接、图片
  - **目的**：方便全面测试样式配置效果
  - 参考：见文档末尾「附录A：默认示例 Markdown」

---

### 3. 模板管理功能

#### 3.1 初始模板策略
- [ ] **问题**：系统初始提供哪些默认模板？
  - **建议方案**：
    - `default-simple`：极简黑白风格（保底方案）
    - `business-blue`：商务蓝色调（企业通用）
    - `tech-dark`：科技暗色风格（IT 行业）

#### 3.2 模板操作流程
- [ ] **问题**：创建新模板时的初始状态？
  - 选项A：空白模板（所有标签无样式）
  - 选项B：基于现有模板复制
  - 选项C：自动继承 default-simple
  - **建议**：选项C - 降低配置门槛

#### 3.3 模板切换时的数据处理
- [ ] **问题**：切换模板时，未保存的修改如何处理？
  - 选项A：弹窗提示保存
  - 选项B：自动保存到草稿
  - 选项C：直接丢弃（危险）
  - **建议**：选项A - 明确提示用户

---

### 4. 素材库管理

#### 4.1 素材存储方案
- [x] **问题**：素材文件存储在哪里？
  - ✅ **已确认**：素材与项目分离，独立存储在 `uploads/` 目录
  - 通过 URL 访问：`/api/assets/{filename}`
  - 文件命名：`{timestamp}-{random8}-{sanitized-name}.{ext}`
  - 预留扩展：后续可无缝切换到 CDN（只需修改 URL 前缀）

#### 4.2 素材 URL 生成规则
- [ ] **问题**：生成的 URL 格式？
  - **建议方案**：`/api/assets/{filename}` → 通过 Hono 中间件返回文件
  - 文件名规则：`{timestamp}-{random}-{originalName}`

#### 4.3 素材库 UI 展示
- [ ] **问题**：素材选择器的交互形式？
  - 选项A：弹窗 Modal + 网格展示
  - 选项B：侧边栏抽屉 + 列表
  - **建议**：选项A - 支持预览缩略图，点击复制 URL

#### 4.4 素材在样式配置中的引用
- [ ] **问题**：如何在 TailwindCSS 类名中引用素材？
  - **方案**：使用 CSS 变量占位符，例如：
    ```
    bg-[url(var(--asset-divider))] bg-center bg-no-repeat
    ```
  - 转换时替换为实际 URL：
    ```css
    background-image: url(/api/assets/divider-123.svg);
    ```

---

### 5. 核心转换引擎实现细节

#### 5.1 TailwindCSS → CSS 转换方案
- [x] **问题**：如何实现类名到 CSS 的转换？
  - ✅ **已确认**：使用 Tailwind 官方方案（`tailwindcss` + `postcss`）
  - **转换流程**：
    ```
    TailwindCSS 类名 → PostCSS + Tailwind → 标准 CSS → 内联到 style 属性
    ```
  - **实现方式**：
    1. 为每个 HTML 标签构造虚拟 HTML 片段（带 class）
    2. 通过 PostCSS 处理，生成完整 CSS
    3. 解析 CSS 规则，提取属性值
    4. 注入到 HAST 节点的 `style` 属性
  - **可控性**：转换规则清晰，易于调试和维护

#### 5.2 样式注入到 HAST 的时机
- [ ] **问题**：在哪个环节注入内联样式？
  - **建议方案**：
    ```
    Markdown → MDAST → HAST → [自定义插件] 注入 style → HTML
    ```
  - 自定义 rehype 插件：遍历 HAST 节点 → 匹配 tagName → 注入 style 属性

#### 5.3 微信兼容性过滤规则
- [ ] **问题**：如何实现禁用样式的过滤？
  - **建议方案**：
    - 维护黑名单：`['position', 'z-index', 'transform', ...]`
    - 在 CSS 转换后，解析 style 属性 → 移除黑名单属性
    - 记录被移除的属性 → 返回 warnings 数组

#### 5.4 CSS 变量（variables）的处理
- [x] **问题**：品牌色变量如何注入到最终 HTML？
  - ✅ **已确认**：编译时替换变量为实际值（完全内联化）
  - **处理流程**：
    ```javascript
    // 1. 读取模板配置中的 variables
    const variables = { brandColor: '#007aff', accentColor: '#f0f7ff' };
    
    // 2. 替换 TailwindCSS 类名中的变量引用
    'text-[var(--brandColor)]' → 'text-[#007aff]'
    
    // 3. 通过 Tailwind 转换为 CSS
    → 'color: #007aff;'
    ```
  - **注意**：微信不支持 `<style>` 标签和 CSS 变量，必须完全内联

---

### 6. 数据库 Schema 设计

#### 6.1 templates 表结构
```sql
CREATE TABLE templates (
  id TEXT PRIMARY KEY,           -- 如：enterprise-a-simple-blue
  name TEXT NOT NULL,            -- 显示名称：企业A-简约蓝
  config TEXT NOT NULL,          -- JSON 格式的完整配置
  created_at INTEGER NOT NULL,   -- Unix 时间戳
  updated_at INTEGER NOT NULL,
  is_default INTEGER DEFAULT 0   -- 是否系统默认模板
);
```

#### 6.2 assets 表结构
```sql
CREATE TABLE assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,        -- 存储的文件名
  original_name TEXT NOT NULL,   -- 用户上传的原始文件名
  mime_type TEXT NOT NULL,       -- image/svg+xml, image/png 等
  size INTEGER NOT NULL,         -- 文件大小（字节）
  url TEXT NOT NULL,             -- 访问 URL
  uploaded_at INTEGER NOT NULL
);
```

#### 6.3 是否需要用户/租户隔离？
- [ ] **问题**：第一期是否支持多用户/多租户？
  - **建议**：第一期 **不支持**，单用户模式（简化开发）
  - 预留扩展：后续可增加 `user_id` 和 `tenant_id` 字段

---

### 7. API 接口详细设计

#### 7.1 错误处理规范
- [ ] **问题**：统一的错误返回格式？
  - **建议方案**：
    ```json
    {
      "success": false,
      "error": {
        "code": "TEMPLATE_NOT_FOUND",
        "message": "模板 ID 不存在",
        "details": {}
      }
    }
    ```

#### 7.2 是否需要认证/鉴权？
- [ ] **问题**：API 接口是否需要身份验证？
  - **建议**：第一期 **不需要**（内部工具，部署在内网）
  - 预留：后续可添加 API Token 机制

#### 7.3 接口版本化
- [ ] **问题**：是否采用 API 版本化？
  - 选项A：URL 版本化（`/api/v1/convert`）
  - 选项B：Header 版本化（`X-API-Version: 1`）
  - 选项C：第一期不版本化
  - **建议**：选项C - 第一期不引入复杂性

---

## 技术实现方案

### 8. 前端技术选型确认

#### 8.1 状态管理
- [x] **问题**：使用什么状态管理方案？
  - ✅ **已确认**：Zustand（已安装）
  - 优势：简洁的 API、无需样板代码、TypeScript 友好

#### 8.2 表单处理
- [ ] **问题**：样式配置表单用什么方案？
  - 选项A：react-hook-form（推荐）
  - 选项B：原生 controlled components
  - **建议**：选项B - 配置项数量可控，不需要复杂表单库

---

### 9. 开发优先级排序

#### 阶段 1：核心转换能力（1-2 周）
1. ✅ 搭建 Bun + Hono 基础架构
2. ✅ 实现 Markdown → HTML 转换管道（unified）
3. ✅ 实现 TailwindCSS → 内联样式转换
4. ✅ 实现微信兼容性过滤器

#### 阶段 2：前端工作台（2-3 周）
1. ✅ 双栏布局（Markdown 编辑器 + 预览区）
2. ✅ 样式配置器 UI（折叠面板）
3. ✅ 实时预览（防抖更新）
4. ✅ 模板管理（创建/切换/保存）

#### 阶段 3：素材管理（1 周）
1. ✅ 素材上传接口（`POST /api/assets`）
2. ✅ 素材列表展示
3. ✅ 素材选择器（复制 URL）

#### 阶段 4：完善与优化（1 周）
1. ✅ 一键复制富文本功能
2. ✅ 兼容性警告面板
3. ✅ 错误处理和用户提示
4. ✅ 默认模板预设

---

## 需要确认的问题清单

### 高优先级（影响架构）
1. **样式配置器的布局形式**：三栏布局 or 两栏布局？
2. **TailwindCSS 转换方案**：使用官方 API or 自建？
3. **素材存储位置**：本地 or 预留 CDN？
4. **CSS 变量处理**：编译时替换 or 保留（微信不支持）？

### 中优先级（影响交互）
5. **样式配置的组织方式**：折叠面板 or 标签页？
6. **模板切换时未保存数据**：提示保存 or 自动保存？
7. **Markdown 编辑器功能**：基础输入 or 完整 IDE？

### 低优先级（可灵活调整）
8. **默认模板数量**：1 个 or 3 个？
9. **示例文章内容**：偏技术 or 偏营销？
10. **错误提示文案**：中文 or 支持国际化？

---

## 技术风险与缓解措施

### 风险 1：TailwindCSS 类名解析复杂度
- **风险**：任意值语法（`text-[#ff0000]`）和变量引用难以解析
- **缓解**：使用 Tailwind 官方 PostCSS 插件，避免自己解析

### 风险 2：微信兼容性规则变化
- **风险**：微信可能调整 HTML 过滤规则
- **缓解**：兼容性过滤器独立为配置文件，便于快速调整

### 风险 3：实时预览性能
- **风险**：大文档 + 复杂样式导致卡顿
- **缓解**：防抖优化 + Web Worker 后台转换（可选）

---

## 下一步行动

### 需要立即确认
- [ ] 与实施团队确认 **高优先级问题**（1-4）
- [ ] 确定开发排期和里程碑

### 准备工作
- [ ] 搭建开发环境（Bun + Hono + React）
- [ ] 初始化数据库 Schema
- [ ] 准备默认模板 JSON 配置

---

## 附录A：默认示例 Markdown

以下是用于测试样式配置的完整示例文章，涵盖所有支持的 Markdown 元素：

```markdown
# 一级标题：WOA-Layout 排版引擎测试

这是一段普通的段落文本，用于测试基础段落样式。段落应该包含合适的行高、字体大小和颜色配置。这里有一些**粗体文字**和*斜体文字*，以及~~删除线文字~~。

## 二级标题：功能特性介绍

通过 **API 驱动 + 模板化配置** 的方式，实现 Markdown 到微信公众号样式 HTML 的工业化转换。系统支持以下核心能力：

### 三级标题：样式配置能力

支持对所有 Markdown 标签进行精细化样式控制，包括但不限于标题、段落、列表、引用等元素。

#### 四级标题：技术栈说明

本项目采用 Bun + Hono + React + TailwindCSS 技术栈构建。

##### 五级标题：补充说明

五级标题通常用于更细分的内容组织。

###### 六级标题：最小层级

这是 Markdown 支持的最小标题层级。

---

## 列表元素测试

### 无序列表

- 第一项：核心转换引擎
- 第二项：实时预览功能
- 第三项：素材库管理
  - 嵌套子项 1：支持图片上传
  - 嵌套子项 2：生成永久 URL
- 第四项：模板配置系统

### 有序列表

1. 第一步：创建模板
2. 第二步：配置样式
3. 第三步：上传素材
   1. 准备图片素材
   2. 通过素材库上传
4. 第四步：实时预览
5. 第五步：保存并获取 templateId

---

## 引用块测试

> 这是一段引用文字，通常用于展示重要的提示信息或引用他人的观点。
> 
> 引用块可以包含多个段落，每个段落用空行分隔。
> 
> **引用中也可以使用粗体**和*斜体*等强调样式。

---

## 代码测试

### 行内代码

使用 `const result = await fetch('/api/convert')` 调用转换接口，返回 `{ success: true, html: "..." }` 格式的数据。

### 代码块

```typescript
// TypeScript 代码示例
interface Template {
  id: string;
  name: string;
  variables: {
    brandColor: string;
    accentColor: string;
  };
  styles: Record<string, string>;
}

async function convertMarkdown(templateId: string, markdown: string) {
  const response = await fetch('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId, markdown })
  });
  return response.json();
}
```

```json
{
  "id": "enterprise-blue",
  "name": "企业蓝色主题",
  "variables": {
    "brandColor": "#007aff",
    "accentColor": "#f0f7ff"
  }
}
```

---

## 链接测试

访问 [Bun 官方文档](https://bun.sh) 了解更多关于 Bun 运行时的信息。

也可以使用纯文本 URL：https://github.com/oven-sh/bun

---

## 图片测试

![WOA-Layout Logo](https://via.placeholder.com/600x200/007aff/ffffff?text=WOA-Layout)

*图片说明文字：这是一张占位符图片*

---

## 表格测试

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 运行时 | Bun | 原生 TypeScript 支持 |
| 后端框架 | Hono | 轻量级 Web 框架 |
| 前端框架 | React | 通过 shadcn/ui + TailwindCSS |
| 数据库 | SQLite | 使用 bun:sqlite |

---

## 混合内容测试

### 复杂段落

在实际使用中，我们经常需要在同一段落中混合多种强调样式。例如：**粗体文字**可能需要和*斜体文字*搭配使用，有时还需要标注`代码片段`或者~~删除的内容~~。这种混合使用的场景在技术文档中非常常见。

### 列表中的代码

1. 安装依赖：`bun install`
2. 启动开发服务器：`bun --hot ./src/index.ts`
3. 访问地址：`http://localhost:3000`

### 引用中的列表

> **注意事项：**
> 
> - 微信不支持外部 CSS
> - 必须使用内联样式
> - 不支持 JavaScript

---

## 结语

本文档涵盖了所有 Markdown 基础语法元素，可用于全面测试 WOA-Layout 的样式配置功能。

**加粗强调**：请确保所有样式都能正确转换为内联样式！

*斜体提示*：测试完成后记得保存模板配置。
```

---

## 附录B：核心技术实现伪代码

### TailwindCSS 转换流程

```typescript
// 1. 构造虚拟 HTML 片段
function buildVirtualHTML(tagName: string, tailwindClasses: string): string {
  return `<${tagName} class="${tailwindClasses}">content</${tagName}>`;
}

// 2. 通过 PostCSS + Tailwind 处理
async function tailwindToCSS(html: string): Promise<string> {
  const result = await postcss([
    tailwindcss({
      content: [{ raw: html, extension: 'html' }],
      theme: { /* 自定义配置 */ }
    })
  ]).process('@tailwind utilities;', { from: undefined });
  
  return result.css;
}

// 3. 解析 CSS 并提取样式
function extractStyles(css: string, tagName: string): Record<string, string> {
  // 解析 CSS，提取匹配 tagName 的规则
  // 返回 { color: '#333', lineHeight: '1.6', ... }
}

// 4. 注入到 HAST 节点
function injectStyles(node: HASTNode, styles: Record<string, string>) {
  node.properties.style = Object.entries(styles)
    .map(([key, value]) => `${kebabCase(key)}: ${value}`)
    .join('; ');
}
```

---

**文档版本**：v1.0  
**创建日期**：2026-02-14  
**最后更新**：2026-02-14  
**状态**：✅ 所有设计决策已确认，正式进入开发阶段

---

## 支持的 Markdown 标签范围

### 第一期实现策略
- **理论**：支持所有 Markdown 标签的自定义样式渲染
- **实践**：提供默认样式 + 常用标签的配置能力
- **原则**：按需扩展，根据企业反馈迭代

### 优先支持的标签（约20个）

#### 标题类（6个）
`h1`, `h2`, `h3`, `h4`, `h5`, `h6`

#### 段落类（4个）
`p`, `blockquote`, `code`, `pre`

#### 列表类（3个）
`ul`, `ol`, `li`

#### 强调类（3个）
`strong`, `em`, `del`

#### 其他（4个）
`hr`, `a`, `img`, `table`（包含 thead/tbody/tr/th/td）

这些标签覆盖 90% 的企业排版场景。
