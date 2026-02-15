type ApiSuccess<T> = { success: true; data?: T; message?: string; html?: string; warnings?: string[] };
type ApiError = { success: false; error?: { code?: string; message?: string }; data?: unknown };
type ApiResponse<T> = ApiSuccess<T> | ApiError;

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function logStep(title: string) {
  console.log(`\n=== ${title} ===`);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function requestJson<T>(
  path: string,
  init?: RequestInit
): Promise<{ status: number; body: ApiResponse<T> }> {
  const response = await fetch(`${BASE_URL}${path}`, init);
  const body = (await response.json()) as ApiResponse<T>;
  return { status: response.status, body };
}

async function main() {
  console.log(`Base URL: ${BASE_URL}`);

  logStep('1) 健康检查');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  assert(healthRes.ok, '服务不可用，请先运行：bun run dev');
  console.log('健康检查通过');

  logStep('2) 上传素材');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="120" height="40" fill="#2563eb"/><text x="10" y="26" font-size="16" fill="white">WOA TEST</text></svg>`;
  const file = new File([svg], 'woa-asset-test.svg', { type: 'image/svg+xml' });
  const form = new FormData();
  form.append('file', file);

  const upload = await requestJson<{ id: number; url: string; filename: string }>('/api/assets', {
    method: 'POST',
    body: form,
  });
  assert(upload.status === 201 && upload.body.success, `上传失败: ${JSON.stringify(upload.body)}`);
  const assetId = upload.body.data!.id;
  const assetUrl = upload.body.data!.url;
  console.log(`上传成功: id=${assetId}, url=${assetUrl}`);

  logStep('3) 素材列表包含新素材');
  const list = await requestJson<Array<{ id: number; url: string; original_name: string }>>('/api/assets');
  assert(list.status === 200 && list.body.success, `列表接口失败: ${JSON.stringify(list.body)}`);
  assert(list.body.data!.some((item) => item.id === assetId), '素材列表中未找到刚上传的素材');
  console.log('列表校验通过');

  const templateId = `asset-ref-test-${Date.now()}`;
  const templateName = '素材引用测试模板';

  logStep('4) 创建引用该素材的模板');
  const createTemplate = await requestJson<{ id: string; name: string }>('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: templateId,
      name: templateName,
      config: {
        variables: {
          brandColor: '#333333',
          accentColor: '#f5f5f5',
          textColor: '#333333',
        },
        assets: {
          divider: assetUrl,
        },
        styles: {
          p: 'my-4 leading-relaxed text-base',
          hr: `my-8 h-px border-0 bg-[url('${assetUrl}')] bg-no-repeat bg-center bg-contain`,
        },
      },
    }),
  });
  assert(
    createTemplate.status === 201 && createTemplate.body.success,
    `创建模板失败: ${JSON.stringify(createTemplate.body)}`
  );
  console.log(`模板创建成功: ${templateId}`);

  logStep('5) 删除素材应被拦截（409 ASSET_IN_USE）');
  const blockedDelete = await requestJson<{ references?: Array<{ templateId: string }> }>(`/api/assets/${assetId}`, {
    method: 'DELETE',
  });
  assert(blockedDelete.status === 409, `期望 409，实际 ${blockedDelete.status}`);
  assert(!blockedDelete.body.success, '删除应失败但返回 success=true');
  assert(
    blockedDelete.body.error?.code === 'ASSET_IN_USE',
    `期望 ASSET_IN_USE，实际 ${blockedDelete.body.error?.code}`
  );
  console.log('删除拦截校验通过');

  logStep('6) 查询引用详情');
  const refs = await requestJson<{ inUse: boolean; references: Array<{ templateId: string; sourceType: string; sourceKey: string }> }>(
    `/api/assets/references/${assetId}`
  );
  assert(refs.status === 200 && refs.body.success, `查询引用失败: ${JSON.stringify(refs.body)}`);
  assert(refs.body.data!.inUse === true, '应为 inUse=true');
  assert(refs.body.data!.references.some((ref) => ref.templateId === templateId), '引用列表中未找到测试模板');
  console.log('引用查询校验通过');

  logStep('7) 验证 Tailwind 手敲引用：直接 URL 可生效');
  const convertDirect = await requestJson<{ html: string; warnings?: string[] }>('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      templateId,
      markdown: '---',
    }),
  });
  assert(convertDirect.status === 200 && convertDirect.body.success, `转换失败: ${JSON.stringify(convertDirect.body)}`);
  const directHtml = convertDirect.body.html || '';
  assert(directHtml.includes('background-image:'), '直接 URL 写法未生成 background-image');
  assert(directHtml.includes(assetUrl), '生成结果未包含素材 URL');
  console.log('直接 URL 写法通过');

  logStep('8) 验证 Tailwind 手敲引用：@bg(alias) 自动替换生效');
  const aliasTemplateId = `${templateId}-alias`;
  const aliasToken = `@bg(${['divider'].join('')})`;
  const bgClass = `bg-${`[url('${aliasToken}')]`}`;
  const createAliasTemplate = await requestJson<{ id: string; name: string }>('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: aliasTemplateId,
      name: '素材别名引用测试模板',
      config: {
        variables: {
          brandColor: '#333333',
          accentColor: '#f5f5f5',
          textColor: '#333333',
        },
        assets: {
          divider: assetUrl,
        },
        styles: {
          p: 'my-4 leading-relaxed text-base',
          hr: `my-8 h-px border-0 ${bgClass} bg-no-repeat bg-center bg-contain`,
        },
      },
    }),
  });
  assert(
    createAliasTemplate.status === 201 && createAliasTemplate.body.success,
    `创建 alias 模板失败: ${JSON.stringify(createAliasTemplate.body)}`
  );

  const convertAlias = await requestJson<{ html: string; warnings?: string[] }>('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      templateId: aliasTemplateId,
      markdown: '---',
    }),
  });
  assert(convertAlias.status === 200 && convertAlias.body.success, `alias 转换失败: ${JSON.stringify(convertAlias.body)}`);
  const aliasHtml = convertAlias.body.html || '';
  const aliasWarnings = convertAlias.body.warnings || [];
  const aliasHasBg = aliasHtml.includes('background-image:');
  const aliasContainsRealAssetUrl = aliasHtml.includes(assetUrl);
  const aliasContainsLiteralAlias = aliasHtml.includes('@bg(divider)');
  const aliasHasWarning = aliasWarnings.some((w) => w.includes('未识别的 Tailwind 类') || w.includes('@bg(divider)'));

  console.log(`alias 背景是否生效: ${aliasHasBg}`);
  console.log(`alias 是否替换为真实素材 URL: ${aliasContainsRealAssetUrl}`);
  console.log(`alias 是否保留字面量 @bg(divider): ${aliasContainsLiteralAlias}`);
  console.log(`alias 是否有警告: ${aliasHasWarning}`);
  assert(aliasHasBg, 'alias 模板未生成 background-image');
  assert(aliasContainsRealAssetUrl, 'alias 未替换为真实素材 URL');
  assert(!aliasContainsLiteralAlias, 'alias 字面量未被替换');
  console.log('结论：@bg(alias) 已自动替换为 assets 映射值。');

  logStep('9) 清理测试模板并再次删除素材（应成功）');
  const delMainTemplate = await requestJson(`/api/templates/${templateId}`, { method: 'DELETE' });
  assert(delMainTemplate.status === 200, `删除主测试模板失败: ${JSON.stringify(delMainTemplate.body)}`);

  const delAliasTemplate = await requestJson(`/api/templates/${aliasTemplateId}`, { method: 'DELETE' });
  assert(delAliasTemplate.status === 200, `删除 alias 测试模板失败: ${JSON.stringify(delAliasTemplate.body)}`);

  const finalDelete = await requestJson(`/api/assets/${assetId}`, { method: 'DELETE' });
  assert(finalDelete.status === 200 && finalDelete.body.success, `最终删除素材失败: ${JSON.stringify(finalDelete.body)}`);
  console.log('清理完成，素材删除成功');

  console.log('\n✅ 素材上传与管理流程测试通过');
}

main().catch((error) => {
  console.error('\n❌ 测试失败:', error instanceof Error ? error.message : error);
  process.exit(1);
});
