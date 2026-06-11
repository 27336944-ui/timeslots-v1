import type { BlockInput } from './fragmentation';

export interface DeviationResult {
  rate: number;
  isSignificant: boolean;
}

export function calcDeviation(blocks: BlockInput[]): DeviationResult {
  let totalPlanned = 0;
  let totalDeviation = 0;
  let validBlocks = 0;

  for (const b of blocks) {
    if (b.actualDurationMinutes == null) continue;
    const planned = (b.endTime.getTime() - b.startTime.getTime()) / 60000;
    if (planned <= 0) continue;
    totalPlanned += planned;
    totalDeviation += Math.abs(b.actualDurationMinutes - planned);
    validBlocks++;
  }

  if (validBlocks === 0 || totalPlanned === 0) {
    return { rate: 0, isSignificant: false };
  }

  const rate = totalDeviation / totalPlanned;
  return { rate, isSignificant: rate > 0.3 };
}
