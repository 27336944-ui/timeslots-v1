import { toLocalDate } from './date';
import type { TimeBlock } from '../types/api';

export interface BlockTimeRange {
  /** Always present (NOT NULL) */
  startTime: string;
  /** Always present (NOT NULL) */
  endTime: string;
  /** Fallback to startTime if null */
  triggerTime: string;
  /** Fallback to startTime's date if null */
  startDate: string;
  /** Fallback to endTime's date if null (NOT startTime) */
  endDate: string;
}

/**
 * Round current time to nearest half-hour slot.
 */
export function roundToNearestHalf(isoStr?: string): string {
  if (isoStr) return isoStr;
  const d = new Date();
  const m = d.getMinutes();
  let h = d.getHours();
  if (m >= 45) h += 1;
  const roundedM = m < 15 ? 0 : m < 45 ? 30 : 0;
  return `${String(h).padStart(2, '0')}:${String(roundedM).padStart(2, '0')}`;
}

/**
 * Extract normalized time fields from a TimeBlock.
 * All fields return non-null strings with proper fallbacks.
 *
 * Key fix: formEndDate fallback uses endTime (not startTime).
 */
export function getBlockTimeRange(block: TimeBlock): BlockTimeRange {
  return {
    startTime: block.startTime,
    endTime: block.endTime,
    triggerTime: block.triggerTime || block.startTime,
    startDate: block.startDate ? toLocalDate(block.startDate) : toLocalDate(block.startTime),
    endDate: block.endDate ? toLocalDate(block.endDate) : toLocalDate(block.endTime),
  };
}
