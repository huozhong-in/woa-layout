// src/lib/db/types.ts
// 数据库模型类型定义

export interface Template {
  id: string;
  name: string;
  config: TemplateConfig;
  created_at: number;
  updated_at: number;
  is_default: number; // 0 or 1 (SQLite boolean)
}

export interface TemplateConfig {
  global?: GlobalConfig;
  variables: {
    [key: string]: string; // 如：brandColor, accentColor, textColor
  };
  assets?: {
    [key: string]: string; // 如：divider, listMarker
  };
  styles: {
    [tagName: string]: string; // HTML 标签名 → TailwindCSS 类名
  };
}

export interface GlobalConfig {
  themeColor?: string;
  fontFamily?: string;
  baseFontSize?: 'sm' | 'base' | 'lg';
  codeTheme?: 'light' | 'dark' | 'androidstudio';
}

export interface Asset {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  uploaded_at: number;
}

export interface AssetReference {
  templateId: string;
  templateName: string;
  sourceType: 'assets' | 'styles' | 'style-alias';
  sourceKey: string;
  sourceValue: string;
}

// 数据库行类型（从数据库读取时，config 是字符串）
export interface TemplateRow {
  id: string;
  name: string;
  config: string; // JSON 字符串
  created_at: number;
  updated_at: number;
  is_default: number;
}
