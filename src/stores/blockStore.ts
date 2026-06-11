
import { observable, action } from 'mobx-miniprogram';
import { getMyBlocksByDate, createBlock as apiCreateBlock, updateBlock as apiUpdateBlock, deleteBlock as apiDeleteBlock } from '../services/api';
import type { TimeBlock } from '../types/api';


interface BlockStore {
  blocks: TimeBlock[];
  loading: boolean;
  currentDate: string;
  error: string;
  fetchByDate: (date: string) => Promise<void>;
  createBlock: (data: {
    title: string; startTime: string; endTime: string; status?: string;
    location?: string; description?: string; priority?: string; category?: string;
    recurrence?: string; contacts?: string; weather?: string; taskId?: string;
  }) => Promise<TimeBlock>;
  updateBlock: (id: string, data: {
    title?: string; startTime?: string; endTime?: string; status?: string;
    location?: string; description?: string; priority?: string; category?: string;
    recurrence?: string; contacts?: string; weather?: string;
  }) => Promise<TimeBlock>;
  deleteBlock: (id: string) => Promise<void>;
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}


export const blockStore: BlockStore = observable({
  blocks: [],
  loading: false,
  currentDate: todayStr(),
  error: '',

  fetchByDate: action(async function (this: BlockStore, date: string) {
    this.loading = true;
    this.error = '';
    this.currentDate = date;
    try {
      this.blocks = await getMyBlocksByDate(date);
    } catch (e) {
      this.error = (e as Error).message || '加载失败';
      this.blocks = [];
    } finally {
      this.loading = false;
    }
  }),

  createBlock: action(async function (this: BlockStore, data: {
    title: string; startTime: string; endTime: string; status?: string;
    location?: string; description?: string; priority?: string; category?: string;
    recurrence?: string; contacts?: string; weather?: string; taskId?: string;
  }) {
    const block = await apiCreateBlock(data);
    await this.fetchByDate(this.currentDate);
    return block;
  }),

  updateBlock: action(async function (this: BlockStore, id: string, data: {
    title?: string; startTime?: string; endTime?: string; status?: string;
    location?: string; description?: string; priority?: string; category?: string;
    recurrence?: string; contacts?: string; weather?: string;
  }) {
    const block = await apiUpdateBlock(id, data);
    await this.fetchByDate(this.currentDate);
    return block;
  }),

  deleteBlock: action(async function (this: BlockStore, id: string) {
    await apiDeleteBlock(id);
    await this.fetchByDate(this.currentDate);
  }),
});
