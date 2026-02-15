// src/lib/db/index.ts
// 数据库初始化和操作函数

import { Database } from 'bun:sqlite';
import type { Template, TemplateRow, TemplateConfig, Asset, AssetReference } from './types';

// 数据库文件路径
const DB_PATH = './data/woa-layout.db';

// 初始化数据库
export async function initDatabase(): Promise<Database> {
  // 确保 data 目录存在
  const fs = require('fs');
  const path = require('path');
  const dataDir = path.dirname(DB_PATH);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(DB_PATH, { create: true });
  
  // 读取并执行 schema.sql
  const schemaFile = Bun.file('./src/lib/db/schema.sql');
  const schema = await schemaFile.text();
  db.exec(schema);

  // 插入默认模板（如果不存在）
  insertDefaultTemplate(db);

  return db;
}

// 获取数据库单例
let dbInstance: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await initDatabase();
  }
  return dbInstance;
}

// 插入默认模板
function insertDefaultTemplate(db: Database) {
  const defaultConfig: TemplateConfig = {
    variables: {
      brandColor: '#333333',
      accentColor: '#f5f5f5',
      textColor: '#333333',
    },
    styles: {
      h1: 'text-3xl font-bold text-center my-6 pb-2 border-b border-gray-300',
      h2: 'text-2xl font-bold mt-8 mb-4 pb-1 border-l-4 border-gray-800 pl-3',
      h3: 'text-xl font-bold mt-6 mb-3',
      h4: 'text-lg font-bold mt-4 mb-2',
      h5: 'text-base font-bold mt-3 mb-2',
      h6: 'text-sm font-bold mt-2 mb-1',
      p: 'my-4 leading-relaxed text-base',
      blockquote: 'border-l-4 border-gray-400 pl-4 italic text-gray-600 bg-gray-50 py-2 my-4',
      code: 'bg-gray-100 px-2 py-1 rounded text-sm text-red-600 font-mono',
      pre: 'bg-gray-900 text-gray-100 p-4 rounded my-4 overflow-x-auto',
      ul: 'my-4 list-disc list-outside pl-10',
      ol: 'my-4 list-decimal list-outside pl-10',
      li: 'my-2',
      strong: 'font-bold',
      em: 'italic',
      del: 'line-through text-gray-500',
      hr: 'border-0 h-px bg-gray-300 my-8',
      a: 'text-blue-600 underline',
      img: 'max-w-full h-auto my-4',
      table: 'w-full border-collapse my-4',
      thead: 'bg-gray-100',
      th: 'border border-gray-300 px-4 py-2 text-left font-bold',
      td: 'border border-gray-300 px-4 py-2',
    },
  };

  const now = Date.now();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO templates (id, name, config, created_at, updated_at, is_default)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    'default-simple',
    '默认简约风格',
    JSON.stringify(defaultConfig),
    now,
    now,
    1
  );
}

// === 模板操作函数 ===

export function getAllTemplates(db: Database): Template[] {
  const stmt = db.prepare('SELECT * FROM templates ORDER BY is_default DESC, created_at DESC');
  const rows = stmt.all() as TemplateRow[];
  
  return rows.map((row) => ({
    ...row,
    config: JSON.parse(row.config),
  }));
}

export function getTemplateById(db: Database, id: string): Template | null {
  const stmt = db.prepare('SELECT * FROM templates WHERE id = ?');
  const row = stmt.get(id) as TemplateRow | null;
  
  if (!row) return null;
  
  return {
    ...row,
    config: JSON.parse(row.config),
  };
}

export function createTemplate(
  db: Database,
  id: string,
  name: string,
  config: TemplateConfig
): void {
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO templates (id, name, config, created_at, updated_at, is_default)
    VALUES (?, ?, ?, ?, ?, 0)
  `);
  
  stmt.run(id, name, JSON.stringify(config), now, now);
}

export function updateTemplate(
  db: Database,
  id: string,
  name: string,
  config: TemplateConfig
): void {
  const now = Date.now();
  const stmt = db.prepare(`
    UPDATE templates
    SET name = ?, config = ?, updated_at = ?
    WHERE id = ?
  `);
  
  stmt.run(name, JSON.stringify(config), now, id);
}

export function deleteTemplate(db: Database, id: string): void {
  const stmt = db.prepare('DELETE FROM templates WHERE id = ? AND is_default = 0');
  stmt.run(id);
}

// === 素材操作函数 ===

export function createAsset(
  db: Database,
  filename: string,
  originalName: string,
  mimeType: string,
  size: number,
  url: string
): number {
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO assets (filename, original_name, mime_type, size, url, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(filename, originalName, mimeType, size, url, now);
  return result.lastInsertRowid as number;
}

export function getAllAssets(db: Database): Asset[] {
  const stmt = db.prepare('SELECT * FROM assets ORDER BY uploaded_at DESC');
  return stmt.all() as Asset[];
}

export function getAssetByFilename(db: Database, filename: string): Asset | null {
  const stmt = db.prepare('SELECT * FROM assets WHERE filename = ?');
  return stmt.get(filename) as Asset | null;
}

export function getAssetById(db: Database, id: number): Asset | null {
  const stmt = db.prepare('SELECT * FROM assets WHERE id = ?');
  return stmt.get(id) as Asset | null;
}

function containsAssetUrl(value: string, asset: Asset): boolean {
  const normalized = value.trim();
  if (!normalized) return false;

  return (
    normalized === asset.url
    || normalized.includes(asset.url)
    || normalized.includes(asset.filename)
  );
}

export function findAssetReferences(db: Database, asset: Asset): AssetReference[] {
  const templates = getAllTemplates(db);
  const references: AssetReference[] = [];

  for (const template of templates) {
    const config = template.config;

    if (config.assets) {
      for (const [alias, value] of Object.entries(config.assets)) {
        if (containsAssetUrl(String(value ?? ''), asset)) {
          references.push({
            templateId: template.id,
            templateName: template.name,
            sourceType: 'assets',
            sourceKey: alias,
            sourceValue: String(value ?? ''),
          });
        }
      }
    }

    for (const [tagName, styleText] of Object.entries(config.styles || {})) {
      const styleValue = String(styleText ?? '');
      if (!styleValue.trim()) continue;

      if (containsAssetUrl(styleValue, asset)) {
        references.push({
          templateId: template.id,
          templateName: template.name,
          sourceType: 'styles',
          sourceKey: tagName,
          sourceValue: styleValue,
        });
      }

      const aliasMatches = Array.from(styleValue.matchAll(/@bg\(([^)]+)\)/g));
      for (const match of aliasMatches) {
        const alias = (match[1] || '').trim();
        if (!alias) continue;
        const mapped = config.assets?.[alias];
        if (mapped && containsAssetUrl(mapped, asset)) {
          references.push({
            templateId: template.id,
            templateName: template.name,
            sourceType: 'style-alias',
            sourceKey: `${tagName} -> ${alias}`,
            sourceValue: styleValue,
          });
        }
      }
    }
  }

  return references;
}

export function deleteAsset(db: Database, id: number): void {
  const stmt = db.prepare('DELETE FROM assets WHERE id = ?');
  stmt.run(id);
}
