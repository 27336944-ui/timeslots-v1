const LUNAR_MONTH_NAMES = ['', '正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
const LUNAR_DAY_NAMES = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

const FESTIVALS: Record<string, string> = {
  '01-01': '春节', '01-15': '元宵节',
  '02-02': '龙抬头',
  '05-05': '端午节',
  '07-07': '七夕节',
  '07-15': '中元节',
  '08-15': '中秋节',
  '09-09': '重阳节',
  '12-30': '除夕', '12-29': '除夕',
};

const SOLAR_FESTIVALS: Record<string, string> = {
  '01-01': '元旦',
  '02-14': '情人节',
  '03-08': '妇女节',
  '04-01': '愚人节',
  '05-01': '劳动节',
  '06-01': '儿童节',
  '10-01': '国庆节',
  '12-25': '圣诞节',
};

function solarTerm(): string {
  const d = new Date();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (m === 4 && (day >= 4 && day <= 6)) return '清明';
  if (m === 1 && (day >= 5 && day <= 7)) return '小寒';
  if (m === 1 && (day >= 20 && day <= 22)) return '大寒';
  return '';
}

const LUNAR_YEAR_INFO: number[] = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x16a95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06aa0, 0x1a6c4, 0x0aae0,
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252,
  0x0d520,
];

function bits(target: number, pos: number, len: number): number {
  return (target >> pos) & ((1 << len) - 1);
}

export function solarToLunar(year: number, month: number, day: number): { lunarYear: number; lunarMonth: number; lunarDay: number; isLeap: boolean } {
  const baseDate = new Date(1900, 0, 31);
  const targetDate = new Date(year, month - 1, day);
  let offset = Math.floor((targetDate.getTime() - baseDate.getTime()) / 86400000);

  let lunarYear = 1900;
  let leapMonth = 0;
  let isLeap = false;

  for (; lunarYear < 2101; lunarYear++) {
    const yearDays = lunarYearDays(lunarYear);
    if (offset < yearDays) break;
    offset -= yearDays;
  }

  if (lunarYear > 2100) return { lunarYear: 0, lunarMonth: 0, lunarDay: 0, isLeap: false };

  const info = LUNAR_YEAR_INFO[lunarYear - 1900];
  leapMonth = bits(info, 0, 4);
  let monthDays = 0;
  let lunarMonth = 1;

  for (; lunarMonth <= 12; lunarMonth++) {
    monthDays = bits(info, 4 + (lunarMonth - 1), 1) ? 30 : 29;
    if (offset < monthDays) break;
    offset -= monthDays;
  }

  if (leapMonth > 0 && lunarMonth > leapMonth) {
    lunarMonth--;
    if (lunarMonth === leapMonth) {
      isLeap = true;
      monthDays = bits(info, 16, 4);
      if (offset >= monthDays) {
        offset -= monthDays;
        isLeap = false;
        lunarMonth++;
        for (; lunarMonth <= 12; lunarMonth++) {
          monthDays = bits(info, 4 + (lunarMonth - 1), 1) ? 30 : 29;
          if (offset < monthDays) break;
          offset -= monthDays;
        }
      }
    }
  }

  return { lunarYear, lunarMonth, lunarDay: offset + 1, isLeap };
}

function lunarYearDays(year: number): number {
  const info = LUNAR_YEAR_INFO[year - 1900];
  let total = 0;
  for (let i = 0; i < 12; i++) {
    total += bits(info, 4 + i, 1) ? 30 : 29;
  }
  const leap = bits(info, 0, 4);
  if (leap > 0) total += bits(info, 16, 4);
  return total;
}

export function formatLunarDay(day: number): string {
  return LUNAR_DAY_NAMES[day] || `${day}日`;
}

export function formatLunarMonth(month: number): string {
  return LUNAR_MONTH_NAMES[month] || `${month}月`;
}

export function getLunarFestival(lunarMonth: number, lunarDay: number): string | null {
  return FESTIVALS[`${String(lunarMonth).padStart(2, '0')}-${String(lunarDay).padStart(2, '0')}`] || null;
}

export function getSolarFestival(month: number, day: number): string | null {
  return SOLAR_FESTIVALS[`${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`] || null;
}

export function getLunarDateStr(year: number, month: number, day: number): { lunarStr: string; festival: string | null } {
  const lunar = solarToLunar(year, month, day);
  const fest = getLunarFestival(lunar.lunarMonth, lunar.lunarDay);
  if (fest) return { lunarStr: fest, festival: fest };
  const solarFest = getSolarFestival(month, day);
  if (solarFest) return { lunarStr: solarFest, festival: solarFest };
  const term = solarTerm();
  if (term) return { lunarStr: term, festival: term };
  return { lunarStr: formatLunarDay(lunar.lunarDay), festival: null };
}
