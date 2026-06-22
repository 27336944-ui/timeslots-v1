import { toLocalTime } from './date';
import type { BlockDisplay } from '../types/block';

const MIN_CARD_HEIGHT = 60;
const HEIGHT_PER_MINUTE = 1.5;

interface ClampedRange {
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  totalMin: number;
  isCrossDay: boolean;
}

const CATEGORY_CLASS: Record<string, string> = { work: 'tag-work', life: 'tag-life', private: 'tag-private' };

/** Clamp block time to a single calendar date. */
export function getClampedRange(
  block: { startTime: string; endTime: string },
  dateStr: string,
): ClampedRange | null {
  const dateStart = new Date(dateStr + 'T00:00:00+08:00');
  const dateEnd = new Date(dateStr + 'T23:59:59+08:00');
  const blockStart = new Date(block.startTime);
  const blockEnd = new Date(block.endTime);
  if (blockEnd <= dateStart || blockStart >= dateEnd) return null;
  const effectiveStart = blockStart < dateStart ? dateStart : blockStart;
  const effectiveEnd = blockEnd > dateEnd ? dateEnd : blockEnd;
  const totalMin = (effectiveEnd.getTime() - effectiveStart.getTime()) / 60000;
  const fmt = (d: Date) =>
    d.toLocaleTimeString('en-CA', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  const [sh, sm] = fmt(effectiveStart).split(':').map(Number);
  const [eh, em] = fmt(effectiveEnd).split(':').map(Number);
  return { startHour: sh, startMin: sm, endHour: eh, endMin: em, totalMin, isCrossDay: blockStart < dateStart || blockEnd > dateEnd };
}

/** Group blocks by hour slot within a day. */
export function groupByHour(
  blocks: BlockDisplay[],
  dateStr: string,
  dayStartHour: number,
): { hour: number; label: string; blocks: BlockDisplay[] }[] {
  const grops: { hour: number; label: string; blocks: BlockDisplay[] }[] = [];
  for (let h = dayStartHour; h < 24; h++) {
    const hourBlocks: BlockDisplay[] = [];
    for (const b of blocks) {
      const range = getClampedRange(b, dateStr);
      if (!range || range.startHour !== h) continue;
      hourBlocks.push({
        ...b,
        localStart: toLocalTime(b.startTime),
        localEnd: toLocalTime(b.endTime),
        categoryClass: CATEGORY_CLASS[b.category] || 'tag-life',
        blockHeight: Math.max(MIN_CARD_HEIGHT, Math.round(range.totalMin * HEIGHT_PER_MINUTE)),
        isCrossDay: range.isCrossDay,
        sourceLabel:
          b.source === 'step'
            ? '步骤'
            : b.source === 'approval'
              ? '邀约'
              : b.source === 'template'
                ? '模板'
                : b.source === 'flexible'
                  ? '弹性'
                  : '',
      } as BlockDisplay);
    }
    grops.push({ hour: h, label: `${String(h).padStart(2, '0')}:00`, blocks: hourBlocks });
  }
  return grops;
}

/** Auto-expand hours that contain blocks. */
export function autoExpandHours(groups: { hour: number; blocks: unknown[] }[]): Record<number, boolean> {
  const expanded: Record<number, boolean> = {};
  for (const g of groups) {
    if (g.blocks.length > 0) expanded[g.hour] = true;
  }
  return expanded;
}

/** Filter groups to only those containing blocks. */
export function getCompactGroups(
  groups: { hour: number; label: string; blocks: BlockDisplay[] }[],
): { hour: number; label: string; blocks: BlockDisplay[] }[] {
  return groups.filter((g) => g.blocks.length > 0);
}

export { MIN_CARD_HEIGHT, HEIGHT_PER_MINUTE };
