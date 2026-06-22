/**
 * 安全日志记录工具 — 仅输出 message 和 code，防止泄漏完整 error 对象。
 * 对齐 AGENTS.md §13.7（日志不得泄漏敏感信息）。
 */
export function logError(context: string, error: unknown): void {
  if (error instanceof Error) {
    const extra = (error as unknown as Record<string, unknown>).code !== undefined
      ? ` code=${(error as unknown as Record<string, unknown>).code}`
      : '';
    console.error(`[${context}] ${error.message}${extra}`);
  } else {
    console.error(`[${context}]`, String(error));
  }
}
