import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { QuotaService } from '../quota/quota.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { LlmChatDto } from './dto/llm-chat.dto';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface PromptFile {
  system: string;
  temperature: number;
  max_tokens: number;
}

export interface LlmStreamEvent {
  type: 'chunk' | 'done';
  data: string;
}

interface MiniMaxChunk {
  choices?: { index: number; delta: { content?: string; role?: string } }[];
  usage?: { total_tokens: number; prompt_tokens: number; completion_tokens: number };
}

@Injectable()
export class LlmService {
  private readonly promptCache = new Map<string, PromptFile>();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly quotaService: QuotaService,
  ) {}

  chat(dto: LlmChatDto, userId: string): Observable<LlmStreamEvent> {
    return new Observable<LlmStreamEvent>((subscriber) => {
      const controller = new AbortController();
      let fullContent = '';
      let deducted = false;

      (async () => {
        try {
          const balance = await this.quotaService.getBalance(userId);
          const total = balance.permanentPoints + balance.monthlyPoints;
          if (total < 1) {
            subscriber.error(new BusinessException(40201, 'AI 点数不足'));
            return;
          }

          const messages = await this.buildMessages(dto);
          const apiKey = this.config.get<string>('minimax.apiKey');
          if (!apiKey) {
            subscriber.error(new BusinessException(50001, 'MiniMax API Key 未配置'));
            return;
          }

          const response = await fetch('https://api.minimax.io/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'MiniMax-M3',
              messages,
              stream: true,
              max_completion_tokens: 2000,
              temperature: dto.templateKey ? undefined : 0.7,
            }),
            signal: controller.signal,
          });

          if (!response.ok) {
            subscriber.error(new Error(`MiniMax API error: ${response.status}`));
            return;
          }

          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data: ')) continue;
              const raw = trimmed.slice(6).trim();
              if (raw === '[DONE]') continue;

              try {
                const chunk: MiniMaxChunk = JSON.parse(raw);
                const delta = chunk.choices?.[0]?.delta?.content || '';
                if (delta) {
                  fullContent += delta;
                  subscriber.next({ type: 'chunk', data: delta });
                }
              } catch {
                // skip malformed SSE lines
              }
            }
          }

          if (fullContent) {
            await this.prisma.$transaction(async (tx) => {
              await this.quotaService.deductInTx(tx, userId, 1);
            });
            deducted = true;

            const traceId = randomUUID().slice(0, 12);
            subscriber.next({
              type: 'done',
              data: JSON.stringify({ fullContent, traceId }),
            });
          }

          subscriber.complete();
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') return;
          if (!subscriber.closed) {
            subscriber.error(err);
          }
        }
      })();

      return { unsubscribe: () => controller.abort() };
    });
  }

  async chatSync(dto: LlmChatDto, userId: string): Promise<{ content: string; traceId: string }> {
    const balance = await this.quotaService.getBalance(userId);
    const total = balance.permanentPoints + balance.monthlyPoints;
    if (total < 1) throw new BusinessException(40201, 'AI 点数不足');

    const messages = await this.buildMessages(dto);
    const apiKey = this.config.get<string>('minimax.apiKey');
    if (!apiKey) throw new BusinessException(50001, 'MiniMax API Key 未配置', HttpStatus.INTERNAL_SERVER_ERROR);

    const response = await fetch('https://api.minimax.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'MiniMax-M3',
        messages,
        stream: false,
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) throw new BusinessException(50001, `MiniMax API error: ${response.status}`, HttpStatus.INTERNAL_SERVER_ERROR);

    const body = await response.json() as MiniMaxChunk & { choices: { message: { content: string } }[] };
    const content = body.choices?.[0]?.message?.content || '';
    const traceId = randomUUID().slice(0, 12);

    if (content) {
      await this.prisma.$transaction(async (tx) => {
        await this.quotaService.deductInTx(tx, userId, 1);
      });
    }

    return { content, traceId };
  }

  private async buildMessages(dto: LlmChatDto): Promise<{ role: string; content: string }[]> {
    if (!dto.templateKey) return dto.messages;

    const prompt = await this.loadPrompt(dto.templateKey);
    const variables = dto.variables ?? {};
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let system = prompt.system;
    system = system.replace(/\{\{date\}\}/g, dateStr);
    system = system.replace(/\{\{user_name\}\}/g, variables.user_name || '用户');
    for (const [k, v] of Object.entries(variables)) {
      if (k !== 'user_name' && k !== 'date') {
        system = system.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
      }
    }

    return [{ role: 'system', content: system }, ...dto.messages];
  }

  private async loadPrompt(templateKey: string): Promise<PromptFile> {
    const cached = this.promptCache.get(templateKey);
    if (cached) return cached;

    const promptDir = path.resolve(__dirname, '..', '..', '..', '..', '..', 'src', 'prompts');
    const filePath = path.join(promptDir, `${templateKey}.json`);

    try {
      const raw = await fs.promises.readFile(filePath, 'utf-8');
      const prompt = JSON.parse(raw) as PromptFile;
      this.promptCache.set(templateKey, prompt);
      return prompt;
    } catch {
      throw new BusinessException(40001, `Prompt 模板 ${templateKey} 不存在`);
    }
  }
}
