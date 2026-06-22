/**
 * compact-header — 统一的 tab 页紧凑头部
 *
 * 结构：日期标题 + 搜索/添加按钮 + overview 概览（slot）+ 周日历条
 * sticky 行为统一：position: sticky; top: 0; z-index: 11
 *
 * Props:
 *   date        — 日期标题文字（如 "6月16日"）
 *   weekDays    — 周日历数据 [{ dateStr, dayLabel, dateNum, isToday, festival }]
 *   selectedDay — 当前选中的日期 dateStr
 *
 * Slot:
 *   overview    — 概览面板内容（各页自定义统计文案）
 *
 * Events:
 *   search      — 点击搜索按钮
 *   plus        — 点击添加按钮
 *   weekdaytap  — 点击某一天，detail: { dateStr }
 */
Component({
  properties: {
    date: {
      type: String,
      value: ''
    },
    weekDays: {
      type: Array,
      value: [] as Array<Record<string, unknown>>
    },
    selectedDay: {
      type: String,
      value: ''
    }
  },

  methods: {
    onSearchTap() {
      this.triggerEvent('search');
    },
    onPlusTap() {
      this.triggerEvent('plus');
    },
    onWeekDayTap(e: WechatMiniprogram.TouchEvent) {
      const dateStr = (e.currentTarget.dataset as { date?: string }).date || '';
      this.triggerEvent('weekdaytap', { dateStr });
    }
  }
});
