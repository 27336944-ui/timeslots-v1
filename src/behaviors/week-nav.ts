import { getLunarDateStr } from '../utils/lunar';
import { formatDate } from '../utils/date';


const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];


function getCenteredWeek(centerDate: string): { dateStr: string; dayLabel: string; dateNum: number; isToday: boolean; lunarStr: string; festival: string | null }[] {
  const today = formatDate(new Date());
  if (!centerDate || centerDate.length < 10) {
    centerDate = today;
  }
  const center = new Date(centerDate + 'T00:00:00+08:00');
  if (isNaN(center.getTime())) {
    centerDate = today;
    center.setTime(new Date(centerDate + 'T00:00:00+08:00').getTime());
  }
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

function getMonthGrid(year: number, month: number, weekStartsOn: number, today: string): { dateStr: string; dayNum: number; isToday: boolean; isCurrentMonth: boolean; lunarStr: string; festival: string | null }[] {
  const firstDay = new Date(year, month - 1, 1);
  const startDow = (firstDay.getDay() - weekStartsOn + 7) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() - startDow);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const dayN = d.getDate();
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayN).padStart(2, '0')}`;
    const { lunarStr, festival } = getLunarDateStr(y, m, dayN);
    days.push({
      dateStr,
      dayNum: dayN,
      isToday: dateStr === today,
      isCurrentMonth: d.getMonth() + 1 === month,
      lunarStr,
      festival,
    });
  }
  return days;
}


export const weekNavData = {
  dateStr: '',
  selectedDay: '',
  weekDays: [] as { dateStr: string; dayLabel: string; dateNum: number; isToday: boolean; lunarStr: string; festival: string | null }[],
  monthDays: [] as { dateStr: string; dayNum: number; isToday: boolean; isCurrentMonth: boolean; lunarStr: string; festival: string | null }[],
  currentMonthStr: '',
  monthWeekDays: ['一', '二', '三', '四', '五', '六', '七'],
  weekStartsOn: 1,
  showMonthCalendar: false,
  headerDateStr: '',
};


export const weekNavMethods = {
  initWeekNav(this: WechatMiniprogram.Page.TrivialInstance, centerDate?: string) {
    const d = centerDate ? new Date(centerDate + 'T00:00:00+08:00') : new Date();
    const dateStr = formatDate(d);
    const weekDays = getCenteredWeek(dateStr);
    this.setData({ dateStr, selectedDay: dateStr, weekDays });
    this.updateHeaderDate();
    this.loadMonthInternal(d.getFullYear(), d.getMonth() + 1);
  },

  loadWeekInternal(this: WechatMiniprogram.Page.TrivialInstance, centerDate: string) {
    const weekDays = getCenteredWeek(centerDate);
    this.setData({ weekDays, selectedDay: centerDate, dateStr: centerDate });
    this.updateHeaderDate();
  },

  onWeekDayTap(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const dateStr = e.currentTarget.dataset.date as string;
    this.loadWeekInternal(dateStr);
  },

  openMonthCalendar(this: WechatMiniprogram.Page.TrivialInstance) {
    const d = this.data.dateStr ? new Date(this.data.dateStr + 'T00:00:00+08:00') : new Date();
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const today = formatDate(new Date());
    const monthDays = getMonthGrid(year, month, this.data.weekStartsOn, today);
    this.setData({
      showMonthCalendar: true,
      monthDays,
      currentMonthStr: `${year}年${month}月`,
    });
  },

  dismissMonthCalendar(this: WechatMiniprogram.Page.TrivialInstance) {
    this.setData({ showMonthCalendar: false });
  },

  onMonthDayTap(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const dateStr = e.currentTarget.dataset.date as string;
    this.setData({ showMonthCalendar: false });
    this.loadWeekInternal(dateStr);
  },

  prevMonth(this: WechatMiniprogram.Page.TrivialInstance) {
    const ds = this.data.currentMonthStr;
    const d = new Date(ds.replace('年', '/').replace('月', '/01'));
    d.setMonth(d.getMonth() - 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const today = formatDate(new Date());
    const monthDays = getMonthGrid(year, month, this.data.weekStartsOn, today);
    this.setData({ monthDays, currentMonthStr: `${year}年${month}月` });
  },

  nextMonth(this: WechatMiniprogram.Page.TrivialInstance) {
    const ds = this.data.currentMonthStr;
    const d = new Date(ds.replace('年', '/').replace('月', '/01'));
    d.setMonth(d.getMonth() + 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const today = formatDate(new Date());
    const monthDays = getMonthGrid(year, month, this.data.weekStartsOn, today);
    this.setData({ monthDays, currentMonthStr: `${year}年${month}月` });
  },

  loadMonthInternal(this: WechatMiniprogram.Page.TrivialInstance, year: number, month: number) {
    const today = formatDate(new Date());
    const monthDays = getMonthGrid(year, month, this.data.weekStartsOn, today);
    this.setData({ monthDays, currentMonthStr: `${year}年${month}月` });
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
