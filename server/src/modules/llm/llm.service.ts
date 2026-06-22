import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { DecomposeRequestDto } from './dto/decompose-request.dto';
import { DecomposeResponseDto, DecomposeStepItem } from './dto/decompose-response.dto';
import { ParseDto } from './dto/parse.dto';
import { ParseResponseDto } from './dto/parse-response.dto';


const PROMPT_DIR = path.resolve(__dirname, '../../prompts');

type TaskType = 'report' | 'meeting' | 'dev' | 'household' | 'general';

const PROMPT_FILES: Record<TaskType, string> = {
  report: 'decompose-report.md',
  meeting: 'decompose-meeting.md',
  dev: 'decompose-dev.md',
  household: 'decompose-household.md',
  general: 'decompose-general.md',
};

const KEYWORD_RULES: [RegExp, TaskType][] = [
  [/报告|汇报|总结|分析报告|ppt|周报|月报|年报|述职|发言稿|文案|写.*稿|write.*report/i, 'report'],
  [/会议|meeting|议程|讨论会|评审|头脑风暴|workshop/i, 'meeting'],
  [/开发|编码|编程|实现|部署|测试|重构|代码|api|数据库|前后端|feature|bugfix|feature/i, 'dev'],
  [/家务|打扫|收拾|整理|购物|买菜|搬家|收纳|清洗|做饭|烹饪|装修/i, 'household'],
];


interface MiniMaxResponse {
  id: string;
  choices: {
    finish_reason: string;
    messages: {
      role: string;
      content: string;
    }[];
  }[];
  usage?: {
    total_tokens: number;
  };
}


@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('MINIMAX_API_KEY') || '';
    this.baseUrl = this.configService.get<string>('MINIMAX_BASE_URL') || 'https://api.minimax.chat';
  }

  /**
   * 调用 MiniMax M3 对任务进行拆解。
   * 当前实现：全量等待 MiniMax 返回后解析 JSON。
   * 后续可改为 SSE 流式实时逐条返回（替换 Observable 模式）。
   */
  async parse(dto: ParseDto): Promise<ParseResponseDto> {
    const promptPath = path.join(PROMPT_DIR, 'parse.md');
    let template: string;
    try {
      template = fs.readFileSync(promptPath, 'utf-8');
    } catch {
      this.logger.warn('parse.md prompt 文件缺失，使用 mock');
      return this.mockParse();
    }

    const prompt = template + `\n\n# User Input\n${dto.text}`;
    const raw = await this.callMiniMaxForParse(prompt);
    return this.parseParseResponse(raw);
  }

  async decompose(_userId: string, dto: DecomposeRequestDto): Promise<DecomposeResponseDto> {
    const taskType = this.classifyTaskType(dto.title, dto.goal);
    const prompt = this.buildPrompt(taskType, dto);
    const raw = await this.callMiniMax(prompt);
    return this.parseResponse(raw);
  }

  private classifyTaskType(title: string, goal?: string): TaskType {
    const text = `${title} ${goal || ''}`;
    for (const [regex, type] of KEYWORD_RULES) {
      if (regex.test(text)) return type;
    }
    return 'general';
  }

  private buildPrompt(taskType: TaskType, dto: DecomposeRequestDto): string {
    const filename = PROMPT_FILES[taskType];
    const promptPath = path.join(PROMPT_DIR, filename);
    let template: string;
    try {
      template = fs.readFileSync(promptPath, 'utf-8');
    } catch {
      // 如果 prompt 文件不存在，使用通用模板兜底
      template = fs.readFileSync(path.join(PROMPT_DIR, 'decompose-general.md'), 'utf-8');
    }

    return template
      .replace('{{occupation}}', dto.occupation || '未设置')
      .replace('{{residence}}', dto.residence || '未设置')
      .replace('{{categories}}', '工作、生活、私有')
      .replace('{{freeSlots}}', '暂无空闲数据（v0.45 暂不注入历史日程）')
      + `\n\n# User Request\n任务标题：${dto.title}\n任务目标：${dto.goal || '未指定'}`;
  }

  private async callMiniMaxRaw(prompt: string, userMsg: string, options: { temperature: number; maxTokens: number }): Promise<string> {
    if (!this.apiKey) {
      this.logger.warn('MINIMAX_API_KEY 未配置，返回 mock 结果');
      return JSON.stringify({
        steps: [
          { text: '收集相关资料和信息', estimatedMinutes: 30, dependsOnIndex: -1 },
          { text: '制定执行计划', estimatedMinutes: 20, dependsOnIndex: 0 },
          { text: '分步实施任务', estimatedMinutes: 60, dependsOnIndex: 1 },
          { text: '检查并优化结果', estimatedMinutes: 20, dependsOnIndex: 2 },
          { text: '输出最终成果', estimatedMinutes: 10, dependsOnIndex: 3 },
        ],
        totalMinutes: 140,
        rationale: '按照"收集→计划→执行→检查→输出"的通用工作流程进行拆解。',
      });
    }

    const url = `${this.baseUrl}/v1/text/chatcompletion`;
    const body = {
      model: 'minimax-text-01',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: userMsg },
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text();
        this.logger.error(`MiniMax API error: ${res.status} ${text}`);
        return JSON.stringify({
          steps: [
            { text: '收集相关资料和信息', estimatedMinutes: 30, dependsOnIndex: -1 },
            { text: '制定执行计划', estimatedMinutes: 20, dependsOnIndex: 0 },
            { text: '分步实施任务', estimatedMinutes: 60, dependsOnIndex: 1 },
            { text: '检查并优化结果', estimatedMinutes: 20, dependsOnIndex: 2 },
            { text: '输出最终成果', estimatedMinutes: 10, dependsOnIndex: 3 },
          ],
          totalMinutes: 140,
          rationale: '按照"收集→计划→执行→检查→输出"的通用工作流程进行拆解。',
        });
      }

      const data = await res.json() as MiniMaxResponse;
      const content = data.choices?.[0]?.messages?.[0]?.content;
      if (!content) {
        this.logger.warn('MiniMax 返回空内容，使用 mock');
        return JSON.stringify({
          steps: [
            { text: '收集相关资料和信息', estimatedMinutes: 30, dependsOnIndex: -1 },
            { text: '制定执行计划', estimatedMinutes: 20, dependsOnIndex: 0 },
            { text: '分步实施任务', estimatedMinutes: 60, dependsOnIndex: 1 },
            { text: '检查并优化结果', estimatedMinutes: 20, dependsOnIndex: 2 },
            { text: '输出最终成果', estimatedMinutes: 10, dependsOnIndex: 3 },
          ],
          totalMinutes: 140,
          rationale: '按照"收集→计划→执行→检查→输出"的通用工作流程进行拆解。',
        });
      }
      return content;
    } catch (err) {
      clearTimeout(timeoutId);
      if ((err as Error).name === 'AbortError') {
        this.logger.warn('MiniMax 请求超时（8s），降级为 mock');
      } else {
        this.logger.error('MiniMax API 调用失败', err);
      }
      return JSON.stringify({
        steps: [
          { text: '收集相关资料和信息', estimatedMinutes: 30, dependsOnIndex: -1 },
          { text: '制定执行计划', estimatedMinutes: 20, dependsOnIndex: 0 },
          { text: '分步实施任务', estimatedMinutes: 60, dependsOnIndex: 1 },
          { text: '检查并优化结果', estimatedMinutes: 20, dependsOnIndex: 2 },
          { text: '输出最终成果', estimatedMinutes: 10, dependsOnIndex: 3 },
        ],
        totalMinutes: 140,
        rationale: '按照"收集→计划→执行→检查→输出"的通用工作流程进行拆解。',
      });
    }
  }

  private async callMiniMax(prompt: string): Promise<string> {
    return this.callMiniMaxRaw(prompt, '请根据以上信息对任务进行拆解。', { temperature: 0.7, maxTokens: 2000 });
  }

  private async callMiniMaxForParse(prompt: string): Promise<string> {
    return this.callMiniMaxRaw(prompt, '请解析以上文本。', { temperature: 0.3, maxTokens: 1000 });
  }

  private parseParseResponse(raw: string): ParseResponseDto {
    try {
      const parsed = JSON.parse(raw);
      const validTypes = ['schedule', 'task'] as const;
      const validCategories = ['work', 'life', 'private'] as const;
      const validRecurrence = ['none', 'daily', 'weekdays', 'weekly', 'monthly'] as const;
      return {
        type: validTypes.includes(parsed.type) ? parsed.type : 'schedule',
        title: String(parsed.title || ''),
        startTime: typeof parsed.startTime === 'string' ? parsed.startTime : null,
        endTime: typeof parsed.endTime === 'string' ? parsed.endTime : null,
        recurrence: validRecurrence.includes(parsed.recurrence) ? parsed.recurrence : 'none',
        category: validCategories.includes(parsed.category) ? parsed.category : 'work',
        confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0,
        ambiguous: !!parsed.ambiguous,
        ambiguities: Array.isArray(parsed.ambiguities) ? parsed.ambiguities.filter((a: unknown) => typeof a === 'string') : [],
      };
    } catch {
      this.logger.warn('MiniMax 返回非 JSON 内容，使用 mock');
      return this.mockParse();
    }
  }

  private mockParse(): ParseResponseDto {
    return {
      type: 'schedule',
      title: '新日程',
      startTime: null,
      endTime: null,
      recurrence: 'none',
      category: 'work',
      confidence: 0.3,
      ambiguous: true,
      ambiguities: ['未能解析内容，请手动输入'],
    };
  }

  private mockDecompose(): string {
    return JSON.stringify({
      steps: [
        { text: '收集相关资料和信息', estimatedMinutes: 30, dependsOnIndex: -1 },
        { text: '制定执行计划', estimatedMinutes: 20, dependsOnIndex: 0 },
        { text: '分步实施任务', estimatedMinutes: 60, dependsOnIndex: 1 },
        { text: '检查并优化结果', estimatedMinutes: 20, dependsOnIndex: 2 },
        { text: '输出最终成果', estimatedMinutes: 10, dependsOnIndex: 3 },
      ],
      totalMinutes: 140,
      rationale: '按照"收集→计划→执行→检查→输出"的通用工作流程进行拆解。',
    });
  }

  private parseResponse(raw: string): DecomposeResponseDto {
    try {
      const parsed = JSON.parse(raw);
      const steps: DecomposeStepItem[] = (parsed.steps || []).map((s: Record<string, unknown>) => ({
        text: String(s.text || ''),
        estimatedMinutes: Number(s.estimatedMinutes) || 30,
        dependsOnIndex: typeof s.dependsOnIndex === 'number' ? s.dependsOnIndex : -1,
      }));
      return {
        steps,
        totalMinutes: Number(parsed.totalMinutes) || steps.reduce((sum, s) => sum + s.estimatedMinutes, 0),
        rationale: String(parsed.rationale || ''),
      };
    } catch {
      this.logger.warn(`MiniMax 返回非 JSON 内容，使用 mock (raw length=${raw.length}, prefix=${raw.substring(0, 50)})`);
      return JSON.parse(this.mockDecompose());
    }
  }
}
