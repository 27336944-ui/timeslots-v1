
import { observable, action } from 'mobx-miniprogram';
import { getMyBlocksByDate, getMyBlocksByDateRange, createBlock as apiCreateBlock, updateBlock as apiUpdateBlock, deleteBlock as apiDeleteBlock } from '../services/api';
import { todayStr } from '../utils/date';
import { deduped } from '../utils/request-dedup';
import type { TimeBlock } from '../types/api';
import { errorMsg } from '../utils/error';


interface BlockStore {
  blocks: TimeBlock[];
  loading: boolean;
  refreshing: boolean;
  currentDate: string;
  error: string;
  lastFetchedAt: Record<string, number>;
  fetchByDate: (date: string) => Promise<void>;
  fetchByDateRange: (start: string, end: string) => Promise<Record<string, TimeBlock[]>>;
  createBlock: (data: {
    title: string; startTime: string; endTime: string; status?: string;
    location?: string; description?: string; category?: string;
    categoryId?: string; recurrence?: string; contacts?: string; weather?: string; taskId?: string;
    nature?: string; circleId?: string;
    triggerTime?: string; startDate?: string; endDate?: string;
  }) => Promise<TimeBlock>;
  updateBlock: (id: string, data: {
    title?: string; startTime?: string; endTime?: string; status?: string;
    location?: string; description?: string; category?: string;
    recurrence?: string; contacts?: string; weather?: string; taskId?: string;
    nature?: string; circleId?: string; updateMode?: string;
    triggerTime?: string; startDate?: string; endDate?: string;
  }) => Promise<TimeBlock>;
  deleteBlock: (id: string, updateMode?: string) => Promise<void>;
  clearAll: () => void;
}


export const blockStore: BlockStore = observable({
  blocks: [],
  loading: false,
  refreshing: false,
  currentDate: todayStr(),
  error: '',
  lastFetchedAt: {},

  fetchByDate: action(async function (this: BlockStore, date: string) {
    // SWR: 30s cache window — skip fetch if data is fresh
    const swrKey = `date:${date}`;
    if (this.lastFetchedAt[swrKey] && (this.lastFetchedAt[swrKey] + 30000 > Date.now())) {
      return;
    }
    const hasData = this.blocks.length > 0;
    if (hasData) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }
    this.error = '';
    this.currentDate = date;
    try {
      const raw = await deduped(`/timeblocks/date/${date}`, () => getMyBlocksByDate(date));
      // Merge by id: new items added, existing updated, stale removed
      const newMap = new Map(raw.map((b) => [b.id, b]));
      const merged = this.blocks
        .filter((b) => newMap.has(b.id))
        .map((b) => {
          const fresh = newMap.get(b.id)!;
          return { ...b, ...fresh };
        });
      for (const b of raw) {
        if (!this.blocks.some((x) => x.id === b.id)) merged.push(b);
      }
      this.blocks = merged;
      this.lastFetchedAt[swrKey] = Date.now();
    } catch (e) {
      this.error = errorMsg(e) || '加载失败';
    } finally {
      this.loading = false;
      this.refreshing = false;
    }
  }),

  fetchByDateRange: action(async function (this: BlockStore, start: string, end: string): Promise<Record<string, TimeBlock[]>> {
    const hasData = this.blocks.length > 0;
    if (hasData) {
      this.refreshing = true;
    } else {
      this.loading = true;
    }
    this.error = '';
    try {
      const result = await deduped(
        `/timeblocks/range?start=${start}&end=${end}`,
        () => getMyBlocksByDateRange(start, end),
      );
      return result;
    } catch (e) {
      this.error = errorMsg(e) || '加载失败';
      return {};
    } finally {
      this.loading = false;
      this.refreshing = false;
    }
  }),

  createBlock: action(async function (this: BlockStore, data: {
    title: string; startTime: string; endTime: string; status?: string;
    location?: string; description?: string; category?: string;
    categoryId?: string; recurrence?: string; contacts?: string; weather?: string; taskId?: string;
    nature?: string; circleId?: string;
  }) {
    const block = await apiCreateBlock(data);
    await this.fetchByDate(this.currentDate);
    return block;
  }),

  updateBlock: action(async function (this: BlockStore, id: string, data: {
    title?: string; startTime?: string; endTime?: string; status?: string;
    location?: string; description?: string; category?: string;
    recurrence?: string; contacts?: string; weather?: string; taskId?: string;
    nature?: string; circleId?: string; updateMode?: string;
  }) {
    const block = await apiUpdateBlock(id, data);
    await this.fetchByDate(this.currentDate);
    return block;
  }),

  deleteBlock: action(async function (this: BlockStore, id: string, updateMode?: string) {
    await apiDeleteBlock(id, updateMode);
    await this.fetchByDate(this.currentDate);
  }),

  clearAll: action(function (this: BlockStore) {
    this.blocks.splice(0, this.blocks.length);
  }),
});
