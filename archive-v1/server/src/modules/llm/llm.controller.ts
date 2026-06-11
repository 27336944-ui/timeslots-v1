import { Controller, Post, Body, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { LlmService } from './llm.service';
import { LlmChatDto } from './dto/llm-chat.dto';

@Controller('api/v1/llm')
@UseGuards(JwtAuthGuard)
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('chat')
  async chat(
    @Body() dto: LlmChatDto,
    @CurrentUser('userId') userId: string,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const observable = this.llmService.chat(dto, userId);

    const subscription = observable.subscribe({
      next: (event: { type: string; data: string }) => {
        if (event.type === 'chunk') {
          res.write(`data: ${JSON.stringify({ content: event.data })}\n\n`);
        } else if (event.type === 'done') {
          res.write(`data: ${event.data}\n\n`);
          res.write('data: [DONE]\n\n');
        }
      },
      complete: () => {
        if (!res.writableEnded) res.end();
      },
      error: (err) => {
        if (!res.writableEnded) {
          const msg = err instanceof Error ? err.message : 'LLM 处理失败';
          const code = err instanceof Object && 'businessCode' in err ? (err as any).businessCode : 50001;
          res.write(`data: ${JSON.stringify({ error: msg, code })}\n\n`);
          res.end();
        }
      },
    });

    res.on('close', () => {
      subscription.unsubscribe();
      if (!res.writableEnded) res.end();
    });
  }

  @Post('sync')
  async sync(
    @Body() dto: LlmChatDto,
    @CurrentUser('userId') userId: string,
  ): Promise<{ content: string; traceId: string }> {
    return this.llmService.chatSync(dto, userId);
  }
}
