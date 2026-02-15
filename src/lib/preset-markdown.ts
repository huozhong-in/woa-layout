export interface PresetMarkdown {
  id: string;
  label: string;
  content: string;
}

const DEFAULT_TEST_MARKDOWN = `# WOA-Layout 排版引擎测试

这是一段普通的段落文本，用于测试基础段落样式。段落应该包含合适的行高、字体大小和颜色配置。这里有一些**粗体文字**和*斜体文字*，以及~~删除线文字~~。

## 功能特性介绍

通过 **API 驱动 + 模板化配置** 的方式，实现 Markdown 到微信公众号样式 HTML 的工业化转换。

### 样式配置能力

支持对所有 Markdown 标签进行精细化样式控制，包括但不限于标题、段落、列表、引用等元素。

---

## 列表元素测试

### 无序列表

- 第一项：核心转换引擎
- 第二项：实时预览功能
- 第三项：素材库管理
  - 嵌套子项 1：支持图片上传
  - 嵌套子项 2：生成永久 URL

### 有序列表

1. 第一步：创建模板
2. 第二步：配置样式
3. 第三步：上传素材
4. 第四步：实时预览
5. 第五步：保存并获取 templateId

---

## 引用块测试

> 这是一段引用文字，通常用于展示重要的提示信息或引用他人的观点。
>
> **引用中也可以使用粗体**和*斜体*等强调样式。

---

## 代码测试

### 行内代码

使用 \`const result = await fetch('/api/convert')\` 调用转换接口。

### 代码块

\`\`\`typescript
interface Template {
  id: string;
  name: string;
  variables: {
    brandColor: string;
    accentColor: string;
  };
  styles: Record<string, string>;
}
\`\`\`

---

## 链接和图片

访问 [Bun 官方文档](https://bun.sh) 了解更多。

![示例图片](https://github.com/user-attachments/assets/50282090-adfd-4ddb-9e27-c30753c6b161)

---

## 结语

本文档涵盖了常用的 Markdown 语法元素，可用于测试样式配置功能。

**加粗强调**：请确保所有样式都能正确转换为内联样式！
`;

const OVERSEAS_UNICORN_SKELETON = `# 当人读不懂 AI 代码，Traversal 如何做企业运维的 AI 医生？

作者：Haozhen  
编辑：Cage

导语第一段：用 2~3 句概括这家公司解决了什么痛点，以及为什么是现在。

导语第二段：补一组关键数字或结论（例如准确率、融资额、客户类型）。

---

## 01. 为什么看好 Traversal？

### • 行业痛点明确

说明传统方案的局限，以及 AI Coding 带来的复杂度提升。

### • 技术壁垒较高，商业落地效果显著

补充 1~2 个案例和量化结果，强化结论。

### • 团队背景好，获得顶级资本加持

说明团队构成与融资信息，并给一句投资视角总结。

---

## 02. 代码运维是长期存在的明确痛点

### 软件运维 TAM（工具层 + 人力层）

用段落解释 TAM 测算逻辑，再用列表列关键数据：

- 工具层：市场规模与增长率
- 人力层：岗位规模、薪资基线、效率缺口

### 行业痛点

1. 数据分散在多个系统，排障链路长。
2. 数据量巨大，人工分析成本高。
3. 事故响应依赖高协同，效率低。

![关键流程示意图](https://via.placeholder.com/1200x600/f3f4f6/111827?text=%E4%BA%8B%E6%95%85%E5%A4%84%E7%90%86%E6%B5%81%E7%A8%8B)

---

## 03. Traversal 是什么？

### 产品定位

描述其作为 AI SRE Agent 的核心定位，以及与传统可观测工具的关系。

### Workflow（离线 + 在线）

- 离线阶段：构建系统依赖图谱
- 在线阶段：事件触发、因果分析、快速反馈

![产品工作流图](https://via.placeholder.com/1200x600/e5e7eb/111827?text=Traversal+Workflow)

---

## 04. 技术壁垒

### 因果推理

解释“相关性”与“因果性”的区别，并给一个典型回溯链示例。

### 推理模型 + Agent 并行

说明如何在 PB 级数据上进行“有目的的跳跃式排查”。

### 数字孪生与仿真模拟

说明影子测试、金丝雀发布等安全机制。

---

## 05. 商业模式

### 固定基础费用

描述与系统规模相关的计费项。

### 按结果计费

说明高价值规避事件、ROI 分档机制与增值模块。

---

## 06. 团队

介绍创始团队背景、能力结构和赛道经验，附上优劣势平衡判断。

---

## 07. AI SRE 市场竞争

### 传统可观测性巨头

分析其优势、边界与迁移成本。

### AI SRE 直接竞品

从执行能力、合规、安全、交互体验四个维度对比。

---

## 结论

最后 3 段建议结构：

1. 今天的判断（短期）
2. 中期验证指标（1~3 个）
3. 风险与反证条件（明确什么时候应调整观点）
`;

export const PRESET_MARKDOWNS: PresetMarkdown[] = [
  {
    id: 'default-test',
    label: '默认测试文档',
    content: DEFAULT_TEST_MARKDOWN,
  },
  {
    id: 'overseas-unicorn-skeleton',
    label: '海外独角兽：7章骨架',
    content: OVERSEAS_UNICORN_SKELETON,
  },
];

export const DEFAULT_MARKDOWN = PRESET_MARKDOWNS[0]?.content ?? '';
