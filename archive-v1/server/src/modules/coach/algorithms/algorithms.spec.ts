import { calcFragmentation, calcDeviation, calcFocus } from './index';
import type { BlockInput } from './fragmentation';

const mkBlock = (overrides: Partial<BlockInput> & { startTime: Date; endTime: Date }): BlockInput => ({
  id: overrides.id ?? 'b1',
  nature: overrides.nature ?? 'PUBLIC',
  actualDurationMinutes: overrides.actualDurationMinutes ?? null,
  isBusy: overrides.isBusy ?? true,
  ...overrides,
});

describe('calcFragmentation', () => {
  it('returns none for empty input', () => {
    expect(calcFragmentation([])).toEqual({ count: 0, severity: 'none' });
  });

  it('returns none for single block', () => {
    const blocks = [mkBlock({ startTime: new Date('2026-06-08T09:00'), endTime: new Date('2026-06-08T10:00') })];
    expect(calcFragmentation(blocks)).toEqual({ count: 0, severity: 'none' });
  });

  it('counts gaps between 30-120 minutes', () => {
    const blocks = [
      mkBlock({ id: 'a', startTime: new Date('2026-06-08T09:00'), endTime: new Date('2026-06-08T10:00') }),
      mkBlock({ id: 'b', startTime: new Date('2026-06-08T11:00'), endTime: new Date('2026-06-08T12:00') }),
    ];
    expect(calcFragmentation(blocks)).toEqual({ count: 1, severity: 'medium' });
  });

  it('ignores gaps <= 30 minutes', () => {
    const blocks = [
      mkBlock({ id: 'a', startTime: new Date('2026-06-08T09:00'), endTime: new Date('2026-06-08T10:00') }),
      mkBlock({ id: 'b', startTime: new Date('2026-06-08T10:15'), endTime: new Date('2026-06-08T11:00') }),
    ];
    expect(calcFragmentation(blocks)).toEqual({ count: 0, severity: 'none' });
  });

  it('ignores gaps >= 120 minutes', () => {
    const blocks = [
      mkBlock({ id: 'a', startTime: new Date('2026-06-08T09:00'), endTime: new Date('2026-06-08T10:00') }),
      mkBlock({ id: 'b', startTime: new Date('2026-06-08T13:00'), endTime: new Date('2026-06-08T14:00') }),
    ];
    expect(calcFragmentation(blocks)).toEqual({ count: 0, severity: 'none' });
  });

  it('classifies 3+ gaps as high severity', () => {
    const t = (h: number) => new Date(`2026-06-08T${h.toString().padStart(2, '0')}:00`);
    const blocks = [
      mkBlock({ id: 'a', startTime: t(8), endTime: t(9) }),
      mkBlock({ id: 'b', startTime: t(10), endTime: t(11) }),
      mkBlock({ id: 'c', startTime: t(12), endTime: t(13) }),
      mkBlock({ id: 'd', startTime: t(14), endTime: t(15) }),
    ];
    expect(calcFragmentation(blocks)).toEqual({ count: 3, severity: 'high' });
  });
});

describe('calcDeviation', () => {
  it('returns zero for no blocks with actualDuration', () => {
    expect(calcDeviation([])).toEqual({ rate: 0, isSignificant: false });
  });

  it('computes deviation correctly', () => {
    const blocks = [
      mkBlock({
        startTime: new Date('2026-06-08T09:00'),
        endTime: new Date('2026-06-08T10:00'),
        actualDurationMinutes: 50,
      }),
    ];
    const result = calcDeviation(blocks);
    expect(result.rate).toBeCloseTo(10 / 60, 5);
    expect(result.isSignificant).toBe(false);
  });

  it('flags significant deviation when rate > 0.3', () => {
    const blocks = [
      mkBlock({
        startTime: new Date('2026-06-08T09:00'),
        endTime: new Date('2026-06-08T10:00'),
        actualDurationMinutes: 20,
      }),
    ];
    const result = calcDeviation(blocks);
    expect(result.rate).toBeCloseTo(40 / 60, 5);
    expect(result.isSignificant).toBe(true);
  });
});

describe('calcFocus', () => {
  it('returns empty for no work blocks', () => {
    const blocks = [
      mkBlock({
        startTime: new Date('2026-06-08T09:00'),
        endTime: new Date('2026-06-08T10:00'),
        nature: 'PRIVATE',
      }),
    ];
    const r = calcFocus(blocks);
    expect(r.totalWorkMinutes).toBe(0);
    expect(r.ratio).toBe(0);
  });

  it('detects consecutive focused blocks >= 2h', () => {
    const blocks = [
      mkBlock({ id: 'a', startTime: new Date('2026-06-08T09:00'), endTime: new Date('2026-06-08T10:00') }),
      mkBlock({ id: 'b', startTime: new Date('2026-06-08T10:00'), endTime: new Date('2026-06-08T11:30') }),
    ];
    const r = calcFocus(blocks);
    expect(r.totalWorkMinutes).toBe(150);
    expect(r.focusedMinutes).toBe(150);
    expect(r.isHealthy).toBe(true);
  });

  it('ignores non-consecutive short blocks', () => {
    const blocks = [
      mkBlock({ id: 'a', startTime: new Date('2026-06-08T09:00'), endTime: new Date('2026-06-08T10:00') }),
      mkBlock({ id: 'b', startTime: new Date('2026-06-08T11:00'), endTime: new Date('2026-06-08T12:00') }),
    ];
    const r = calcFocus(blocks);
    expect(r.totalWorkMinutes).toBe(120);
    expect(r.focusedMinutes).toBe(0);
    expect(r.isHealthy).toBe(false);
  });
});
