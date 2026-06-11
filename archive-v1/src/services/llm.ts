import { post } from '../utils/request';

/** LLM 消息角色。 */
export type LlmRole = 'system' | 'user' | 'assistant';

/** LLM 对话消息。 */
export interface LlmMessage {
  role: LlmRole;
  content: string;
}

/** LLM 请求上下文。 */
export interface LlmRequestContext {
  userId: string;
  conversationId: string;
  /** Prompt 模板 Key，对应 `src/prompts/` 下的文件 */
  templateKey: 'review' | 'extract' | 'plan' | 'freeform';
  variables: Record<string, string>;
}

/** LLM 流式回调。 */
export interface LlmStreamCallbacks {
  onChunk: (delta: string) => void;
  onDone: (fullText: string) => void;
  onError: (err: Error) => void;
}

/** LLM Token 用量。 */
export interface LlmUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * LLM 客户端接口（依赖倒置）。
 * 前端通过 `llm` 单例调用，不感知实现细节。
 */
export interface ILLMClient {
  chat(context: LlmRequestContext, messages: LlmMessage[], callbacks: LlmStreamCallbacks): Promise<LlmUsage>;
}

/**
 * HTTP 实现的 LLM 客户端。
 * 调用 NestJS `/api/v1/llm/sync` 代理 MiniMax M3。
 */
class HttpLLMClient implements ILLMClient {
  async chat(context: LlmRequestContext, messages: LlmMessage[], callbacks: LlmStreamCallbacks): Promise<LlmUsage> {
    try {
      const result = await post<{ content: string; traceId: string }>('/api/v1/llm/sync', {
        messages,
        templateKey: context.templateKey,
        variables: context.variables,
      });

      if (result.content) {
        callbacks.onChunk(result.content);
        callbacks.onDone(result.content);
      } else {
        callbacks.onError(new Error('LLM 返回内容为空'));
      }

      return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'LLM 请求失败';
      callbacks.onError(new Error(msg));
      return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    }
  }
}

/**
 * Stub LLM 客户端（deferred to M2-A）。
 * 调用时始终返回错误，用于 LLM 未接入时的降级。
 */
export class StubLLMClient implements ILLMClient {
  async chat(_context: LlmRequestContext, _messages: LlmMessage[], callbacks: LlmStreamCallbacks): Promise<LlmUsage> {
    callbacks.onError(new Error('ILLMClient.chat() not implemented, use HttpLLMClient instead'));
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }
}

/**
 * LLM 客户端单例（当前为 HttpLLMClient，直连后端代理）。
 */
export const llm: ILLMClient = new HttpLLMClient();
