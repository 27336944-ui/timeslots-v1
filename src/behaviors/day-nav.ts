import { blockStore } from '../stores/blockStore';
import { taskStore } from '../stores/taskStore';
import { getSettings } from '../services/api';
import { todayStr, formatDate } from '../utils/date';
import { logError } from '../utils/logError';
import { getLunarDateStr } from '../utils/lunar';
import { DURATION_OPTIONS } from '../utils/config';


const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];


function getCenteredWeek(centerDate: string): { dateStr: string; dayLabel: string; dateNum: number; isToday: boolean; lunarStr: string; festival: string | null }[] {
  if (!centerDate || centerDate.length < 10) {
    centerDate = todayStr();
  }
  const center = new Date(centerDate + 'T00:00:00+08:00');
  if (isNaN(center.getTime())) {
    centerDate = todayStr();
    center.setTime(new Date(centerDate + 'T00:00:00+08:00').getTime());
  }
  const today = todayStr();
  const weekDays = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(center);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const dayN = d.getDate();
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayN).padStart(2, '0')}`;
    const dow = d.getDay();
    const { lunarStr, festival } = getLunarDateStr(y, m, dayN);
    weekDays.push({ dateStr, dayLabel: DAY_LABELS[dow], dateNum: dayN, isToday: dateStr === today, lunarStr, festival });
  }
  return weekDays;
}


export const dayNavData = {
  dateStr: '',
  selectedDay: '',
  currentWeekStart: '',
  weekDays: [] as { dateStr: string; dayLabel: string; dateNum: number; isToday: boolean; lunarStr: string; festival: string | null }[],
  monthDays: [] as { dateStr: string; dayNum: number; isToday: boolean; isCurrentMonth: boolean; lunarStr: string; festival: string | null; blockFillPercent: number; fillLevel: number; fillPercent: number }[],
  currentMonthStr: '',
  monthWeekDays: ['一', '二', '三', '四', '五', '六', '七'],
  viewMode: 'week' as 'week' | 'month',
  weekStartsOn: 1,
  navigating: false,
  dayStartHour: 6,
  showMonthCalendar: false,
  _scrollTop: 0,
  _touchStartY: 0,
  headerDateStr: '',
};


export const dayNavMethods = {
  loadToday(this: WechatMiniprogram.Page.TrivialInstance) {
    const d = new Date();
    const dateStr = formatDate(d);
    this.setData({ dateStr, selectedDay: dateStr, viewMode: 'week' });
    this.updateHeaderDate();
    taskStore.fetchStats().catch((e) => logError('Schedule fetchStats', e));
    const weekDays = getCenteredWeek(dateStr);
    const firstDay = weekDays[0].dateStr;
    const lastDay = weekDays[6].dateStr;
      this.setData({ currentWeekStart: firstDay, weekDays, selectedDay: dateStr });
    blockStore.fetchByDateRange(firstDay, lastDay).then((weekBlocks) => {
      (this as unknown as WechatMiniprogram.Page.TrivialInstance)._weekBlocks = weekBlocks;
      (this as unknown as WechatMiniprogram.Page.TrivialInstance).refreshGroups();
    }).catch((e) => logError('Schedule fetchByDateRange', e));
    this.loadMonthInternal(dateStr);
  },

  async loadSettings(this: WechatMiniprogram.Page.TrivialInstance) {
    if (!this.data.isLoggedIn) {
      this.setData({ dayStartHour: 6 });
      return;
    }
    try {
      const settings = await getSettings();
      const hour = parseInt(settings.dayStartsAt.split(':')[0], 10);
      const didx = DURATION_OPTIONS.findIndex((o) => o.value === settings.defaultDuration);
      const monthWeekDays = settings.weekStartsOn === 0
        ? ['日', '一', '二', '三', '四', '五', '六']
        : ['一', '二', '三', '四', '五', '六', '七'];
      this.setData({
        dayStartHour: isNaN(hour) ? 6 : hour,
        weekStartsOn: settings.weekStartsOn,
        monthWeekDays,
      });
      if ((this as unknown as WechatMiniprogram.Page.TrivialInstance).setQuickCreateDefaults) {
        (this as unknown as WechatMiniprogram.Page.TrivialInstance).setQuickCreateDefaults(settings.defaultDuration, didx);
      }
    } catch (e) {
      logError('day-nav', e);
      this.setData({ dayStartHour: 6 });
    }
  },

  prevDay(this: WechatMiniprogram.Page.TrivialInstance) {
    if (this.data.navigating) return;
    this.setData({ navigating: true });
    const d = new Date(this.data.dateStr + 'T00:00:00+08:00');
    d.setDate(d.getDate() - 1);
    const dateStr = formatDate(d);
    this.setData({ dateStr, selectedDay: dateStr });
    this.updateHeaderDate();
    const weekDays = getCenteredWeek(dateStr);
    const firstDay = weekDays[0].dateStr;
    const lastDay = weekDays[6].dateStr;
    this.setData({ currentWeekStart: firstDay, weekDays, selectedDay: dateStr });
    blockStore.fetchByDateRange(firstDay, lastDay).then((weekBlocks) => {
      (this as unknown as WechatMiniprogram.Page.TrivialInstance)._weekBlocks = weekBlocks;
      (this as unknown as WechatMiniprogram.Page.TrivialInstance).refreshGroups();
      this.setData({ navigating: false });
    }).catch((e) => {
      logError('Schedule prevDay', e);
      this.setData({ navigating: false });
    });
  },

  nextDay(this: WechatMiniprogram.Page.TrivialInstance) {
    if (this.data.navigating) return;
    this.setData({ navigating: true });
    const d = new Date(this.data.dateStr + 'T00:00:00+08:00');
    d.setDate(d.getDate() + 1);
    const dateStr = formatDate(d);
    this.setData({ dateStr, selectedDay: dateStr });
    this.updateHeaderDate();
    const weekDays = getCenteredWeek(dateStr);
    const firstDay = weekDays[0].dateStr;
    const lastDay = weekDays[6].dateStr;
    this.setData({ currentWeekStart: firstDay, weekDays, selectedDay: dateStr });
    blockStore.fetchByDateRange(firstDay, lastDay).then((weekBlocks) => {
      (this as unknown as WechatMiniprogram.Page.TrivialInstance)._weekBlocks = weekBlocks;
      (this as unknown as WechatMiniprogram.Page.TrivialInstance).refreshGroups();
      this.setData({ navigating: false });
    }).catch((e) => {
      logError('Schedule nextDay', e);
      this.setData({ navigating: false });
    });
  },

  async onRefresh(this: WechatMiniprogram.Page.TrivialInstance) {
    const ds = this.data.dateStr || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    if (this.data.currentWeekStart && this.data.weekDays[6]?.dateStr) {
      const start = this.data.currentWeekStart;
      const end = this.data.weekDays[6].dateStr;
      try {
        await blockStore.fetchByDateRange(start, end);
        if (this.data.dateStr) {
          (this as unknown as WechatMiniprogram.Page.TrivialInstance).refreshGroups();
        }
      } catch (e) {
        logError('Schedule onRefresh', e);
      }
      return;
    }
    try {
      await blockStore.fetchByDate(ds);
      if (this.data.dateStr) {
        (this as unknown as WechatMiniprogram.Page.TrivialInstance).refreshGroups();
      }
    } catch (e) {
      logError('Schedule onRefresh', e);
    }
  },

  openMonthCalendar(this: WechatMiniprogram.Page.TrivialInstance) {
    const d = this.data.dateStr ? new Date(this.data.dateStr + 'T00:00:00+08:00') : new Date();
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    this.loadMonth(year, month);
    this.setData({ showMonthCalendar: true });
  },

  dismissMonthCalendar(this: WechatMiniprogram.Page.TrivialInstance) {
    this.setData({ showMonthCalendar: false });
  },

  async loadWeek(this: WechatMiniprogram.Page.TrivialInstance, centerDate: string) {
    if (!centerDate || centerDate.length < 10) {
      centerDate = todayStr();
    }
    const weekDays = getCenteredWeek(centerDate);
    const firstDay = weekDays[0].dateStr;
    const lastDay = weekDays[6].dateStr;
    if (!firstDay || !lastDay) {
      return;
    }
    (this as unknown as WechatMiniprogram.Page.TrivialInstance)._weekBlocks = await blockStore.fetchByDateRange(firstDay, lastDay);
    this.setData({ currentWeekStart: firstDay, weekDays, selectedDay: centerDate, dateStr: centerDate, viewMode: 'week' });
    this.updateHeaderDate();
    (this as unknown as WechatMiniprogram.Page.TrivialInstance).refreshGroups();
  },

  prevWeek(this: WechatMiniprogram.Page.TrivialInstance) {
    if (this.data.navigating) return;
    this.setData({ navigating: true });
    const d = new Date(this.data.dateStr + 'T00:00:00+08:00');
    if (isNaN(d.getTime())) { d.setTime(Date.now()); }
    d.setDate(d.getDate() - 7);
    this.loadWeek(formatDate(d)).then(() => {
      this.setData({ navigating: false });
    }).catch((e: unknown) => {
      logError('Schedule prevWeek', e);
      this.setData({ navigating: false });
    });
  },

  nextWeek(this: WechatMiniprogram.Page.TrivialInstance) {
    if (this.data.navigating) return;
    this.setData({ navigating: true });
    const d = new Date(this.data.dateStr + 'T00:00:00+08:00');
    if (isNaN(d.getTime())) { d.setTime(Date.now()); }
    d.setDate(d.getDate() + 7);
    this.loadWeek(formatDate(d)).then(() => {
      this.setData({ navigating: false });
    }).catch((e: unknown) => {
      logError('Schedule nextWeek', e);
      this.setData({ navigating: false });
    });
  },

  onWeekDayTap(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const dateStr = e.currentTarget.dataset.date as string;
    this.loadWeek(dateStr);
  },

  prevMonth(this: WechatMiniprogram.Page.TrivialInstance) {
    const d = new Date(this.data.currentMonthStr.replace('年', '/').replace('月', '/01'));
    d.setMonth(d.getMonth() - 1);
    (this as unknown as WechatMiniprogram.Page.TrivialInstance).loadMonth(d.getFullYear(), d.getMonth() + 1);
  },

  nextMonth(this: WechatMiniprogram.Page.TrivialInstance) {
    const d = new Date(this.data.currentMonthStr.replace('年', '/').replace('月', '/01'));
    d.setMonth(d.getMonth() + 1);
    (this as unknown as WechatMiniprogram.Page.TrivialInstance).loadMonth(d.getFullYear(), d.getMonth() + 1);
  },

  async loadMonth(this: WechatMiniprogram.Page.TrivialInstance, year: number, month: number) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
    const ws = this.data.weekStartsOn;
    const startDow = (firstDay.getDay() - ws + 7) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(gridStart.getDate() - startDow);
    const days: { dateStr: string; dayNum: number; isToday: boolean; isCurrentMonth: boolean; lunarStr: string; festival: string | null; blockFillPercent: number; fillLevel: number; fillPercent: number }[] = [];
    const today = todayStr();
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayN = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayN}`;
      const { lunarStr, festival } = getLunarDateStr(y, parseInt(m), parseInt(dayN));
      days.push({
        dateStr,
        dayNum: d.getDate(),
        isToday: dateStr === today,
        isCurrentMonth: d.getMonth() + 1 === month,
        lunarStr,
        festival,
        blockFillPercent: 0,
        fillLevel: 0,
        fillPercent: 0,
      });
    }
    const blocksByDate = await blockStore.fetchByDateRange(startDate, endDate);
    const dayTotalMinutes = 24 * 60;
    for (const day of days) {
      if (!day.isCurrentMonth) continue;
      const dayBlocks = blocksByDate[day.dateStr] || [];
      let occupiedMinutes = 0;
      for (const b of dayBlocks) {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        const dayStart = new Date(`${day.dateStr}T00:00:00+08:00`);
        const dayEnd = new Date(`${day.dateStr}T23:59:59+08:00`);
        const effectiveStart = start < dayStart ? dayStart : start;
        const effectiveEnd = end > dayEnd ? dayEnd : end;
        if (effectiveEnd > effectiveStart) {
          occupiedMinutes += (effectiveEnd.getTime() - effectiveStart.getTime()) / 60000;
        }
      }
      const fillPercent = Math.min(100, Math.round((occupiedMinutes / dayTotalMinutes) * 100));
      day.blockFillPercent = fillPercent;
      // Compute fillLevel for CSS variable mapping: 0=none, 1=20%, 2=40%, 3=60%, 4=80%, 5=100%
      day.fillLevel = fillPercent === 0 ? 0 : Math.ceil(fillPercent / 20);
      day.fillPercent = fillPercent;
    }
    this.setData({ monthDays: days, currentMonthStr: `${year}年${month}月` });
  },

  onMonthDayTap(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const dateStr = e.currentTarget.dataset.date as string;
    this.setData({ showMonthCalendar: false });
    this.loadWeek(dateStr);
  },

  loadMonthInternal(this: WechatMiniprogram.Page.TrivialInstance, centerDate: string) {
    const d = new Date(centerDate + 'T00:00:00+08:00');
    (this as unknown as WechatMiniprogram.Page.TrivialInstance).loadMonth(d.getFullYear(), d.getMonth() + 1);
  },

  updateHeaderDate(this: WechatMiniprogram.Page.TrivialInstance) {
    const ds = this.data.dateStr;
    if (!ds) return;
    const d = new Date(ds + 'T00:00:00+08:00');
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    this.setData({ headerDateStr: `${y}年${m}月` });
  },
};
