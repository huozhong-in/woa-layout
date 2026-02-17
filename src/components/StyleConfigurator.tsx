// src/components/StyleConfigurator.tsx
// 样式配置器：折叠面板展示不同标签类型的样式配置

import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store';
import type { Asset, AssetReference, TemplateConfig } from '../lib/db/types';
import { useConverter } from '../hooks/useConverter';
import { showActionErrorToast, showNetworkErrorToast } from '../lib/ui-feedback';

type TagCategory = string;

interface CategoryConfig {
  key: TagCategory;
  label: string;
  tags: string[];
}

const categories: CategoryConfig[] = [
  { key: 'h1', label: '标题类', tags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
  { key: 'p', label: '段落类', tags: ['p', 'blockquote'] },
  { key: 'hr', label: '分隔线', tags: ['hr'] },
  { key: 'ul', label: '列表类', tags: ['ul', 'ol', 'li'] },
  { key: 'a', label: '链接与强调', tags: ['a', 'strong', 'em'] },
  { key: 'pre', label: '代码块', tags: ['pre', 'code-inline'] },
  { key: 'img', label: '图片', tags: ['img'] },
];

const fontFamilyOptions = [
  { label: '系统默认', value: 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif' },
  { label: '衬线', value: 'Georgia, "Times New Roman", "Songti SC", serif' },
  { label: '无衬线', value: 'Arial, "Helvetica Neue", "PingFang SC", sans-serif' },
  { label: '等宽', value: 'Menlo, Monaco, Consolas, "Liberation Mono", monospace' },
];
const DEFAULT_FONT_FAMILY = 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';

const baseFontSizeOptions = [
  { label: '偏小（14px）', value: 'sm' },
  { label: '标准（16px）', value: 'base' },
  { label: '偏大（18px）', value: 'lg' },
];

const codeThemeOptions = [
  { label: 'Android Studio', value: 'androidstudio' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
];

export function StyleConfigurator() {
  const {
    currentTemplate,
    templates,
    tempConfig,
    markdown,
    setCurrentTemplate,
    setTemplates,
    setTempConfig,
    setHasUnsavedChanges,
    showToast,
  } = useAppStore();
  const { convert } = useConverter();

  const [openCategory, setOpenCategory] = useState<string | null>('h1');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'saveAs' | 'rename' | null>(null);
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAssetsLoading, setIsAssetsLoading] = useState(false);
  const [assetReferences, setAssetReferences] = useState<Record<number, AssetReference[]>>({});
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [selectedAssetFile, setSelectedAssetFile] = useState<File | null>(null);
  const [assetFileInputKey, setAssetFileInputKey] = useState(0);
  const [assetAliasInput, setAssetAliasInput] = useState('');
  const [assetAliasUrlInput, setAssetAliasUrlInput] = useState('');
  const menuRef = useRef<HTMLDivElement | null>(null);

  // 使用当前模板配置或临时配置
  const config = tempConfig || currentTemplate?.config || { global: {}, variables: {}, styles: {} };
  const assetAliases = Object.keys(config.assets || {});
  const globalConfig = config.global || {};
  const isDefaultTemplate = currentTemplate?.is_default === 1;
  const saveButtonLabel = isDefaultTemplate ? '另存为' : '保存模板';
  const convertApiUrl = `${window.location.origin}/api/convert`;
  const toastApiError = (action: string, payload: unknown, fallback: string) =>
    showActionErrorToast(showToast, action, payload, fallback);
  const toastNetError = (action: string) => showNetworkErrorToast(showToast, action);

  async function copyText(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fallback below
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }

  function confirmDiscardIfNeeded(message: string): boolean {
    const { hasUnsavedChanges } = useAppStore.getState();
    if (!hasUnsavedChanges) return true;
    return window.confirm(message);
  }

  async function loadAssets() {
    setIsAssetsLoading(true);
    try {
      const response = await fetch('/api/assets');
      const data = await response.json();
      if (!data.success) {
        toastApiError('获取素材', data, '获取素材失败');
        return;
      }
      setAssets(data.data || []);
    } catch {
      toastNetError('获取素材');
    } finally {
      setIsAssetsLoading(false);
    }
  }

  async function openAssetDialog() {
    setAssetReferences({});
    setIsAssetDialogOpen(true);
    await loadAssets();
  }

  async function handleAssetUpload() {
    if (!selectedAssetFile) {
      showToast('请先选择一个图片文件', 'error');
      return;
    }

    setIsUploadingAsset(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedAssetFile);

      const response = await fetch('/api/assets', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!data.success) {
        toastApiError('上传素材', data, '上传素材失败');
        return;
      }

      setSelectedAssetFile(null);
      setAssetFileInputKey((prev) => prev + 1);
      await loadAssets();
      showToast('素材上传成功', 'success');
    } catch {
      toastNetError('上传素材');
    } finally {
      setIsUploadingAsset(false);
    }
  }

  async function queryAssetReferences(assetId: number) {
    try {
      const response = await fetch(`/api/assets/references/${assetId}`);
      const data = await response.json();
      if (!data.success) {
        toastApiError('查询素材引用', data, '查询引用失败');
        return;
      }

      setAssetReferences((prev) => ({
        ...prev,
        [assetId]: data.data?.references || [],
      }));
    } catch {
      toastNetError('查询素材引用');
    }
  }

  async function handleDeleteAsset(asset: Asset) {
    const ok = window.confirm(`确认删除素材「${asset.original_name}」吗？`);
    if (!ok) return;

    try {
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!data.success) {
        if (data.error?.code === 'ASSET_IN_USE') {
          const refs = (data.data?.references || []) as AssetReference[];
          setAssetReferences((prev) => ({ ...prev, [asset.id]: refs }));
          showToast(`素材正在被 ${refs.length} 处模板配置引用，无法删除`, 'error');
          return;
        }

        toastApiError('删除素材', data, '删除素材失败');
        return;
      }

      await loadAssets();
      showToast('素材删除成功', 'success');
    } catch {
      toastNetError('删除素材');
    }
  }

  async function handleCopyAssetUrl(url: string) {
    const absoluteUrl = `${window.location.origin}${url}`;
    const ok = await copyText(absoluteUrl);
    if (ok) {
      showToast('素材 URL 已复制', 'success');
    } else {
      showToast('复制素材 URL 失败', 'error');
    }
  }

  async function upsertAssetAlias(aliasRaw: string, urlRaw: string) {
    const alias = aliasRaw.trim();
    const url = urlRaw.trim();

    if (!alias) {
      showToast('别名不能为空', 'error');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
      showToast('别名仅支持字母、数字、下划线和中划线', 'error');
      return;
    }
    if (!url) {
      showToast('素材 URL 不能为空', 'error');
      return;
    }

    const normalizedUrl = url.startsWith('/') ? url : `/${url.replace(/^\/+/, '')}`;
    const nextConfig = {
      ...config,
      assets: {
        ...(config.assets || {}),
        [alias]: normalizedUrl,
      },
    };

    setTempConfig(nextConfig);
    setHasUnsavedChanges(true);
    setAssetAliasInput('');
    setAssetAliasUrlInput('');
    showToast(`已绑定别名 ${alias}`, 'success');
    await convert();
  }

  async function removeAssetAlias(alias: string) {
    const nextAssets = { ...(config.assets || {}) };
    delete nextAssets[alias];

    setTempConfig({
      ...config,
      assets: nextAssets,
    });
    setHasUnsavedChanges(true);
    showToast(`已删除别名 ${alias}`, 'success');
    await convert();
  }

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  async function refreshTemplatesAndSwitch(targetTemplateId?: string) {
    const response = await fetch('/api/templates');
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || '获取模板列表失败');
    }

    const latestTemplates = data.data ?? [];
    setTemplates(latestTemplates);

    let nextTemplate = null;
    if (targetTemplateId) {
      nextTemplate = latestTemplates.find((item: { id: string }) => item.id === targetTemplateId) || null;
    }

    if (!nextTemplate) {
      nextTemplate = latestTemplates.find((item: { id: string; is_default: number }) => item.id === 'default-simple' || item.is_default === 1) || null;
    }

    setCurrentTemplate(nextTemplate);
    setTempConfig(null);
    setHasUnsavedChanges(false);
    await convert();
  }

  async function validateConfigBeforeSave(): Promise<boolean> {
    if (!currentTemplate) return false;

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: currentTemplate.id,
          markdown: markdown || '校验',
          templateConfig: config,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        toastApiError('样式校验', data, '转换失败');
        return false;
      }

      const warnings = (data.warnings || []) as string[];
      const tailwindError = warnings.find((warning) =>
        /未识别的 Tailwind 类|Tailwind 语法错误|Tailwind 转换失败/.test(warning),
      );

      if (tailwindError) {
        showToast(`样式校验未通过：${tailwindError}`, 'error');
        return false;
      }

      return true;
    } catch (error) {
      toastNetError('样式校验');
      return false;
    }
  }

  function normalizeTemplateName(name: string): string {
    return name.trim();
  }

  function buildTemplateIdFromName(name: string): string {
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-\u4e00-\u9fa5]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const prefix = slug || 'template';
    return `${prefix}-${Date.now()}`;
  }

  function openSaveAsDialog() {
    setTemplateNameInput('');
    setDialogMode('saveAs');
    setIsMenuOpen(false);
  }

  function openRenameDialog() {
    if (!currentTemplate || isDefaultTemplate) return;
    setTemplateNameInput(currentTemplate.name);
    setDialogMode('rename');
    setIsMenuOpen(false);
  }

  async function handleTemplateSelect(templateId: string) {
    const currentTemplateId = currentTemplate?.id;
    if (templateId === currentTemplateId) return;

    const ok = confirmDiscardIfNeeded('当前有未保存修改，切换模板将丢失这些修改，是否继续？');
    if (!ok) return;

    const nextTemplate = templates.find((item) => item.id === templateId) || null;
    if (!nextTemplate) return;

    setCurrentTemplate(nextTemplate);
    setTempConfig(null);
    setHasUnsavedChanges(false);
    await convert();
  }

  const handleStyleChange = (tag: string, value: string) => {
    setTempConfig({
      ...config,
      styles: {
        ...config.styles,
        [tag]: value,
      },
    });
    setHasUnsavedChanges(true);
  };

  const handleGlobalChange = (
    key: 'themeColor' | 'fontFamily' | 'baseFontSize' | 'codeTheme',
    value: string,
  ) => {
    setTempConfig({
      ...config,
      global: {
        ...(config.global || {}),
        [key]: value,
      },
    });
    setHasUnsavedChanges(true);
  };

  const handleStyleBlur = async () => {
    await convert();
  };

  const handlePrimarySave = async () => {
    if (!currentTemplate) return;

    if (isDefaultTemplate) {
      openSaveAsDialog();
      return;
    }

    const isValid = await validateConfigBeforeSave();
    if (!isValid) return;

    const response = await fetch(`/api/templates/${currentTemplate.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: currentTemplate.name,
        config,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      toastApiError('保存模板', data, '保存模板失败');
      return;
    }

    await refreshTemplatesAndSwitch(currentTemplate.id);
    showToast(`模板「${currentTemplate.name}」保存成功`, 'success');
  };

  const handleDeleteTemplate = async () => {
    if (!currentTemplate || isDefaultTemplate) return;

    const proceed = confirmDiscardIfNeeded('当前有未保存修改，删除并切换模板将丢失这些修改，是否继续？');
    if (!proceed) return;

    const ok = window.confirm(`确认删除模板「${currentTemplate.name}」吗？`);
    if (!ok) return;

    const response = await fetch(`/api/templates/${currentTemplate.id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) {
      toastApiError('删除模板', data, '删除模板失败');
      return;
    }

    await refreshTemplatesAndSwitch();
    setIsMenuOpen(false);
    showToast(`模板「${currentTemplate.name}」已删除`, 'success');
  };

  const handleDialogConfirm = async () => {
    if (!currentTemplate || !dialogMode) return;

    const normalizedName = normalizeTemplateName(templateNameInput);
    if (!normalizedName) {
      showToast('模板名不能为空', 'error');
      return;
    }

    const isNameTaken = templates.some(
      (item) => item.name.trim().toLowerCase() === normalizedName.toLowerCase() && item.id !== currentTemplate.id,
    );
    if (isNameTaken) {
      showToast('模板名已存在，请更换名称', 'error');
      return;
    }

    const isValid = await validateConfigBeforeSave();
    if (!isValid) return;

    if (dialogMode === 'saveAs') {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: buildTemplateIdFromName(normalizedName),
          name: normalizedName,
          config,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        toastApiError('另存为模板', data, '另存为失败');
        return;
      }

      setDialogMode(null);
      await refreshTemplatesAndSwitch(data.data?.id);
      showToast(`模板已另存为「${normalizedName}」`, 'success');
      return;
    }

    if (dialogMode === 'rename') {
      const response = await fetch(`/api/templates/${currentTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: normalizedName,
          config,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        toastApiError('模板改名', data, '改名失败');
        return;
      }

      setDialogMode(null);
      await refreshTemplatesAndSwitch(currentTemplate.id);
      showToast(`模板已改名为「${normalizedName}」`, 'success');
    }
  };

  const handleCopyCurlCommand = async () => {
    if (!currentTemplate) return;

    const sampleMarkdown = '# Hello\n\nThis is a demo.';
    const curlCommand = `curl -X POST "${convertApiUrl}" -H "Content-Type: application/json" -d '${JSON.stringify({
      templateId: currentTemplate.id,
      markdown: sampleMarkdown,
    })}'`;

    const ok = await copyText(curlCommand);
    if (ok) {
      showToast('curl 命令已复制到剪贴板', 'success');
    } else {
      showToast('复制 curl 命令失败', 'error');
    }
  };

  const handleCopyApiUrl = async () => {
    const ok = await copyText(convertApiUrl);
    if (ok) {
      showToast('API URL 已复制到剪贴板', 'success');
    } else {
      showToast('复制 API URL 失败', 'error');
    }
  };

  const toggleCategory = (categoryKey: string) => {
    setOpenCategory(openCategory === categoryKey ? null : categoryKey);
  };

  const getStyleValue = (tag: string): string => {
    if (tag === 'code-inline') {
      return config.styles['code-inline'] || config.styles.code || '';
    }
    return config.styles[tag] || '';
  };

  const getTagLabel = (tag: string): string => {
    if (tag === 'code-inline') return 'code-inline（行内代码）';
    return tag;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">样式配置</h2>
        <select
          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
          value={currentTemplate?.id || ''}
          onChange={(e) => handleTemplateSelect(e.target.value)}
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}{template.is_default === 1 ? '（默认）' : ''}
            </option>
          ))}
        </select>
        <div className="mt-2 rounded bg-gray-50 px-2 py-2 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-600 truncate">
              API: {convertApiUrl}
            </span>
            <button
              type="button"
              onClick={handleCopyApiUrl}
              className="shrink-0 text-[11px] text-blue-600 hover:text-blue-700"
            >
              复制 URL
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-600 truncate">
              templateId: {currentTemplate?.id || '-'}
            </span>
            <button
              type="button"
              onClick={handleCopyCurlCommand}
              disabled={!currentTemplate?.id}
              className="shrink-0 text-[11px] text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              复制 cURL
            </button>
          </div>

          <div className="pt-1 border-t border-gray-200 space-y-1">
            <p className="text-[11px] text-gray-600">可用素材别名（用于 @bg(alias)）</p>
            {assetAliases.length === 0 ? (
              <p className="text-[11px] text-gray-400">当前模板暂无 assets 别名，配置后即可在样式中引用。</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {assetAliases.map((alias) => (
                  <span
                    key={alias}
                    className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100"
                    title={`示例：bg-[url(@bg(${alias}))]`}
                  >
                    {alias}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-gray-500">写法示例：bg-[url(@bg(divider))]</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-200 bg-white space-y-3">
          <h3 className="text-xs font-semibold text-gray-700">全局配置</h3>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">主题色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={globalConfig.themeColor || '#2563eb'}
                onChange={(e) => handleGlobalChange('themeColor', e.target.value)}
                onBlur={handleStyleBlur}
                className="h-7 w-10 border border-gray-300 rounded bg-white"
              />
              <input
                type="text"
                value={globalConfig.themeColor || ''}
                onChange={(e) => handleGlobalChange('themeColor', e.target.value)}
                onBlur={handleStyleBlur}
                placeholder="#2563eb"
                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">字体</label>
            <select
              value={globalConfig.fontFamily || DEFAULT_FONT_FAMILY}
              onChange={(e) => handleGlobalChange('fontFamily', e.target.value)}
              onBlur={handleStyleBlur}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            >
              {fontFamilyOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">字号</label>
            <select
              value={globalConfig.baseFontSize || 'base'}
              onChange={(e) => handleGlobalChange('baseFontSize', e.target.value)}
              onBlur={handleStyleBlur}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            >
              {baseFontSizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">代码块主题</label>
            <select
              value={globalConfig.codeTheme || 'androidstudio'}
              onChange={(e) => handleGlobalChange('codeTheme', e.target.value)}
              onBlur={handleStyleBlur}
              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
            >
              {codeThemeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {categories.map((category) => (
          <div key={category.key} className="border-b border-gray-200">
            <button
              onClick={() => toggleCategory(category.key)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                {category.label}
              </span>
              <span className="text-gray-400">
                {openCategory === category.key ? '−' : '+'}
              </span>
            </button>
            
            {openCategory === category.key && (
              <div className="px-4 py-3 space-y-3 bg-white">
                {category.tags.map((tag) => (
                  <div key={tag}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {getTagLabel(tag)}
                    </label>
                    <input
                      type="text"
                      value={getStyleValue(tag)}
                      onChange={(e) => handleStyleChange(tag, e.target.value)}
                      onBlur={handleStyleBlur}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="输入 TailwindCSS 类名"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-gray-200 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={handlePrimarySave}
            className="flex-1 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            {saveButtonLabel}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="w-10 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
              title="更多操作"
            >
              ⋯
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 bottom-12 w-36 rounded border border-gray-200 bg-white shadow-md z-20">
                <button
                  onClick={openSaveAsDialog}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                >
                  另存为
                </button>
                <button
                  onClick={openRenameDialog}
                  disabled={isDefaultTemplate}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isDefaultTemplate ? '默认模板不可改名' : ''}
                >
                  改名
                </button>
                <button
                  onClick={handleDeleteTemplate}
                  disabled={isDefaultTemplate}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isDefaultTemplate ? '默认模板不可删除' : ''}
                >
                  删除
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={openAssetDialog}
          className="w-full py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
        >
          素材管理
        </button>
      </div>

      {dialogMode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-90 rounded-lg bg-white p-4 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              {dialogMode === 'saveAs' ? '另存为模板' : '模板改名'}
            </h3>
            <input
              autoFocus
              type="text"
              value={templateNameInput}
              onChange={(e) => setTemplateNameInput(e.target.value)}
              placeholder="请输入模板名"
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDialogMode(null)}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleDialogConfirm}
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {isAssetDialogOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-160 max-h-[80vh] rounded-lg bg-white p-4 shadow-lg flex flex-col">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">素材管理</h3>

            <div className="rounded border border-gray-200 p-3 mb-3">
              <p className="text-xs text-gray-500 mb-2">仅支持图片上传，上传后可在模板样式中通过 URL 使用。</p>
              <div className="flex items-center gap-2">
                <input
                  key={assetFileInputKey}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedAssetFile(e.target.files?.[0] || null)}
                  className="flex-1 text-xs"
                />
                <button
                  onClick={handleAssetUpload}
                  disabled={isUploadingAsset}
                  className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUploadingAsset ? '上传中…' : '上传'}
                </button>
              </div>
              {selectedAssetFile && (
                <p className="text-xs text-gray-600 mt-2">已选择：{selectedAssetFile.name}</p>
              )}
            </div>

            <div className="rounded border border-gray-200 p-3 mb-3 space-y-2">
              <p className="text-xs text-gray-500">素材别名映射（供 `@bg(alias)` 与 {'{{asset:alias}}'} 使用）</p>
              <div className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  value={assetAliasInput}
                  onChange={(e) => setAssetAliasInput(e.target.value)}
                  placeholder="别名，如 divider"
                  className="col-span-3 text-xs border border-gray-300 rounded px-2 py-1"
                />
                <input
                  type="text"
                  value={assetAliasUrlInput}
                  onChange={(e) => setAssetAliasUrlInput(e.target.value)}
                  placeholder="素材 URL，如 /api/assets/xxx.svg"
                  className="col-span-7 text-xs border border-gray-300 rounded px-2 py-1"
                />
                <button
                  onClick={() => upsertAssetAlias(assetAliasInput, assetAliasUrlInput)}
                  className="col-span-2 text-xs rounded bg-gray-800 text-white hover:bg-black px-2"
                >
                  绑定
                </button>
              </div>

              {Object.keys(config.assets || {}).length === 0 ? (
                <p className="text-[11px] text-gray-400">当前模板暂无别名映射</p>
              ) : (
                <div className="space-y-1">
                  {Object.entries(config.assets || {}).map(([alias, url]) => (
                    <div key={alias} className="flex items-center gap-2 rounded border border-gray-100 px-2 py-1">
                      <span className="text-xs font-medium text-gray-700 w-28 truncate">{alias}</span>
                      <span className="text-[11px] text-gray-500 flex-1 truncate">{url}</span>
                      <button
                        onClick={async () => {
                          const ok = await copyText(`{{asset:${alias}}}`);
                          if (ok) {
                            showToast('自定义标记已复制', 'success');
                          } else {
                            showToast('复制失败', 'error');
                          }
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-700"
                      >
                        复制标记
                      </button>
                      <button
                        onClick={() => removeAssetAlias(alias)}
                        className="text-[11px] text-red-600 hover:text-red-700"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">共 {assets.length} 个素材</span>
              <button
                onClick={loadAssets}
                disabled={isAssetsLoading}
                className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                刷新
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded">
              {isAssetsLoading ? (
                <div className="p-3 text-xs text-gray-500">加载中…</div>
              ) : assets.length === 0 ? (
                <div className="p-3 text-xs text-gray-500">暂无素材</div>
              ) : (
                assets.map((asset) => {
                  const refs = assetReferences[asset.id] || [];

                  return (
                    <div key={asset.id} className="border-b border-gray-100 p-3 last:border-b-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-800 truncate" title={asset.original_name}>
                            {asset.original_name}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1 break-all">{`${window.location.origin}${asset.url}`}</p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {Math.round(asset.size / 1024)}KB · {new Date(asset.uploaded_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            onClick={() => handleCopyAssetUrl(asset.url)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            复制 URL
                          </button>
                          <button
                            onClick={() => {
                              const suggestedAlias = asset.original_name
                                .replace(/\.[^.]+$/, '')
                                .replace(/[^a-zA-Z0-9-_]/g, '-')
                                .toLowerCase() || 'asset';
                              setAssetAliasInput(suggestedAlias);
                              setAssetAliasUrlInput(asset.url);
                            }}
                            className="text-xs text-gray-600 hover:text-gray-700"
                          >
                            设为别名
                          </button>
                          <button
                            onClick={() => queryAssetReferences(asset.id)}
                            className="text-xs text-gray-600 hover:text-gray-700"
                          >
                            查引用
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            删除
                          </button>
                        </div>
                      </div>

                      {refs.length > 0 && (
                        <div className="mt-2 rounded bg-red-50 p-2">
                          <p className="text-[11px] text-red-700">该素材被以下配置引用，无法删除：</p>
                          <ul className="mt-1 list-disc pl-4 text-[11px] text-red-700">
                            {refs.map((ref, index) => (
                              <li key={`${ref.templateId}-${ref.sourceType}-${index}`}>
                                {ref.templateName} · {ref.sourceType}.{ref.sourceKey}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end mt-3">
              <button
                onClick={() => {
                  setIsAssetDialogOpen(false);
                  setSelectedAssetFile(null);
                  setAssetReferences({});
                  setAssetFileInputKey((prev) => prev + 1);
                }}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
