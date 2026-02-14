# 需求讨论文档

## 第一轮探讨

### Q
我想做一个支持API调用的“微信公众号文章排版工具”，也就是说有前端也有后端，都用TypeScript来写，用bun来运行。这个排版工具在使用时不是关注具体排版一篇文章，而是通过排版行为定义一个风格的排版模板，以便后续通过API传入模板ID就能把传入的Markdown转为公众号特定的HTML(具体技术描述见附件)，也就是说它支持所有Markdown标记渲染样式的自定义，但又遵守附件提到的“使用的是HTML的子集”。这个产品将帮助我服务企业客户的公众号的半自动化维护，每次定义好这家企业的排版风格和细节装饰(如局部元素的背景图素材)，再通过API就可以把Markdown转为公众号文章样式。
请你分析一下PRD.md该怎么写，另外技术栈我要用bun+TypeScript+shadcn(React+TailwindCSS)，API方案用内置的轻量级即可[bun init --react=shadcn](https://bun.com/docs/runtime/templating/init) 

### A
这是一个非常专业且具有商业价值的方向。针对企业级公众号半自动化维护，**“排版模板化”**和**“API 驱动”**是解决重复劳动的核心。

微信公众号排版最特殊的逻辑在于：它不接受外部 CSS，也不接受复杂的 HTML 标签（如 `script`, `iframe` 等受到严格限制），所有的样式必须通过 **Inline Styles（内联样式）** 注入到 HTML 标签中。

以下是针对你项目的 `PRD.md` 编写建议及技术架构方案。

---

#### 1. PRD.md 结构建议

你的 PRD 应当侧重于**“样式映射引擎”**和**“模板系统”**的定义。

##### PRD 目录大纲

1. **项目愿景**：通过 API 实现 Markdown 到微信公众号样式 HTML 的工业化转换。
2. **核心业务流程**：
* 管理端：定义样式模板（JSON 描述） -> 实时预览转换效果 -> 保存模板 ID。
* API 端：调用接口（传入 `templateId` + `markdown`内容） -> 引擎解析并注入内联样式 -> 返回 MP 兼容 HTML。


3. **功能需求**：
* **样式配置器**：支持对 `h1-h6`, `p`, `blockquote`, `code`, `strong`, `em` 等所有 Markdown 标签的 CSS 属性配置。
* **组件库（装饰性元素）**：支持在文章开头/结尾自动插入企业特定的装饰（SVG 边框、背景图）。
* **Inline CSS 转换引擎**：自动将 Tailwind 样式或标准 CSS 转换为 HTML 内联样式。


4. **非功能需求**：
* **HTML 子集限制**：引擎需过滤掉微信不支持的标签和属性（如 `position: absolute` 在很多安卓设备下有兼容问题）。
* **性能**：Bun 驱动下的极速解析。



---

#### 2. 技术架构方案

基于你选用的 **Bun + TypeScript + shadcn/ui**，建议采用以下技术组合：

##### 核心技术栈映射

* **运行时/包管理**: `Bun`
* **Web 框架**: `Hono` (Bun 生态下最推荐的轻量级 API 框架，完美替代 Express)
* **前端**: `Next.js` 或 `Vite` (由 `bun init` 搭建) + `shadcn/ui` + `TailwindCSS`
* **Markdown 解析**: `unified` + `remark-parse` + `rehype-stringify`
* **样式转换工具**: `juice` 或 `css-inline` (关键：将 CSS 样式强制注入 HTML 标签的 `style` 属性中)

---

#### 3. 实现细节思考

##### A. 模板定义逻辑 (Schema)

你需要定义一个 JSON 格式的样式表，例如：

```typescript
const template = {
  id: "enterprise-style-01",
  global: {
    fontFamily: "Optima-Regular, PingFangSC-light",
    lineHeight: "1.6",
    color: "#333"
  },
  tags: {
    h1: {
      fontSize: "20px",
      fontWeight: "bold",
      borderBottom: "2px solid #007aff",
      paddingBottom: "5px"
    },
    blockquote: {
      backgroundColor: "#f0f7ff",
      borderLeft: "4px solid #007aff",
      padding: "10px"
    }
  }
}

```

##### B. 转换流水线 (Pipeline)

1. **Markdown -> MDAST**: 使用 `remark` 将 Markdown 转为抽象语法树。
2. **MDAST -> HAST**: 转为 HTML 语法树。
3. **Style Injection**: 遍历 HAST，根据 `templateId` 找到对应的配置，将样式对象注入到对应标签的 `properties.style` 中。
4. **SVG/装饰处理**: 特殊处理“局部元素背景图”，将其包裹在微信支持的 `section` 标签内。
5. **Stringify**: 输出最终的 HTML 字符串。

##### C. 为什么选 Bun？

* **原生支持 TypeScript**: 无需配置复杂的 `tsconfig` 和 `babel`。
* **极速的热重载**: 开发模板预览功能时，反馈极快。
* **内置 SQLite**: 如果初期不想配置复杂的数据库，Bun 内置的 `bun:sqlite` 非常适合存储模板 JSON。

---

#### 4. 关键代码示例 (API 侧)

使用 `Hono` 在 Bun 环境下快速搭建转换接口：

```typescript
import { Hono } from 'hono'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

const app = new Hono()

app.post('/api/convert', async (c) => {
  const { markdown, templateId } = await c.req.json()
  
  // 1. 根据 templateId 获取样式配置 (此处仅为演示)
  const styles = await getTemplateStyles(templateId)

  // 2. 转换流程
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(() => (tree) => {
      // 在这里遍历 tree，根据 styles 对象修改节点属性
      // 注入 inline styles
    })
    .use(rehypeStringify)
    .process(markdown)

  return c.json({ html: String(result) })
})

export default {
  port: 3000,
  fetch: app.fetch,
}

```

---

## 第二轮探讨

### Q
这阶段我想尽量精简些，不支持复杂的定制，以后可根据需求再迭代。
在产品体验上，前端的公嗯主要是进行样式配置和效果预览，左侧有一篇默认markdown，右侧是预览效果，排版动作其实是调整样式配置，比如修改了H2样式则看到所有H2处发生变化。
这一期我能想到的功能点：
- 可上传素材图片(包括SVG)，当作CSS配套资源。这样无论是div的背景图、有序列表的数字其实是图片/图片均能渲染、分割线等只要CSS支持就可以调用。
- 每种Markdown标签的渲染效果，均能被用户直接使用TailwindCSS做定制干预。因为这个工具不是给企业客户用的，而是给方案实施员工使用的。

你还有其他能想到的吗？生成一些必要的文档后我会转入IDE环境，请AI编程助手接手。

### A

既然你的目标是提供给**方案实施人员**使用，且追求**极致精简**，那么我们的重心应该放在“样式与内容的解耦”以及“Tailwind 到 Inline Style 的精准转换”上。

在这个阶段，除了你提到的功能，我还建议补充以下三个**“高杠杆”**功能点，它们能显著提升实施效率而不会增加太多开发负担：

### 1. 补充功能点建议

* **HTML 安全过滤与“微信兼容性检查”器**：
由于实施人员使用 TailwindCSS，可能会误用微信不支持的属性（如 `position: fixed` 或某些 `flex` 布局在旧版安卓上的表现）。在预览区增加一个**兼容性警告面板**，提示哪些样式在转换后会被丢弃或失效。
* **一键复制 Rich Text (富文本)**：
这是排版工具的“最后一公里”。虽然你有 API，但在调试模板阶段，前端需要一个“复制到剪贴板”按钮，它不是复制 HTML 源码，而是利用浏览器的 `Clipboard API` 写入 `text/html`。这样实施人员可以直接 `Ctrl+V` 到公众号后台验证效果。
* **Scoped CSS / 局部变量系统**：
支持在模板中定义“品牌色”变量（如 `--brand-color`）。这样当企业客户的视觉识别系统（VI）微调时，实施人员只需修改一个颜色值，所有配套的 H2、边框、SVG 颜色都能同步更新。

---

### 2. PRD.md (精简版)

```markdown
# 项目：MP-Formatter (微信公众号 API 排版引擎)

## 1. 产品定位
一个基于 Bun + TS 的排版中间件，支持通过 TailwindCSS 定义 Markdown 标签的渲染样式，并输出微信公众号兼容的内联样式 HTML。

## 2. 核心功能
### A. 样式配置工作台 (Frontend)
- **双栏布局**：左侧 Markdown 编辑，右侧实时预览（注入内联样式后的效果）。
- **Tailwind 映射表**：用户可为每个 MD 标签（h1, h2, p, blockquote, code, ul, li...）输入 Tailwind 类名。
- **素材库**：支持上传图片/SVG，生成永久 URL 以供 CSS `background-image` 或 `img` 标签调用。

### B. 转换引擎 (Backend/Core)
- **Markdown 解析**：将 MD 转为 HTML 结构。
- **样式注入**：利用 `css-inline` 类库，将 Tailwind 生成的 CSS 属性强制写入 HTML 标签的 `style` 属性中。
- **API 接口**：`POST /convert`。输入 `markdown` 和 `configId`，输出最终 HTML。

## 3. 技术限制
- 仅支持微信公众号 HTML 子集。
- 样式必须 100% 内联化。

```

---

### 3. 技术实现要点 (给 AI 编程助手的指令)

当你进入 Cursor 或 VS Code 时，可以直接把下面这段**架构指令**发给 AI：

> **Role**: TypeScript Expert & Bun Specialist
> **Task**: 构建一个 Markdown 转微信公众号 HTML 的转换逻辑。
> **Steps**:
> 1. 使用 `unified` + `remark-parse` + `remark-rehype` 将 Markdown 转换为 HAST (HTML AST)。
> 2. **关键步骤**：编写一个自定义插件，读取用户的样式配置 JSON（例如 `{ "h2": "text-xl font-bold border-b-2 border-blue-500" }`）。
> 3. 使用 `tailwind-merge` 或类似工具将 Tailwind 类名转换为标准 CSS 字符串。
> 4. 利用 `rehype-style` 或手动操作 HAST 节点的 `properties.style` 属性，将 CSS 注入。
> 5. 最终通过 `rehype-stringify` 输出。
> **Environment**: Bun 运行时，不使用 Node.js 原生包。
> 
> 

---

### 4. 样式配置的 JSON 结构参考

实施人员在前端配置的本质是这样一个对象：

```json
{
  "themeName": "企业A-简约蓝",
  "assets": {
    "divider": "https://cdn.example.com/svg/line-01.svg"
  },
  "styles": {
    "h2": "mt-8 mb-4 px-4 py-2 bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-bold",
    "p": "my-4 leading-loose text-gray-700 text-sm",
    "blockquote": "border-l-2 border-gray-300 pl-4 italic text-gray-500",
    "li": "list-none relative before:content-[''] before:bg-[url('...')]" 
  }
}

```

