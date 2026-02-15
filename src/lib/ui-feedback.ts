type ToastType = 'info' | 'success' | 'error';
type ToastFn = (message: string, type?: ToastType) => void;

export function getApiErrorMessage(payload: any, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (typeof payload?.error === 'string') return payload.error;
  if (payload?.error?.message) return String(payload.error.message);
  return fallback;
}

export function showActionErrorToast(
  showToast: ToastFn,
  action: string,
  payload: any,
  fallback: string,
): string {
  const message = getApiErrorMessage(payload, fallback);
  showToast(`${action}失败：${message}`, 'error');
  return message;
}

export function showNetworkErrorToast(showToast: ToastFn, action: string): string {
  const message = '网络错误：无法连接到服务';
  showToast(`${action}失败：${message}`, 'error');
  return message;
}
