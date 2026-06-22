import { getNamecard } from '../../../services/api';
import type { NamecardResponse } from '../../../types/api';
import { logError } from '../../../utils/logError';

interface DayBar {
  date: string;
  dayLabel: string;
  freeCount: number;
  ratio: number;
}

function isHourFree(freeSlots: Array<{ start: string; end: string }>, dateStr: string, hour: number): boolean {
  const slotStart = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00+08:00`).getTime();
  const slotEnd = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:59:59+08:00`).getTime();
  for (const fs of freeSlots) {
    const fsStart = new Date(fs.start).getTime();
    const fsEnd = new Date(fs.end).getTime();
    if (slotStart < fsEnd && slotEnd > fsStart) return true;
  }
  return false;
}

interface NamecardPageData {
  selectedDate: string;
  totalHours: number;
  freeHours: number;
  busyHours: number;
  avgBlockDuration: number;
  days: DayBar[];
  loading: boolean;
  generating: boolean;
  posterReady: boolean;
  rawData: NamecardResponse | null;
}

interface NamecardPageMethods {
  onDateChange: (e: WechatMiniprogram.TouchEvent) => void;
  loadData: () => void;
  onGeneratePoster: () => void;
  onSavePoster: () => void;
  _tempFilePath: string;
}

Page<NamecardPageData, NamecardPageMethods>({
  data: {
    selectedDate: '',
    totalHours: 0,
    freeHours: 0,
    busyHours: 0,
    avgBlockDuration: 0,
    days: [],
    loading: false,
    generating: false,
    posterReady: false,
    rawData: null,
  },

  _tempFilePath: '',

  onLoad() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    this.setData({ selectedDate: `${y}-${m}-${d}` });
    this.loadData();
  },

  onDateChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ selectedDate: e.detail.value });
    this.loadData();
  },

  async loadData() {
    const date = this.data.selectedDate;
    if (!date) return;
    this.setData({ loading: true });
    try {
      const res = await getNamecard(date);
      const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
      const days: DayBar[] = res.weeklyHeatmap.map((d) => {
        const dt = new Date(d.date);
        const freeMin = d.freeSlots.reduce((sum, s) => {
          const start = new Date(s.start);
          const end = new Date(s.end);
          return sum + (end.getTime() - start.getTime()) / 60000;
        }, 0);
        const ratio = Math.min((freeMin / (24 * 60)) * 100, 100);
        return {
          date: d.date,
          dayLabel: `周${dayNames[dt.getDay()]}`,
          freeCount: d.freeSlots.length,
          ratio: Math.round(ratio * 10) / 10,
        };
      });

      this.setData({
        totalHours: Math.round(res.totalHours * 10) / 10,
        freeHours: Math.round(res.freeHours * 10) / 10,
        busyHours: Math.round(res.busyHours * 10) / 10,
        avgBlockDuration: Math.round(res.avgBlockDuration),
        days,
        rawData: res,
        loading: false,
      });
    } catch (e) {
      logError('mine_namecard', e);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  async onGeneratePoster() {
    this.setData({ generating: true });
    try {
      const d = new Date(this.data.selectedDate);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const query = wx.createSelectorQuery();
      const canvasNode = await new Promise<WechatMiniprogram.IAnyObject>((resolve) => {
        query.select('#posterCanvas').fields({ node: true, size: true }).exec((res) => {
          resolve(res[0].node as WechatMiniprogram.IAnyObject);
        });
      });

      const { width } = await new Promise<WechatMiniprogram.BoundingClientRectResult>((resolve) => {
        query.select('#posterCanvas').boundingClientRect((rect) => {
          resolve(rect);
        }).exec();
      });

      const ctx = (canvasNode as unknown as { getContext: (t: string) => WechatMiniprogram.CanvasRenderingContext.CanvasRenderingContext2D }).getContext('2d');

      const pixelRatio = wx.getSystemInfoSync().pixelRatio;

      ctx.scale(pixelRatio, pixelRatio);

      const W = width;
      // header
      ctx.fillStyle = '#10B981';
      ctx.fillRect(0, 0, W, 160);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('时间名片', W / 2, 50);
      ctx.font = '16px sans-serif';
      ctx.fillText(dateStr, W / 2, 85);

      ctx.font = '14px sans-serif';
      ctx.fillText(`空闲 ${this.data.freeHours}h  ·  忙碌 ${this.data.busyHours}h  ·  平均块长 ${this.data.avgBlockDuration}分`, W / 2, 120);

      // heatmap: 7 days x 24 hours
      const cellSize = 12;
      const gap = 2;
      const gridLeft = 70;
      const gridTop = 190;
      const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];
      const rawData = this.data.rawData;

      if (rawData) {
        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
          // day label
          ctx.fillStyle = '#1F2937';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(dayLabels[dayIdx] || '', gridLeft - 8, gridTop + dayIdx * (cellSize + gap) + cellSize - 2);

          for (let hour = 0; hour < 24; hour++) {
            const x = gridLeft + hour * (cellSize + gap);
            const y = gridTop + dayIdx * (cellSize + gap);

            const dayData = rawData.weeklyHeatmap[dayIdx];
            if (!dayData) {
              ctx.fillStyle = '#F3F4F6';
            } else {
              const isFree = isHourFree(dayData.freeSlots, dayData.date, hour);
              ctx.fillStyle = isFree ? '#D1FAE5' : '#FEE2E2';
            }
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        }

        // hour labels
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        for (let hour = 0; hour < 24; hour += 4) {
          ctx.fillText(`${hour}时`, gridLeft + hour * (cellSize + gap) + cellSize / 2, gridTop + 7 * (cellSize + gap) + 16);
        }
      }

      // stats summary
      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      const summaryY = gridTop + 7 * (cellSize + gap) + 48;
      ctx.fillText(`总时间${this.data.totalHours}h`, 24, summaryY);
      ctx.fillText(`空闲 ${this.data.freeHours}h`, 140, summaryY);
      ctx.fillText(`忙碌 ${this.data.busyHours}h`, 256, summaryY);
      ctx.fillText(`平均块长 ${this.data.avgBlockDuration}分`, 372, summaryY);

      this._tempFilePath = '';
      this.setData({ generating: false, posterReady: true });
      wx.showToast({ title: '海报已生成', icon: 'success' });
    } catch (e) {
      logError('mine_namecard', e);
      this.setData({ generating: false });
      wx.showToast({ title: '生成失败', icon: 'none' });
    }
  },

  async onSavePoster() {
    if (!this._tempFilePath) {
      try {
        const tempPath = await new Promise<string>((resolve, reject) => {
          wx.canvasToTempFilePath({
            canvasId: 'posterCanvas',
            success: (res) => resolve(res.tempFilePath),
            fail: reject,
          });
        });
        this._tempFilePath = tempPath;
      } catch (e) {
        logError('mine_namecard', e);
        wx.showToast({ title: '生成图片失败', icon: 'none' });
        return;
      }
    }

    wx.showActionSheet({
      itemList: ['保存到相册', '分享给微信好友'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.saveImageToPhotosAlbum({
            filePath: this._tempFilePath,
            success: () => wx.showToast({ title: '已保存', icon: 'success' }),
            fail: () => wx.showToast({ title: '保存失败', icon: 'none' }),
          });
        } else if (res.tapIndex === 1) {
          wx.shareFileMessage({
            filePath: this._tempFilePath,
            fail: () => wx.showToast({ title: '分享失败', icon: 'none' }),
          });
        }
      },
    });
  },
});
