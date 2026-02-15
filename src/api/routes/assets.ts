// src/api/routes/assets.ts
// 素材管理 API 路由

import { Hono } from 'hono';
import {
  getDatabase,
  createAsset,
  getAllAssets,
  getAssetById,
  getAssetByFilename,
  findAssetReferences,
  deleteAsset,
} from '../../lib/db';
import { join } from 'path';
import { mkdir, rm } from 'fs/promises';

const assets = new Hono();

// 素材上传目录
const UPLOADS_DIR = './uploads';

// 确保上传目录存在
async function ensureUploadsDir() {
  try {
    await mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    // 目录已存在，忽略错误
  }
}

/**
 * GET /api/assets
 * 获取所有素材列表
 */
assets.get('/', async (c) => {
  try {
    const db = await getDatabase();
    const allAssets = getAllAssets(db);

    return c.json({
      success: true,
      data: allAssets,
    });
  } catch (error) {
    console.error('获取素材列表失败:', error);
    return c.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: '获取素材列表失败',
      },
    }, 500);
  }
});

/**
 * GET /api/assets/references/:id
 * 查询素材在所有模板中的引用情况
 */
assets.get('/references/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: '无效的素材 ID',
        },
      }, 400);
    }

    const db = await getDatabase();
    const asset = getAssetById(db, id);
    if (!asset) {
      return c.json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: '素材不存在',
        },
      }, 404);
    }

    const references = findAssetReferences(db, asset);

    return c.json({
      success: true,
      data: {
        asset,
        inUse: references.length > 0,
        references,
      },
    });
  } catch (error) {
    console.error('查询素材引用失败:', error);
    return c.json({
      success: false,
      error: {
        code: 'REFERENCES_QUERY_ERROR',
        message: '查询素材引用失败',
      },
    }, 500);
  }
});

/**
 * GET /api/assets/:filename
 * 访问素材文件
 */
assets.get('/:filename', async (c) => {
  try {
    const filename = c.req.param('filename');
    const db = await getDatabase();
    
    // 查询素材元数据
    const asset = getAssetByFilename(db, filename);
    if (!asset) {
      return c.json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: '素材不存在',
        },
      }, 404);
    }

    // 读取文件
    const filePath = join(UPLOADS_DIR, filename);
    const file = Bun.file(filePath);
    
    if (!(await file.exists())) {
      return c.json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: '文件不存在',
        },
      }, 404);
    }

    // 返回文件
    return new Response(file, {
      headers: {
        'Content-Type': asset.mime_type,
        'Cache-Control': 'public, max-age=31536000', // 缓存1年
      },
    });
  } catch (error) {
    console.error('获取素材失败:', error);
    return c.json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '获取素材失败',
      },
    }, 500);
  }
});

/**
 * POST /api/assets
 * 上传素材文件
 */
assets.post('/', async (c) => {
  try {
    // 确保上传目录存在
    await ensureUploadsDir();

    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: '未找到上传的文件',
        },
      }, 400);
    }

    // 验证文件类型
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: '只支持图片文件（PNG, JPEG, GIF, SVG, WebP）',
        },
      }, 400);
    }

    // 验证文件大小（5MB 限制）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return c.json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: '文件大小超过 5MB 限制',
        },
      }, 400);
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const ext = file.name.split('.').pop() || '';
    const sanitizedName = file.name
      .replace(/\.[^.]+$/, '') // 移除扩展名
      .replace(/[^a-zA-Z0-9-_]/g, '-') // 替换特殊字符
      .substring(0, 50); // 限制长度

    const filename = `${timestamp}-${random}-${sanitizedName}.${ext}`;
    const filePath = join(UPLOADS_DIR, filename);

    // 保存文件
    const buffer = await file.arrayBuffer();
    await Bun.write(filePath, buffer);

    // 保存元数据到数据库
    const db = await getDatabase();
    const url = `/api/assets/${filename}`;
    const assetId = createAsset(
      db,
      filename,
      file.name,
      file.type,
      file.size,
      url
    );

    return c.json({
      success: true,
      message: '文件上传成功',
      data: {
        id: assetId,
        filename,
        original_name: file.name,
        url,
        size: file.size,
        mime_type: file.type,
      },
    }, 201);
  } catch (error) {
    console.error('上传素材失败:', error);
    return c.json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error instanceof Error ? error.message : '上传失败',
      },
    }, 500);
  }
});

/**
 * DELETE /api/assets/:id
 * 删除素材
 */
assets.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: '无效的素材 ID',
        },
      }, 400);
    }

    const db = await getDatabase();
    const asset = getAssetById(db, id);
    if (!asset) {
      return c.json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: '素材不存在',
        },
      }, 404);
    }

    const references = findAssetReferences(db, asset);
    if (references.length > 0) {
      return c.json({
        success: false,
        error: {
          code: 'ASSET_IN_USE',
          message: '素材仍被模板引用，不能删除',
        },
        data: {
          asset,
          references,
        },
      }, 409);
    }
    
    const filePath = join(UPLOADS_DIR, asset.filename);
    await rm(filePath, { force: true });

    deleteAsset(db, id);

    return c.json({
      success: true,
      message: '素材删除成功',
    });
  } catch (error) {
    console.error('删除素材失败:', error);
    return c.json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: error instanceof Error ? error.message : '删除失败',
      },
    }, 500);
  }
});

export default assets;
