export interface BlockInput {
  id: string;
  startTime: Date;
  endTime: Date;
  nature: string;
  actualDurationMinutes: number | null;
  isBusy: boolean;
}

export interface FragmentationResult {
  count: number;
  severity: 'none' | 'low' | 'medium' | 'high';
}

export function calcFragmentation(blocks: BlockInput[]): FragmentationResult {
  const sorted = [...blocks].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  let count = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gapMinutes = (sorted[i].startTime.getTime() - sorted[i - 1].endTime.getTime()) / 60000;
    if (gapMinutes > 30 && gapMinutes < 120) {
      count++;
    }
  }

  let severity: FragmentationResult['severity'] = 'none';
  if (count >= 3) severity = 'high';
  else if (count >= 1) severity = 'medium';
  else if (count > 0) severity = 'low';

  return { count, severity };
}
