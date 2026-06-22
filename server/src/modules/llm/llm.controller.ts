import { Controller, Post, Body, UseGuards, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EventLogService } from '../eventlog/event-log.service';
import { LlmService } from './llm.service';
import { DecomposeRequestDto } from './dto/decompose-request.dto';
import { ParseDto } from './dto/parse.dto';
import { ParseResponseDto } from './dto/parse-response.dto';


interface SseMessageEvent {
  data: string;
  id?: string;
  type?: string;
  retry?: number;
}


@Controller('api/v1/ai')
@UseGuards(JwtAuthGuard)
export class LlmController {
  constructor(
    private readonly llmService: LlmService,
    private readonly eventLog: EventLogService,
  ) {}

  @Post('parse')
  async parse(
    @CurrentUser('userId') userId: string,
    @Body() dto: ParseDto,
  ): Promise<ParseResponseDto> {
    const result = await this.llmService.parse(dto);
    this.eventLog.log(userId, 'ai_parse', { source: 'text_input' }).catch((e: unknown) => console.error('[eventLog] ai_parse failed', e));
    return result;
  }

  @Post('decompose')
  @Sse()
  async decompose(
    @CurrentUser('userId') userId: string,
    @Body() dto: DecomposeRequestDto,
  ): Promise<Observable<SseMessageEvent>> {
    const result = await this.llmService.decompose(userId, dto);
    this.eventLog.log(userId, 'ai_decompose', { taskTitle: dto.title?.slice(0, 50) }).catch((e: unknown) => console.error('[eventLog] ai_decompose failed', e));

    const steps = result.steps;

    return new Observable<SseMessageEvent>((subscriber) => {
      let idx = 0;

      const emitNext = () => {
        if (idx >= steps.length) {
          subscriber.next({
            type: 'done',
            data: JSON.stringify({ totalMinutes: result.totalMinutes, rationale: result.rationale }),
          });
          subscriber.complete();
          return;
        }

        const step = steps[idx];
        subscriber.next({
          type: 'step',
          id: String(idx),
          data: JSON.stringify({
            index: idx,
            text: step.text,
            estimatedMinutes: step.estimatedMinutes,
            dependsOnIndex: step.dependsOnIndex,
          }),
        });
        idx++;
        setTimeout(emitNext, 100);
      };

      emitNext();
    });
  }
}
