/**
 * 安全提取错误消息（兼容 Error 实例、字符串、未知类型）
 * 遵守 AGENTS.md §13: 禁止 as Error 不安全断言
 */
export function errorMsg(e: unknown): string {
  if (e instanceof Error) {
    const msg = e.message;
    if (/timeout|超时/i.test(msg)) return '网络超时，请稍后重试';
    if (/request:fail|network|ERR_CONNECTION|connect/i.test(msg)) return '网络连接失败';
    if (/^5\d{2}/.test(msg) || /service|server|busy/i.test(msg)) return '服务繁忙，请稍后重试';
    return msg;
  }
  if (typeof e === 'string') return e;
  return '操作失败';
}
