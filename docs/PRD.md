# WOA-Layout (Wechat official account) PRD (产品需求文档)

> 微信公众号 API 排版引擎 - 通过模板化样式配置实现 Markdown 到微信 HTML 的自动转换

---

## 1. 项目愿景

通过 **API 驱动 + 模板化配置** 的方式，实现 Markdown 到微信公众号样式 HTML 的工业化转换，帮助企业客户实现公众号内容的半自动化维护。

### 核心价值

- **样式模板化**：一次定义企业排版风格，后续批量应用
- **API 驱动**：通过接口调用实现自动化转换，无需手动排版
- **技术合规**：输出符合微信公众号 HTML 子集规范的内联样式代码

---

## 2. 产品定位

这不是给企业客户使用的工具，而是给**方案实施人员**使用的专业工具。实施人员通过本工具为每个企业客户定制排版模板，然后通过 API 实现批量转换。

---

## 3. 核心业务流程

### 3.1 样式模板配置流程

```
实施人员 → 创建模板(确定templateId) → 配置样式 → 上传素材 → 实时预览 → 保存模板 → 获得 templateId
```

### 3.2 API 转换流程

```
调用接口 (templateId + markdown) → 引擎解析 → 样式注入 → 返回 HTML → 粘贴到公众号后台
```

---

## 4. 功能需求

### 4.1 样式配置工作台（前端）

#### 核心界面
- **双栏布局**：
  - 左侧：Markdown 编辑器（提供默认示例文章）
  - 右侧：实时预览区（显示应用内联样式后的效果）

#### 样式配置器
- 支持对所有 Markdown 标签进行 TailwindCSS 样式配置：
  - 标题类：`h1`, `h2`, `h3`, `h4`, `h5`, `h6`
  - 段落类：`p`, `blockquote`, `code`, `pre`
  - 列表类：`ul`, `ol`, `li`
  - 强调类：`strong`, `em`, `del`
  - 其他：`hr`, `a`, `img`, `table` 等

- 配置方式：用户直接输入 TailwindCSS 类名字符串
- 实时预览：修改样式后，右侧预览区所有对应标签同步更新

#### 素材库管理
- 支持上传图片（包括 SVG）
- 生成永久访问 URL
- 用途：
  - `div` 背景图
  - 有序/无序列表自定义标记图
  - 分割线装饰图
  - 任何 CSS 的 `background-image` 或 `url()` 引用

#### 模板管理
- 创建新模板
- 编辑现有模板
- 保存模板配置（生成唯一 `templateId`）
- 导出/导入模板 JSON（可选，方便备份）

### 4.2 转换引擎（后端核心）

#### Markdown 解析
- 使用 `unified` 生态：
  - `remark-parse`：Markdown → MDAST
  - `remark-rehype`：MDAST → HAST
  - `rehype-stringify`：HAST → HTML

#### 样式注入
- 根据 `templateId` 获取样式配置
- 将 TailwindCSS 类名转换为标准 CSS 属性
- 遍历 HAST，将 CSS 注入到对应节点的 `style` 属性中
- 确保所有样式 100% 内联化

#### HTML 安全处理
- 过滤微信不支持的标签和属性
- 移除 `position: fixed/absolute` 等兼容性差的属性
- 确保输出符合微信 HTML 子集规范

### 4.3 API 接口

#### `POST /api/convert`

**请求参数**：
```json
{
  "templateId": "string",
  "markdown": "string"
}
```

**返回结果**：
```json
{
  "success": true,
  "html": "<p style=\"color: #333; line-height: 1.6;\">...</p>",
  "warnings": [] // 兼容性警告（可选）
}
```

#### `POST /api/templates`
创建/更新模板

#### `GET /api/templates/:id`
获取模板配置

#### `POST /api/assets`
上传素材文件

---

## 5. 补充功能点（高杠杆特性）

### 5.1 微信兼容性检查器
- 在预览区显示兼容性警告面板
- 提示哪些 TailwindCSS 属性在转换后会被过滤或失效
- 标注可能在旧版安卓设备上表现异常的样式

### 5.2 一键复制富文本
- 提供"复制到剪贴板"按钮
- 使用浏览器 `Clipboard API` 写入 `text/html` 格式
- 实施人员可直接 `Ctrl+V` 到公众号后台验证效果

### 5.3 品牌色变量系统（Scoped CSS Variables）
- 支持定义全局变量（如 `--brand-color`, `--accent-color`）
- 样式配置中可引用变量
- 修改变量值后，所有使用该变量的样式同步更新

---

## 6. 技术架构

### 6.1 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 运行时 | Bun | 原生 TypeScript 支持，极速热重载 |
| 后端框架 | Hono | Bun 生态轻量级 Web 框架 |
| 前端框架 | React | 通过 shadcn/ui + TailwindCSS |
| UI 组件 | shadcn/ui | 基于 Radix UI 的可定制组件库 |
| 样式方案 | TailwindCSS | 实用优先的 CSS 框架 |
| Markdown 解析 | unified | 核心生态：remark + rehype |
| 样式内联化 | 自定义插件 | 基于 HAST 操作 + CSS 生成 |
| 数据库 | SQLite (bun:sqlite) | 存储模板配置和素材元数据 |
| 文件存储 | 本地文件系统 | 使用 Bun.file 处理素材上传 |

### 6.2 核心转换流水线

```
Markdown
   ↓ remark-parse
MDAST (Markdown AST)
   ↓ remark-rehype
HAST (HTML AST)
   ↓ 自定义插件：样式注入
HAST + Inline Styles
   ↓ rehype-stringify
HTML (带内联样式)
```

### 6.3 样式配置 Schema

模板配置采用 JSON 格式：

```json
{
  "id": "enterprise-a-simple-blue",
  "name": "企业A-简约蓝",
  "createdAt": "2026-02-14T10:30:00Z",
  "updatedAt": "2026-02-14T12:45:00Z",
  "variables": {
    "brandColor": "#007aff",
    "accentColor": "#f0f7ff",
    "textColor": "#333333"
  },
  "assets": {
    "divider": "https://cdn.example.com/assets/divider-01.svg",
    "listMarker": "https://cdn.example.com/assets/marker-blue.png"
  },
  "styles": {
    "h1": "text-2xl font-bold text-center mb-6 pb-2 border-b-2 border-[var(--brandColor)]",
    "h2": "text-xl font-bold mt-8 mb-4 px-4 py-2 bg-[var(--accentColor)] text-[var(--brandColor)] border-l-4 border-[var(--brandColor)]",
    "p": "my-4 leading-loose text-[var(--textColor)] text-sm",
    "blockquote": "border-l-4 border-gray-300 pl-4 italic text-gray-600 bg-gray-50 py-2 my-4",
    "code": "bg-gray-100 px-2 py-1 rounded text-red-600 font-mono text-xs",
    "pre": "bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto my-4",
    "ul": "my-4 list-none",
    "li": "my-2 pl-6 text-[var(--brandColor)]",
    "strong": "font-bold text-[var(--brandColor)]",
    "em": "italic text-gray-600",
    "hr": "border-0 h-8 bg-[url(var(--divider))] bg-center bg-no-repeat my-8"
  }
}
```

**⚠️ 重要说明**：
- 列表项样式中**不能使用** `relative`, `absolute` 等定位
- 列表项样式中**不能使用** `before:`, `after:` 等伪元素（微信会过滤）
- 如需自定义列表标记，应使用**实际的 HTML 元素**或**图片素材**
- 建议使用原生 `list-style-type` 或通过素材库图片实现自定义标记
}
```

---

## 7. 技术限制与约束

### 7.1 微信公众号 HTML 子集规范

#### 7.1.1 样式系统限制
- **必须使用内联样式**：不支持外部 CSS 或 `<style>` 标签
- **不支持 CSS 选择器**：无法使用类选择器、ID 选择器等
- **不支持媒体查询**：`@media` 规则会被忽略
- **不支持 CSS 动画**：`@keyframes` 和 `animation` 属性无效

#### 7.1.2 HTML 标签和属性限制
- **受限的 HTML 标签**：不支持 `<script>`, `<iframe>`, `<form>`, `<input>`, `<object>`, `<embed>` 等
- **支持的基础标签**：`<p>`, `<h1>`~`<h6>`, `<strong>`, `<em>`, `<u>`, `<br>`, `<ul>`, `<ol>`, `<li>`, `<a>`, `<img>`, `<section>` 等
- **`id` 属性会被删除**：所有元素的 `id` 会被微信过滤，无法实现页面内锚点跳转
- **`class` 属性保留但无实际作用**：因为无法定义 CSS 选择器，`class` 仅用于编辑器内部识别

#### 7.1.3 CSS 属性限制（关键）
- **定位属性被过滤**：
  - `position: absolute/fixed/relative` **全部会被删除**
  - `z-index` 在没有定位的情况下无意义
  - 无法实现悬浮、覆盖等布局效果

- **伪类和伪元素不可用**：
  - `:hover`, `:active`, `:focus` 等伪类无法定义（无 `<style>` 标签）
  - `:before`, `:after` 伪元素**会被过滤**
  - TailwindCSS 中的 `before:`, `after:`, `hover:` 等前缀**无效**

- **变换属性不稳定**：
  - `transform` 可能部分生效，但在不同设备上表现不一致
  - `transform-origin` 在 iOS 上可能无效
  - 建议避免使用复杂变换

- **单位使用建议**：
  - **推荐**：`px`（像素）、`vw`/`vh`（视口单位）、`em`/`rem`
  - **不推荐**：百分比 `%` 作为高度或位移值可能不起作用（如 `margin-top: -100%`）

#### 7.1.4 图片和素材限制
- **图片链接要求**：
  - 建议使用**微信素材库**链接（最可靠）
  - SVG 内嵌的图像**必须**使用素材库链接
  - 外链图片可能触发安全提示或加载失败
  - **不支持** Base64 编码的图片（会被过滤）

- **支持的图片样式**：
  - `border`, `border-radius`（圆角）
  - `box-shadow`（阴影）
  - `max-width`, `width`, `height`
  - 微信默认对图片应用 `max-width: 100%`

#### 7.1.5 多媒体支持
- **音频/视频**：使用微信特定标签 `<mpvoice>`, `<mpvideo>`
- 不支持标准的 `<audio>`, `<video>` 标签

#### 7.1.6 交互限制
- **无 JavaScript**：所有脚本代码会被剥离
- **无表单交互**：无法实现输入、提交等功能
- **无事件处理**：`onclick` 等事件属性会被删除
- **外链跳转**：`<a>` 标签可用，但外链会触发微信安全提示窗口

### 7.2 性能要求
- Markdown 转换响应时间 < 500ms（1万字以内）
- 前端实时预览延迟 < 100ms（防抖优化）

---

## 8. 非功能需求

### 8.1 可用性
- 实施人员无需学习复杂的配置语法，直接使用熟悉的 TailwindCSS
- 提供默认模板（简约、杂志、科技等风格），可快速基于模板修改

### 8.2 可扩展性
- 模板系统支持未来扩展（如段落首字母放大、中英文混排优化）
- API 接口预留扩展字段（如 `options.autoSpace`：自动处理中英文间空格）

### 8.3 安全性
- 上传文件类型校验（仅允许图片和 SVG）
- 文件大小限制（单文件 < 5MB）
- 防止恶意 Markdown 注入（XSS 过滤）

---

## 9. 迭代计划（后续可扩展）

### MVP（当前第一期）
- ✅ 基础样式配置器
- ✅ 实时预览
- ✅ 素材上传管理
- ✅ API 转换接口
- ✅ TailwindCSS 到内联样式的转换

### 第二期（按需迭代）
- 多种预设模板（快速切换风格）
- 样式继承与覆盖（基于基础模板微调）
- 段落首字母装饰（Drop Cap）
- 中英文混排自动空格

### 第三期（高级功能）
- 版本管理（模板历史记录）
- 协作功能（多人编辑同一模板）
- 批量转换接口（一次传入多篇文章）
- Webhook 集成（转换完成后回调通知）

---

## 10. 参考资源

- [微信公众号排版规范](https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Batch_Sends_and_Originality_Checks.html)
- [Bun 官方文档](https://bun.sh/docs)
- [Hono Web 框架](https://hono.dev/)
- [unified 生态](https://unifiedjs.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

**文档版本**：v1.0  
**创建日期**：2026-02-14  
**负责人**：方案实施团队  
**更新记录**：初始版本
