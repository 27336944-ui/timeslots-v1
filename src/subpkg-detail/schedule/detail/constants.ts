export const RECURRENCE_LABELS: Record<string, string> = { none: '不重复', daily: '每天', weekly: '每周', monthly: '每月', yearly: '每年' };
export const NATURE_LABELS: Record<string, string> = { PUBLIC: '公开', PRIVATE: '自有', CIRCLE_ONLY: '圈子可见' };
export const REMINDER_OPTIONS = [
  { value: 0, label: '无提醒' },
  { value: 5, label: '5 分钟前' },
  { value: 15, label: '15 分钟前' },
  { value: 30, label: '30 分钟前' },
  { value: 60, label: '1 小时前' },
];
export const RIGIDITY_OPTIONS = [
  { label: '弹性任务', value: '' },
  { label: '刚性任务', value: 'absolute' },
];
