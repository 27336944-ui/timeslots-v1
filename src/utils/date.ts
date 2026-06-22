
/** 将日期格式化为 YYYY-MM-DD（使用 UTC+8 时区），默认为今天 */
export function formatDate(d?: Date): string {
  const date = d ?? new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const y = parts.find(p => p.type === 'year')?.value ?? '';
  const m = parts.find(p => p.type === 'month')?.value ?? '01';
  const day = parts.find(p => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${day}`;
}

/** 获取今天日期字符串 YYYY-MM-DD（UTC+8） */
export function todayStr(): string {
  return formatDate();
}

export function toLocalTime(isoStr: string): string {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const hh = parts.find(p => p.type === 'hour')?.value ?? '00';
  const mm = parts.find(p => p.type === 'minute')?.value ?? '00';
  return `${hh}:${mm}`;
}

export function toLocalDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}
