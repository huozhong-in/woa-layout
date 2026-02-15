// src/lib/clipboard.ts
// 剪贴板处理工具：优化 HTML 以适配微信公众号

// 需要内联的关键 CSS 属性列表
const IMPORTANT_STYLE_PROPERTIES = [
  'background-image',
  'background-size',
  'background-repeat',
  'background-position',
  'background-color',
  'color',
  'font-size',
  'font-weight',
  'font-family',
  'font-style',
  'line-height',
  'text-align',
  'text-decoration',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-width',
  'border-style',
  'border-color',
  'border-radius',
  'width',
  'max-width',
  'min-width',
  'height',
  'max-height',
  'min-height',
  'display',
  'box-sizing',
  'overflow',
  'overflow-x',
  'overflow-y',
  'white-space',
  'word-break',
  'word-wrap',
  'letter-spacing',
  'opacity',
  'box-shadow',
  'list-style',        // 列表样式简写（包含 type, position, image）
  'list-style-type',   // 列表标记类型（disc, decimal 等）
  'list-style-position', // 列表标记位置（inside, outside）
  'margin-block',      // CSS 逻辑属性（margin-top + margin-bottom）
  'margin-inline',     // CSS 逻辑属性（margin-left + margin-right）
  'padding-block',     // CSS 逻辑属性（padding-top + padding-bottom）
  'padding-inline',    // CSS 逻辑属性（padding-left + padding-right）
];

function toAbsoluteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return url;

  try {
    return new URL(trimmed, window.location.href).toString();
  } catch {
    return url;
  }
}

function extractUrlFromBackgroundImage(backgroundImage: string): string | null {
  const match = backgroundImage.match(/url\((['"]?)(.*?)\1\)/i);
  if (!match || !match[2]) return null;
  return match[2].trim();
}

/**
 * 将计算后的样式内联到元素
 * 使用 window.getComputedStyle 获取所有实际应用的样式
 */
function inlineComputedStyles(sourceElement: HTMLElement, targetElement: HTMLElement): void {
  // 获取源元素的计算样式
  const computedStyle = window.getComputedStyle(sourceElement);
  const tagName = targetElement.tagName.toLowerCase();
  const parentTag = targetElement.parentElement?.tagName.toLowerCase();
  
  // 将关键样式属性复制到目标元素
  IMPORTANT_STYLE_PROPERTIES.forEach((prop) => {
    const value = computedStyle.getPropertyValue(prop);
    
    // 跳过无效值
    if (!value || value === 'none' || value === 'normal' || value === 'auto') {
      return;
    }
    
    // 特殊处理：列表项内部的段落标签，移除 margin 并改为 inline 避免额外换行
    if (tagName === 'p' && parentTag === 'li') {
      if (prop.startsWith('margin')) {
        targetElement.style.setProperty('margin', '0', 'important');
        return;
      }
      // 关键：将块级 <p> 改为 inline，防止产生额外换行
      if (prop === 'display') {
        targetElement.style.setProperty('display', 'inline', 'important');
        return;
      }
    }
    
    // 特殊处理：列表元素的 margin 需要限制，避免额外空行
    if ((tagName === 'li' || tagName === 'ul' || tagName === 'ol')) {
      // 处理尺寸：列表元素应该自适应内容和容器
      if (prop === 'height' || prop === 'min-height' || prop === 'width' || prop === 'min-width') {
        // 列表元素不应该有固定尺寸，跳过这些属性
        return;
      }
      
      // 关键修复：list-style-position
      // 微信编辑器不支持 inside，会导致列表标记与内容错位
      if (prop === 'list-style-position') {
        // 不设置任何值，使用浏览器默认的 outside
        // 不要显式设置，避免兼容性问题
        return;
      }
      
      // 保留 list-style-type，确保列表标记正常显示
      if (prop === 'list-style-type') {
        targetElement.style.setProperty(prop, value, 'important');
        return;
      }
      
      // 处理 list-style 简写属性
      if (prop === 'list-style') {
        // 只保留 type 部分，不设置 position
        const listStyleType = computedStyle.getPropertyValue('list-style-type');
        if (listStyleType && listStyleType !== 'none') {
          targetElement.style.setProperty('list-style-type', listStyleType, 'important');
        }
        return;
      }
      
      // 处理 CSS 逻辑属性：margin-block（等价于 margin-top + margin-bottom）
      if (prop === 'margin-block') {
        // 禁用垂直 margin，列表项不需要垂直间距
        targetElement.style.setProperty('margin-block', '0', 'important');
        targetElement.style.setProperty('margin-top', '0', 'important');
        targetElement.style.setProperty('margin-bottom', '0', 'important');
        return;
      }
      
      // 处理 CSS 逻辑属性：margin-inline（等价于 margin-left + margin-right）
      if (prop === 'margin-inline') {
        // 保留水平 margin
        targetElement.style.setProperty('margin-inline', value, 'important');
        return;
      }
      
      // 处理 margin 相关属性
      if (prop === 'margin') {
        // 简写属性：只保留左右
        const marginLeft = computedStyle.getPropertyValue('margin-left');
        const marginRight = computedStyle.getPropertyValue('margin-right');
        if (marginLeft && marginLeft !== '0px') {
          targetElement.style.setProperty('margin-left', marginLeft, 'important');
        }
        if (marginRight && marginRight !== '0px') {
          targetElement.style.setProperty('margin-right', marginRight, 'important');
        }
        targetElement.style.setProperty('margin-top', '0', 'important');
        targetElement.style.setProperty('margin-bottom', '0', 'important');
        return;
      }
      if (prop === 'margin-top' || prop === 'margin-bottom') {
        // 明确禁用上下 margin
        targetElement.style.setProperty(prop, '0', 'important');
        return;
      }
      if (prop === 'margin-left' || prop === 'margin-right') {
        // 保留左右 margin
        targetElement.style.setProperty(prop, value, 'important');
        return;
      }
      
      // 处理 padding 相关属性（仅针对 ul/ol）
      if (tagName === 'ul' || tagName === 'ol') {
        // 处理 CSS 逻辑属性：padding-block
        if (prop === 'padding-block') {
          targetElement.style.setProperty('padding-block', '0', 'important');
          targetElement.style.setProperty('padding-top', '0', 'important');
          targetElement.style.setProperty('padding-bottom', '0', 'important');
          return;
        }
        
        // 处理 CSS 逻辑属性：padding-inline
        if (prop === 'padding-inline') {
          targetElement.style.setProperty('padding-inline', value, 'important');
          return;
        }
        
        if (prop === 'padding') {
          let paddingLeft = computedStyle.getPropertyValue('padding-left');
          const paddingRight = computedStyle.getPropertyValue('padding-right');
          
          // 关键修复：ul/ol 必须有 padding-left，否则列表标记会消失
          // 如果原始 padding-left 为 0 或很小，设置为 40px
          const paddingLeftNum = parseFloat(paddingLeft || '0');
          if (paddingLeftNum < 20) {
            paddingLeft = '40px'; // 微信编辑器需要足够的空间显示列表标记
          }
          
          targetElement.style.setProperty('padding-left', paddingLeft, 'important');
          if (paddingRight && paddingRight !== '0px') {
            targetElement.style.setProperty('padding-right', paddingRight, 'important');
          }
          targetElement.style.setProperty('padding-top', '0', 'important');
          targetElement.style.setProperty('padding-bottom', '0', 'important');
          return;
        }
        if (prop === 'padding-top' || prop === 'padding-bottom') {
          targetElement.style.setProperty(prop, '0', 'important');
          return;
        }
        if (prop === 'padding-left') {
          // 关键修复：确保 padding-left 至少 20px，否则列表标记会消失
          const paddingLeftNum = parseFloat(value || '0');
          const finalValue = paddingLeftNum < 20 ? '40px' : value;
          targetElement.style.setProperty(prop, finalValue, 'important');
          return;
        }
        if (prop === 'padding-right') {
          targetElement.style.setProperty(prop, value, 'important');
          return;
        }
      }
    }
    
    // 通用处理：移除固定宽度，让内容自适应微信编辑器宽度
    if (prop === 'width' || prop === 'min-width') {
      // 跳过固定宽度，让元素自适应容器
      // 微信编辑器会根据其容器宽度自动调整
      return;
    }
    
    // 通用处理：高度应该自适应内容
    if (prop === 'height') {
      // 只有明确设置了height的元素才保留，否则让其自适应
      const inlineStyle = (sourceElement as HTMLElement).style.height;
      if (!inlineStyle) {
        // 如果不是内联样式设置的height，跳过（让其自适应）
        return;
      }
    }
    
    targetElement.style.setProperty(prop, value, 'important');
  });
}

/**
 * 递归处理所有元素，内联计算样式
 */
function inlineAllStyles(sourceContainer: HTMLElement, targetContainer: HTMLElement): void {
  // 处理当前元素
  inlineComputedStyles(sourceContainer, targetContainer);
  
  // 递归处理所有子元素
  const sourceChildren = sourceContainer.children;
  const targetChildren = targetContainer.children;
  
  for (let i = 0; i < sourceChildren.length; i++) {
    const sourceChild = sourceChildren[i] as HTMLElement;
    const targetChild = targetChildren[i] as HTMLElement;
    
    if (sourceChild && targetChild) {
      inlineAllStyles(sourceChild, targetChild);
    }
  }
}

/**
 * 处理图片的尺寸属性和样式
 * 将 width/height 属性转换为 style，确保微信兼容性
 * 特别处理 LaTeX 公式图片的垂直对齐
 */
function processImages(container: HTMLElement): void {
  const images = container.getElementsByTagName('img');
  
  Array.from(images).forEach((image) => {
    const src = image.getAttribute('src');
    if (src) {
      image.setAttribute('src', toAbsoluteUrl(src));
    }

    const width = image.getAttribute('width');
    const height = image.getAttribute('height');
    const alt = image.getAttribute('alt') || '';

    if (width) {
      image.removeAttribute('width');
      // 如果是纯数字，添加 px 单位；否则保持原值
      image.style.width = /^\d+$/.test(width) ? `${width}px` : width;
    }

    if (height) {
      image.removeAttribute('height');
      image.style.height = /^\d+$/.test(height) ? `${height}px` : height;
    }

    // LaTeX 公式图片需要特殊处理垂直对齐
    if (alt.startsWith('formula:')) {
      // 行内公式：垂直居中对齐
      if (!image.style.verticalAlign) {
        image.style.verticalAlign = 'middle';
      }
      // 确保有 max-width
      if (!image.style.maxWidth) {
        image.style.maxWidth = '100%';
      }
      // 添加 display 属性
      if (!image.style.display) {
        image.style.display = 'inline-block';
      }
    }

    // 所有图片添加基础样式
    if (!image.style.maxWidth) {
      image.style.maxWidth = '100%';
    }
  });
}

function convertStyledHrToImage(container: HTMLElement): void {
  const hrElements = container.querySelectorAll('hr');

  hrElements.forEach((hr) => {
    const backgroundImage = hr.style.backgroundImage;
    const rawUrl = extractUrlFromBackgroundImage(backgroundImage);
    if (!rawUrl) return;

    const dividerUrl = toAbsoluteUrl(rawUrl);
    const replacement = document.createElement('div');

    replacement.style.display = 'block';
    replacement.style.width = hr.style.width || '100%';
    replacement.style.height = hr.style.height || '1px';
    replacement.style.margin = hr.style.margin || '';
    replacement.style.marginTop = hr.style.marginTop || replacement.style.marginTop;
    replacement.style.marginRight = hr.style.marginRight || replacement.style.marginRight;
    replacement.style.marginBottom = hr.style.marginBottom || replacement.style.marginBottom;
    replacement.style.marginLeft = hr.style.marginLeft || replacement.style.marginLeft;
    replacement.style.padding = '0';
    replacement.style.border = '0';
    replacement.style.lineHeight = '0';
    replacement.style.boxSizing = 'border-box';

    const img = document.createElement('img');
    img.src = dividerUrl;
    img.alt = 'divider';
    img.style.display = 'block';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.maxWidth = '100%';
    img.style.objectFit = 'fill';
    img.style.border = '0';
    img.style.margin = '0';
    img.style.padding = '0';

    replacement.appendChild(img);
    hr.replaceWith(replacement);
  });
}

/**
 * 处理列表嵌套结构
 * 注意：微信公众号支持标准的嵌套列表结构（li > ul/ol）
 * 不需要特殊处理，保持原始结构即可
 */
function processListStructure(container: HTMLElement): void {
  // 微信公众号支持标准的嵌套列表，不需要调整结构
  // 之前的逻辑会破坏 HTML 结构，导致列表显示异常
  // 因此这个函数现在什么都不做
}

/**
 * 将列表内的段落转换为 span
 * 微信编辑器中 li 内部的 p 标签会导致严重的排版问题（强制换行、额外间距）
 * 必须转换为 span 并强制内联
 */
function convertListParagraphs(container: HTMLElement): void {
  // 查找所有 p 标签
  const paragraphs = container.querySelectorAll('p');
  
  paragraphs.forEach((p) => {
    // 只有当 p 的直接父元素是 li 时才处理
    // 这样可以避免误伤其他结构中的 p
    if (p.parentElement && p.parentElement.tagName.toLowerCase() === 'li') {
      // 创建文档片段
      const fragment = document.createDocumentFragment();
      
      // 检查是否需要保留关键样式 (color, font-weight, text-decoration)
      // 如果 p 标签上有这些特定样式，用 span 包裹以保留视觉效果
      // 但绝不复制 display, margin, padding 等可能导致换行的属性
      const style = p.style;
      const needsSpan = style.color || style.fontWeight || style.textDecoration || style.fontStyle;
      
      let targetContainer: Node = fragment;
      
      if (needsSpan) {
        const span = document.createElement('span');
        if (style.color) span.style.color = style.color;
        if (style.fontWeight) span.style.fontWeight = style.fontWeight;
        if (style.textDecoration) span.style.textDecoration = style.textDecoration;
        if (style.fontStyle) span.style.fontStyle = style.fontStyle;
        
        // 强制 inline
        span.style.display = 'inline';
        
        fragment.appendChild(span);
        targetContainer = span;
      }
      
      // 移动所有子节点到片段中
      while (p.firstChild) {
        const child = p.firstChild;
        
        // 关键修复：清理文本节点中的换行符
        // 微信编辑器会将 HTML 源码中的换行符渲染为实际的断行
        // 这在使用 Markdown 时很常见（例如列表项内容很长被折行了）
        if (child.nodeType === Node.TEXT_NODE && child.nodeValue) {
            // 激进修复：直接删掉所有换行符和制表符
            // 用户反馈替换为空格似乎仍有问题，尝试直接移除
            child.nodeValue = child.nodeValue.replace(/[\n\r\t]+/g, '');
        }
        
        targetContainer.appendChild(child);
      }
      
      // 用片段替换 p 标签 (Unwrap)
      p.replaceWith(fragment);
    }
  });

  // 补充修复：处理那些没有被 p 标签包裹的文本节点
  // 遍历所有 li，清理其中的直接或深层文本节点
  const listItems = container.querySelectorAll('li');
  listItems.forEach(li => {
    // 移除所有 br 标签
    const brs = li.querySelectorAll('br');
    brs.forEach(br => br.remove());

    const walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT, null);
    let node;
    while (node = walker.nextNode()) {
      if (node.nodeValue) {
        // 同样执行激进清理
        node.nodeValue = node.nodeValue.replace(/[\n\r\t]+/g, '');
      }
    }
  });
}

/**
 * 魔法修复：在每个列表项开头插入零宽空格
 * 
 * 问题原因：
 * 微信编辑器有一个怪癖：如果 li 的第一个子节点是块级元素或某些行内标签（如 strong, b），
 * 它会在列表标记（bullet/number）和内容之间强制插入换行。
 * 只有当 li 的第一个子节点是文本节点时，它才会正确地行内显示。
 * 
 * 解决方案：
 * 强制在每个 li 的最前面插入一个 TextNode（零宽空格 \u200B），
 * 欺骗微信编辑器认为这是一个以文本开头的列表项。
 */
function insertZeroWidthSpaceInLists(container: HTMLElement): void {
  const listItems = container.querySelectorAll('li');
  
  listItems.forEach((li) => {
    // 创建零宽空格文本节点
    const zwsp = document.createTextNode('\u200B');
    
    // 插入到最前面
    if (li.firstChild) {
      li.insertBefore(zwsp, li.firstChild);
    } else {
      li.appendChild(zwsp);
    }
  });
}

/**
 * 将列表内的语义化标签转换为 span
 * 微信编辑器可能会将 strong/b 等标签视为块级元素或特殊元素，导致换行
 * 转换为 span 可以规避这种行为
 */
function convertSemanticTagsToSpans(container: HTMLElement): void {
  const semanticTags = ['strong', 'b', 'em', 'i'];
  const selector = semanticTags.map(tag => `li ${tag}`).join(', ');
  
  const elements = container.querySelectorAll(selector);
  
  elements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const span = document.createElement('span');
    const tagName = htmlEl.tagName.toLowerCase();
    
    // 复制所有属性 (class, style, etc.)
    Array.from(htmlEl.attributes).forEach(attr => {
       span.setAttribute(attr.name, attr.value);
    });
    
    // 转换语义样式为内联样式
    if (tagName === 'strong' || tagName === 'b') {
       span.style.setProperty('font-weight', 'bold', 'important');
    }
    if (tagName === 'em' || tagName === 'i') {
       span.style.setProperty('font-style', 'italic', 'important');
    }
    
    // 强制 inline
    span.style.setProperty('display', 'inline', 'important');
    
    // 移动子节点
    while (htmlEl.firstChild) {
      span.appendChild(htmlEl.firstChild);
    }
    
    htmlEl.replaceWith(span);
  });
}

/**
 * 清理列表内行内元素的样式
 * 修复微信编辑器中加粗文本导致换行的 Bug
 * 确保 strong, span, code 等元素强制 inline 显示
 */
function cleanupInlineElementsInLists(container: HTMLElement): void {
  // 定义需要处理的行内标签
  // 注意：span 包含之前由 p 转换而来的元素
  const inlineTags = ['strong', 'b', 'em', 'i', 'span', 'a', 'code', 'label'];
  const selector = inlineTags.map(tag => `li ${tag}`).join(', ');
  
  const elements = container.querySelectorAll(selector);
  
  elements.forEach((element) => {
    const el = element as HTMLElement;
    const tagName = el.tagName.toLowerCase();
    
    // 强制 inline 显示
    el.style.setProperty('display', 'inline', 'important');
    
    // 清除可能导致换行的尺寸限制
    el.style.setProperty('width', 'auto', 'important');
    el.style.setProperty('height', 'auto', 'important');
    
    // 清除浮动
    el.style.setProperty('float', 'none', 'important');
    
    // 清除 margin (padding 对于 code 标签需要保留，其他标签通常没有 padding)
    el.style.setProperty('margin', '0', 'important');

    // 特殊处理 white-space：
    // 除了 code 标签，其他应该强制 normal，防止源码换行符在 pre-wrap 模式下显示为换行
    if (tagName !== 'code' && tagName !== 'pre') {
        el.style.setProperty('white-space', 'normal', 'important');
    }
  });
}

/**
 * 清理列表元素的问题样式
 * 微信编辑器对某些 CSS 属性的支持有问题，需要移除或修正
 */
function cleanupListStyles(container: HTMLElement): void {
  // 获取所有列表元素
  const listElements = container.querySelectorAll('ul, ol, li');
  
  listElements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    const tagName = htmlElement.tagName.toLowerCase();

    // 关键修复：列表相关元素必须使用 normal white-space
    // 否则源码中的换行文本节点会在微信编辑器中变成真实换行
    htmlElement.style.setProperty('white-space', 'normal', 'important');
    
    // 移除 list-style-position: inside
    // 微信编辑器不支持 inside，会导致列表标记与内容错位/换行
    // 使用默认的 outside 即可
    if (htmlElement.style.listStylePosition === 'inside') {
      htmlElement.style.removeProperty('list-style-position');
    }
    
    // 确保 ul/ol 有正确的 list-style-type 和 padding-left
    if (tagName === 'ul' || tagName === 'ol') {
      // 设置 list-style-type
      if (tagName === 'ul' && !htmlElement.style.listStyleType) {
        htmlElement.style.setProperty('list-style-type', 'disc', 'important');
      } else if (tagName === 'ol' && !htmlElement.style.listStyleType) {
        htmlElement.style.setProperty('list-style-type', 'decimal', 'important');
      }
      
      // 关键修复：确保有足够的 padding-left，否则列表标记会消失
      const paddingLeft = htmlElement.style.paddingLeft;
      const paddingLeftNum = parseFloat(paddingLeft || '0');
      if (paddingLeftNum < 20) {
        htmlElement.style.setProperty('padding-left', '40px', 'important');
      }
    }
  });
}

/**
 * 定点修复：若列表项开头是加粗节点，补一个普通文本空格节点
 * 规避微信编辑器“marker 后紧跟加粗导致换行”的问题
 */
function ensureLeadingTextNodeForBoldListItems(container: HTMLElement): void {
  const listItems = container.querySelectorAll('li');

  listItems.forEach((li) => {
    const firstMeaningfulNode = Array.from(li.childNodes).find((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        return (child.nodeValue || '').trim().length > 0;
      }
      return child.nodeType === Node.ELEMENT_NODE;
    });

    if (!firstMeaningfulNode || firstMeaningfulNode.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = firstMeaningfulNode as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    const isBoldTag = tagName === 'strong' || tagName === 'b';
    const weight = (element.style.fontWeight || '').trim();
    const isBoldWeight = weight === 'bold' || (Number.parseInt(weight, 10) >= 600);

    if (!isBoldTag && !isBoldWeight) {
      return;
    }

    const prev = firstMeaningfulNode.previousSibling;
    if (prev && prev.nodeType === Node.TEXT_NODE && (prev.nodeValue || '').length > 0) {
      return;
    }

    li.insertBefore(document.createTextNode(' '), firstMeaningfulNode);
  });
}

/**
 * 定点扁平化：仅处理“开头粗体 + 无嵌套子列表”的列表项
 * 将正文合并为单一行内流，避免微信在粗体后错误断行
 */
function flattenLeadingBoldListItemFlow(container: HTMLElement): void {
  const listItems = container.querySelectorAll('li');

  listItems.forEach((li) => {
    const directNestedList = Array.from(li.children).find((child) => {
      const tag = child.tagName.toLowerCase();
      return tag === 'ul' || tag === 'ol';
    });

    if (directNestedList) {
      return;
    }

    const firstMeaningfulNode = Array.from(li.childNodes).find((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        return (child.nodeValue || '').trim().length > 0;
      }
      return child.nodeType === Node.ELEMENT_NODE;
    });

    if (!firstMeaningfulNode || firstMeaningfulNode.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const firstElement = firstMeaningfulNode as HTMLElement;
    const firstTag = firstElement.tagName.toLowerCase();
    const isBoldTag = firstTag === 'strong' || firstTag === 'b';
    const weight = (firstElement.style.fontWeight || '').trim();
    const isBoldWeight = weight === 'bold' || (Number.parseInt(weight, 10) >= 600);

    if (!isBoldTag && !isBoldWeight) {
      return;
    }

    const flow = document.createElement('span');
    flow.style.setProperty('display', 'inline', 'important');
    flow.style.setProperty('white-space', 'normal', 'important');
    flow.style.setProperty('line-height', 'inherit', 'important');

    const nodes = Array.from(li.childNodes);
    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
        node.nodeValue = node.nodeValue
          .replace(/[\u0009\u000A\u000D\u2028\u2029]+/g, ' ')
          .replace(/\s+/g, ' ');
      }
      flow.appendChild(node);
    });

    li.appendChild(flow);
  });
}

/**
 * 检查节点是否为“开头加粗”节点
 * 微信编辑器在列表标记后紧跟加粗节点时，可能错误换行
 */
function normalizeListWhitespaceNodes(container: HTMLElement): void {
  const listItems = container.querySelectorAll('li');

  listItems.forEach((li) => {
    const walker = document.createTreeWalker(li, NodeFilter.SHOW_TEXT, null);
    const textNodes: Text[] = [];
    let current = walker.nextNode();

    while (current) {
      textNodes.push(current as Text);
      current = walker.nextNode();
    }

    textNodes.forEach((textNode) => {
      const original = textNode.nodeValue || '';
      const cleaned = original
        .replace(/[\u0009\u000A\u000D\u2028\u2029]+/g, ' ')
        .replace(/\s+/g, ' ');

      if (cleaned.trim().length === 0) {
        textNode.remove();
        return;
      }

      textNode.nodeValue = cleaned;
    });
  });
}

/**
 * 创建空白节点用于兼容性
 * 使用更小的高度避免影响布局
 */
function createEmptyNode(): HTMLElement {
  const node = document.createElement('p');
  node.style.fontSize = '0';
  node.style.lineHeight = '0';
  node.style.height = '0';
  node.style.margin = '0';
  node.style.padding = '0';
  node.style.border = 'none';
  node.innerHTML = '&nbsp;';
  return node;
}

/**
 * 压缩 HTML：移除 pre 标签外的换行符
 * 参考同类项目策略，减少微信编辑器把源码换行解析为视觉换行的概率
 */
function compactHtmlForWechat(html: string): string {
  const preBlocks: string[] = [];

  const withPlaceholders = html.replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
    const index = preBlocks.push(match) - 1;
    return `__PRE_BLOCK_${index}__`;
  });

  const compacted = withPlaceholders
    .replace(/[\n\r\t]+/g, '')
    .replace(/>\s+</g, '><');

  return compacted.replace(/__PRE_BLOCK_(\d+)__/g, (_match, idx) => {
    const index = Number.parseInt(idx, 10);
    return preBlocks[index] ?? '';
  });
}

/**
 * 预处理剪贴板内容
 * 对 HTML 进行微信公众号兼容性处理
 * @param sourceElement 源 DOM 元素（用于获取计算样式）
 * @param targetElement 目标克隆元素（用于修改）
 */
export function processClipboardContent(sourceElement: HTMLElement, targetElement: HTMLElement): void {
  // 关键步骤1：内联所有计算样式
  inlineAllStyles(sourceElement, targetElement);
  
  // 关键步骤2：清理列表元素的问题样式
  cleanupListStyles(targetElement);
  
  // 关键步骤3：处理图片尺寸
  processImages(targetElement);

  // 关键步骤3.5：将带背景图的 hr 转为图片块
  // 微信编辑器对 hr 样式过滤较重，转为 img 能稳定保留自定义分隔线
  convertStyledHrToImage(targetElement);
  
  // 关键步骤4：处理列表结构
  processListStructure(targetElement);

  // 关键步骤4.5：将列表内的段落转换为 span
  // 解决微信编辑器中列表项内 p 标签强制换行的问题
  convertListParagraphs(targetElement);

  // 关键步骤4.56：将语义化标签转换为 span
  // 解决微信编辑器对 strong/b/em/i 的特殊排版（如强制独立一行）
  convertSemanticTagsToSpans(targetElement);

  // 关键步骤4.57：标准化列表中的空白文本节点
  // 去掉隐形换行断点，避免微信在 marker 后错误断行
  normalizeListWhitespaceNodes(targetElement);

  // 关键步骤4.58：仅在“开头加粗”的列表项前补文本节点
  // 最小化修复 marker + bold 断行问题，不破坏原生缩进
  ensureLeadingTextNodeForBoldListItems(targetElement);

  // 关键步骤4.59：定点扁平化开头加粗列表项的正文流
  // 避免微信在粗体结束后错误插入换行
  flattenLeadingBoldListItemFlow(targetElement);
  
  // 关键步骤4.6：清理列表内行内元素的样式
  // 修复微信编辑器中加粗文本导致换行的 Bug
  cleanupInlineElementsInLists(targetElement);

  // 关键步骤4.9：压缩 HTML，去掉 pre 外换行与标签间空白
  // 降低微信编辑器将源码空白误判为换行的概率
  targetElement.innerHTML = compactHtmlForWechat(targetElement.innerHTML);
  
  // 关键步骤5：添加前后空白节点，提高兼容性
  const beforeNode = createEmptyNode();
  const afterNode = createEmptyNode();
  targetElement.insertBefore(beforeNode, targetElement.firstChild);
  targetElement.appendChild(afterNode);
}
