// src/lib/converter/rehype-wechat-enhancements.ts
// 微信公众号增强插件：Mermaid/LaTeX 图像化、文末外链引用

import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Element, Root, Text } from 'hast';

interface LinkRef {
  href: string;
  text: string;
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return [value];
  return [];
}

function getText(node: Element): string {
  let result = '';

  const walk = (current: Element | Text) => {
    if (current.type === 'text') {
      result += current.value;
      return;
    }

    for (const child of current.children ?? []) {
      if (child.type === 'text' || child.type === 'element') {
        walk(child as Element | Text);
      }
    }
  };

  walk(node);
  return result.trim();
}

function createImage(src: string, alt: string): Element {
  return {
    type: 'element',
    tagName: 'img',
    properties: {
      src,
      alt,
    },
    children: [],
  };
}

function createParagraphWithImage(src: string, alt: string): Element {
  return {
    type: 'element',
    tagName: 'p',
    properties: {},
    children: [createImage(src, alt)],
  };
}

function createLinkReferencesSection(links: LinkRef[]): Element[] {
  if (links.length === 0) return [];

  return [
    {
      type: 'element',
      tagName: 'hr',
      properties: {},
      children: [],
    },
    {
      type: 'element',
      tagName: 'h3',
      properties: {},
      children: [{ type: 'text', value: '参考链接' }],
    },
    {
      type: 'element',
      tagName: 'ol',
      properties: {},
      children: links.map((item) => ({
        type: 'element',
        tagName: 'li',
        properties: {},
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: {},
            children: [{ type: 'text', value: `${item.text}：` }],
          },
          {
            type: 'element',
            tagName: 'a',
            properties: {
              href: item.href,
            },
            children: [{ type: 'text', value: item.href }],
          },
        ],
      })),
    },
  ];
}

export const rehypeWechatEnhancements: Plugin<[], Root> = () => {
  return (tree) => {
    const linkMap = new Map<string, LinkRef>();

    visit(tree, 'element', (node: Element, index, parent) => {
      if (!parent || index === undefined) return;

      if (node.tagName === 'a') {
        const href = String(node.properties?.href ?? '');
        if (/^https?:\/\//.test(href)) {
          const text = getText(node) || href;
          if (!linkMap.has(href)) {
            linkMap.set(href, { href, text });
          }
        }
      }

      if (node.tagName === 'pre') {
        const code = node.children?.[0];
        if (!code || code.type !== 'element' || code.tagName !== 'code') return;

        const classNames = asArray(code.properties?.className);
        const codeText = getText(code);

        if (classNames.includes('language-mermaid')) {
          const encoded = Buffer.from(codeText, 'utf-8').toString('base64url');
          parent.children[index] = createParagraphWithImage(
            `https://mermaid.ink/img/${encoded}`,
            'mermaid diagram'
          );
          return;
        }

        if (classNames.includes('math-display')) {
          const formula = encodeURIComponent(codeText);
          parent.children[index] = createParagraphWithImage(
            `https://latex.codecogs.com/svg.image?${formula}`,
            `formula: ${codeText}`
          );
        }
      }

      if (node.tagName === 'code') {
        const classNames = asArray(node.properties?.className);
        if (!classNames.includes('math-inline')) return;

        const formulaText = getText(node);
        const formula = encodeURIComponent(formulaText);
        parent.children[index] = createImage(
          `https://latex.codecogs.com/svg.image?${formula}`,
          `formula: ${formulaText}`
        );
      }
    });

    const references = createLinkReferencesSection([...linkMap.values()]);
    tree.children.push(...references);
  };
};
