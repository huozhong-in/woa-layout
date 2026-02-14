-- WOA-Layout 数据库 Schema
-- SQLite 数据库表结构定义

-- 模板表：存储样式模板配置
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,           -- 模板 ID，如：enterprise-a-simple-blue
  name TEXT NOT NULL,            -- 显示名称，如：企业A-简约蓝
  config TEXT NOT NULL,          -- JSON 格式的完整配置
  created_at INTEGER NOT NULL,   -- 创建时间（Unix 时间戳）
  updated_at INTEGER NOT NULL,   -- 更新时间（Unix 时间戳）
  is_default INTEGER DEFAULT 0   -- 是否系统默认模板（0=否, 1=是）
);

-- 素材表：存储上传的图片和 SVG 文件元数据
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL UNIQUE, -- 存储的文件名（含扩展名）
  original_name TEXT NOT NULL,   -- 用户上传的原始文件名
  mime_type TEXT NOT NULL,       -- MIME 类型（image/png, image/svg+xml 等）
  size INTEGER NOT NULL,         -- 文件大小（字节）
  url TEXT NOT NULL,             -- 访问 URL（/api/assets/{filename}）
  uploaded_at INTEGER NOT NULL   -- 上传时间（Unix 时间戳）
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_templates_is_default ON templates(is_default);
CREATE INDEX IF NOT EXISTS idx_assets_uploaded_at ON assets(uploaded_at DESC);
