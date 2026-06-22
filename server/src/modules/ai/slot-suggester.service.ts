import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SuggestSlotsRequestDto, SlotSuggestionDto } from './dto/suggest-slots.dto';


interface StepInput {
  id: string;
  text: string;
  estimatedMinutes: number;
  dependsOnId: string | null;
}


interface TimeSlot {
  start: Date;
  end: Date;
}


const DEFAULT_DAY_START = 8 * 60;
const DEFAULT_DAY_END = 23 * 60;
const DEFAULT_ESTIMATED = 30;
const MIN_SLOT_MINUTES = 10;


@Injectable()
export class SlotSuggesterService {
  constructor(private readonly prisma: PrismaService) {}

  async suggest(dto: SuggestSlotsRequestDto): Promise<SlotSuggestionDto[]> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: dto.userId, isDeleted: false },
      select: { settings: true },
    });

    const settings = user?.settings as Record<string, unknown> | null;
    const dayStartMin = this.parseTime(settings?.dayStartsAt as string | undefined) ?? DEFAULT_DAY_START;
    const dayEndMin = this.parseTime(settings?.dayEndsAt as string | undefined) ?? DEFAULT_DAY_END;

    const existingBlocks = await this.getExistingBlocks(dto.userId, dto.date);
    const freeSlots = this.computeFreeSlots(dto.date, existingBlocks, dayStartMin, dayEndMin);

    const steps: StepInput[] = dto.steps.map((s) => ({
      id: s.id,
      text: s.text,
      estimatedMinutes: s.estimatedMinutes ?? DEFAULT_ESTIMATED,
      dependsOnId: s.dependsOnId ?? null,
    }));

    const sorted = this.topologicalSort(steps);
    const remainingSlots = freeSlots.map((s) => ({ ...s }));
    const results: SlotSuggestionDto[] = [];

    for (const step of sorted) {
      const dep = step.dependsOnId ? sorted.find((s) => s.id === step.dependsOnId) : null;
      const depResult = dep ? results.find((r) => r.stepId === step.dependsOnId) : null;
      const earliestStart = depResult?.suggestedEnd
        ? new Date(depResult.suggestedEnd)
        : new Date(`${dto.date}T00:00:00+08:00`);

      const assignment = this.assignSlot(remainingSlots, earliestStart, step.estimatedMinutes);

      if (assignment) {
        results.push({
          stepId: step.id,
          suggestedStart: assignment.start.toISOString(),
          suggestedEnd: assignment.end.toISOString(),
          reason: depResult
            ? `在「${dep?.text || ''}」之后第一个空闲时段`
            : '当天最早可用时段',
        });
      } else {
        results.push({
          stepId: step.id,
          suggestedStart: null,
          suggestedEnd: null,
          reason: '当天无足够空闲时段，请尝试其他日期',
        });
      }
    }

    return results;
  }

  private async getExistingBlocks(userId: string, date: string): Promise<TimeSlot[]> {
    const dayStart = new Date(`${date}T00:00:00+08:00`);
    const dayEnd = new Date(`${date}T23:59:59+08:00`);

    const blocks = await this.prisma.client.timeBlock.findMany({
      where: {
        userId,
        isDeleted: false,
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      orderBy: { startTime: 'asc' },
      select: { startTime: true, endTime: true },
    });

    return blocks.map((b) => ({
      start: new Date(Math.max(b.startTime.getTime(), dayStart.getTime())),
      end: new Date(Math.min(b.endTime.getTime(), dayEnd.getTime())),
    }));
  }

  private computeFreeSlots(date: string, blocks: TimeSlot[], dayStartMin: number, dayEndMin: number): TimeSlot[] {
    const ref = new Date(`${date}T00:00:00+08:00`).getTime();
    const dayStartMs = ref + dayStartMin * 60000;
    const dayEndMs = ref + dayEndMin * 60000;

    const freeSlots: TimeSlot[] = [];
    let cursor = dayStartMs;

    for (const b of blocks) {
      const bs = Math.max(b.start.getTime(), dayStartMs);
      if (bs > cursor + MIN_SLOT_MINUTES * 60000) {
        freeSlots.push({ start: new Date(cursor), end: new Date(bs) });
      }
      cursor = Math.max(cursor, Math.min(b.end.getTime(), dayEndMs));
    }

    if (dayEndMs > cursor + MIN_SLOT_MINUTES * 60000) {
      freeSlots.push({ start: new Date(cursor), end: new Date(dayEndMs) });
    }

    return freeSlots;
  }

  private assignSlot(remainingSlots: TimeSlot[], earliestStart: Date, durationMinutes: number): TimeSlot | null {
    const durationMs = durationMinutes * 60000;
    const earliestMs = earliestStart.getTime();

    for (let i = 0; i < remainingSlots.length; i++) {
      const slot = remainingSlots[i];
      const slotStart = Math.max(slot.start.getTime(), earliestMs);
      const slotEnd = slot.end.getTime();

      if (slotEnd - slotStart >= durationMs) {
        const assigned = { start: new Date(slotStart), end: new Date(slotStart + durationMs) };

        if (slotStart + durationMs >= slotEnd - MIN_SLOT_MINUTES * 60000) {
          remainingSlots.splice(i, 1);
        } else {
          slot.start = new Date(slotStart + durationMs);
        }

        return assigned;
      }
    }

    return null;
  }

  private topologicalSort(steps: StepInput[]): StepInput[] {
    const sorted: StepInput[] = [];
    const visited = new Set<string>();

    const visit = (step: StepInput): void => {
      if (visited.has(step.id)) return;
      if (step.dependsOnId) {
        const dep = steps.find((s) => s.id === step.dependsOnId);
        if (dep) visit(dep);
      }
      visited.add(step.id);
      sorted.push(step);
    };

    for (const step of steps) visit(step);
    return sorted;
  }

  private parseTime(value: string | undefined): number | null {
    if (!value) return null;
    const parts = value.split(':');
    if (parts.length !== 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }
}
