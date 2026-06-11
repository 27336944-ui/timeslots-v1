import type { BlockInput } from './fragmentation';

export interface FocusResult {
  ratio: number;
  isHealthy: boolean;
  totalWorkMinutes: number;
  focusedMinutes: number;
}

/**
 * Deep-focus ratio: consecutive ≥ 2h of "work" blocks / total work time.
 *
 * "Work" heuristic for MVP: nature === 'PUBLIC' && isBusy === true.
 * Consecutive: next.startTime <= prev.endTime (back-to-back or overlap).
 */
export function calcFocus(blocks: BlockInput[]): FocusResult {
  const work = blocks
    .filter((b) => b.nature === 'PUBLIC' && b.isBusy)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  if (work.length === 0) {
    return { ratio: 0, isHealthy: false, totalWorkMinutes: 0, focusedMinutes: 0 };
  }

  const totalWorkMinutes = work.reduce((sum, b) => {
    return sum + (b.endTime.getTime() - b.startTime.getTime()) / 60000;
  }, 0);

  let focusedMinutes = 0;
  let seqStart = work[0].startTime.getTime();
  let seqEnd = work[0].endTime.getTime();

  for (let i = 1; i < work.length; i++) {
    const s = work[i].startTime.getTime();
    const e = work[i].endTime.getTime();

    if (s <= seqEnd) {
      seqEnd = Math.max(seqEnd, e);
    } else {
      const seqMinutes = (seqEnd - seqStart) / 60000;
      if (seqMinutes >= 120) focusedMinutes += seqMinutes;
      seqStart = s;
      seqEnd = e;
    }
  }
  const lastMinutes = (seqEnd - seqStart) / 60000;
  if (lastMinutes >= 120) focusedMinutes += lastMinutes;

  const ratio = focusedMinutes / totalWorkMinutes;
  return {
    ratio,
    isHealthy: ratio >= 0.6,
    totalWorkMinutes: Math.round(totalWorkMinutes),
    focusedMinutes: Math.round(focusedMinutes),
  };
}
