
import { blockStore } from '../../../stores/blockStore';
import { getBlockById } from '../../../services/api';
import type { TimeBlock } from '../../../types/api';


function toLocalTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-CA', { timeZone: 'Asia/Shanghai', hour12: false, hour: '2-digit', minute: '2-digit' });
}

function toLocalDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toISO(dateStr: string, timeStr: string): string {
  const d = new Date(`${dateStr}T${timeStr}:00+08:00`);
  return d.toISOString();
}

const CATEGORY_LABELS: Record<string, string> = { work: '工作', life: '生活', private: '私有' };
const PRIORITY_LABELS: Record<string, string> = { high: '高', medium: '中', low: '低' };
const RECURRENCE_LABELS: Record<string, string> = { none: '不重复', daily: '每天', weekly: '每周', monthly: '每月', yearly: '每年' };


interface DetailPageData {
  mode: 'create' | 'edit' | 'view';
  blockId: string;
  taskId: string;
  originalDate: string;
  viewTitle: string;
  viewTimeRange: string;
  viewStatus: string;
  viewLocation: string;
  viewDescription: string;
  viewPriority: string;
  viewCategory: string;
  viewRecurrence: string;
  viewContacts: string;
  viewWeather: string;
  viewCreatedAt: string;
  formTitle: string;
  formDate: string;
  formStartTime: string;
  formEndTime: string;
  formStatus: string;
  formLocation: string;
  formDescription: string;
  formPriority: string;
  formCategory: string;
  formRecurrence: string;
  formContacts: string;
  formWeather: string;
  saving: boolean;
}

interface DetailPageMethods {
  onTitleInput: (e: WechatMiniprogram.Input) => void;
  onDateChange: (e: WechatMiniprogram.CustomEvent) => void;
  onStartTimeChange: (e: WechatMiniprogram.CustomEvent) => void;
  onEndTimeChange: (e: WechatMiniprogram.CustomEvent) => void;
  onStatusChange: (e: WechatMiniprogram.TouchEvent) => void;
  onLocationInput: (e: WechatMiniprogram.Input) => void;
  onDescriptionInput: (e: WechatMiniprogram.Input) => void;
  onPriorityChange: (e: WechatMiniprogram.TouchEvent) => void;
  onCategoryChange: (e: WechatMiniprogram.TouchEvent) => void;
  onRecurrenceChange: (e: WechatMiniprogram.TouchEvent) => void;
  onContactsInput: (e: WechatMiniprogram.Input) => void;
  onWeatherInput: (e: WechatMiniprogram.Input) => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onEditTap: () => void;
  populateForm: (block: TimeBlock) => void;
}

Page<DetailPageData, DetailPageMethods>({
  data: {
    mode: 'create',
    blockId: '',
    taskId: '',
    originalDate: '',
    viewTitle: '',
    viewTimeRange: '',
    viewStatus: '',
    viewLocation: '',
    viewDescription: '',
    viewPriority: '',
    viewCategory: '',
    viewRecurrence: '',
    viewContacts: '',
    viewWeather: '',
    viewCreatedAt: '',
    formTitle: '',
    formDate: '',
    formStartTime: '',
    formEndTime: '',
    formStatus: 'todo',
    formLocation: '',
    formDescription: '',
    formPriority: 'medium',
    formCategory: 'life',
    formRecurrence: 'none',
    formContacts: '',
    formWeather: '',
    saving: false,
  },

  async onLoad(options: Record<string, string>) {
    if (options.taskId) {
      this.setData({ mode: 'create', formDate: options.date || todayStr(), taskId: options.taskId });
    } else if (options.id) {
      let block = blockStore.blocks.find((b) => b.id === options.id);
      if (!block) {
        try {
          block = await getBlockById(options.id);
        } catch {
          wx.showToast({ title: '日程不存在', icon: 'error' });
          setTimeout(() => wx.navigateBack(), 1500);
          return;
        }
      }
      this.populateForm(block);
      this.setData({
        mode: 'view',
        viewTitle: block.title,
        viewTimeRange: `${toLocalTime(block.startTime)} - ${toLocalTime(block.endTime)}`,
        viewStatus: block.status,
        viewLocation: block.location || '',
        viewDescription: block.description || '',
        viewPriority: PRIORITY_LABELS[block.priority] || block.priority,
        viewCategory: CATEGORY_LABELS[block.category] || block.category,
        viewRecurrence: RECURRENCE_LABELS[block.recurrence] || block.recurrence,
        viewContacts: block.contacts || '',
        viewWeather: block.weather || '',
        viewCreatedAt: toLocalDate(block.createdAt),
      });
    } else {
      this.setData({
        mode: 'create',
        formDate: options.date || todayStr(),
        formStartTime: options.startTime || '',
        formEndTime: options.endTime || '',
        formStatus: options.status || 'todo',
      });
    }
  },

  onTitleInput(e: WechatMiniprogram.Input) {
    this.setData({ formTitle: e.detail.value });
  },

  onDateChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ formDate: e.detail.value });
  },

  onStartTimeChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ formStartTime: e.detail.value });
  },

  onEndTimeChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ formEndTime: e.detail.value });
  },

  onStatusChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ formStatus: e.currentTarget.dataset.status as string });
  },

  onLocationInput(e: WechatMiniprogram.Input) {
    this.setData({ formLocation: e.detail.value });
  },

  onDescriptionInput(e: WechatMiniprogram.Input) {
    this.setData({ formDescription: e.detail.value });
  },

  onPriorityChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ formPriority: e.currentTarget.dataset.value as string });
  },

  onCategoryChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ formCategory: e.currentTarget.dataset.value as string });
  },

  onRecurrenceChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ formRecurrence: e.currentTarget.dataset.value as string });
  },

  onContactsInput(e: WechatMiniprogram.Input) {
    this.setData({ formContacts: e.detail.value });
  },

  onWeatherInput(e: WechatMiniprogram.Input) {
    this.setData({ formWeather: e.detail.value });
  },

  async onSave() {
    if (this.data.saving) return;
    const {
      formTitle, formDate, formStartTime, formEndTime, formStatus,
      formLocation, formDescription, formPriority, formCategory, formRecurrence,
      formContacts, formWeather, mode, blockId,
    } = this.data;

    if (!formTitle.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (!formStartTime || !formEndTime) {
      wx.showToast({ title: '请选择时间', icon: 'none' });
      return;
    }
    if (formStartTime >= formEndTime) {
      wx.showToast({ title: '结束时间须晚于开始时间', icon: 'none' });
      return;
    }

    this.setData({ saving: true });

    try {
      if (mode === 'create') {
        const startTime = toISO(formDate, formStartTime);
        const endTime = toISO(formDate, formEndTime);
        await blockStore.createBlock({
          title: formTitle,
          startTime,
          endTime,
          status: formStatus,
          location: formLocation || undefined,
          description: formDescription || undefined,
          priority: formPriority,
          category: formCategory,
          recurrence: formRecurrence,
          contacts: formContacts || undefined,
          weather: formWeather || undefined,
          taskId: this.data.taskId || undefined,
        });
        wx.showToast({ title: '创建成功', icon: 'success' });
      } else {
        const data: Record<string, string | undefined> = {};
        if (formTitle !== this.data.viewTitle) data.title = formTitle;
        if (formStatus !== this.data.viewStatus.split('(')[0].trim()) data.status = formStatus;
        const d = this.data.originalDate || formDate;
        if (formStartTime !== '') data.startTime = toISO(d, formStartTime);
        if (formEndTime !== '') data.endTime = toISO(d, formEndTime);
        data.location = formLocation || undefined;
        data.description = formDescription || undefined;
        data.priority = formPriority;
        data.category = formCategory;
        data.recurrence = formRecurrence;
        data.contacts = formContacts || undefined;
        data.weather = formWeather || undefined;
        await blockStore.updateBlock(blockId, data);
        wx.showToast({ title: '保存成功', icon: 'success' });
      }
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      wx.showToast({ title: (e as Error).message || '操作失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  async onDelete() {
    if (this.data.saving) return;
    const { blockId } = this.data;
    const res = await wx.showModal({ title: '确认删除', content: '删除后不可恢复', confirmColor: '#e74c3c' });
    if (!res.confirm) return;

    this.setData({ saving: true });
    try {
      await blockStore.deleteBlock(blockId);
      wx.showToast({ title: '已删除', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (e) {
      wx.showToast({ title: (e as Error).message || '删除失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  },

  onEditTap() {
    const {
      formTitle, formStartTime, formEndTime, formStatus,
      formLocation, formDescription, formPriority, formCategory, formRecurrence,
      formContacts, formWeather,
    } = this.data;
    this.setData({
      mode: 'edit',
      formTitle, formStartTime, formEndTime, formStatus,
      formLocation, formDescription, formPriority, formCategory, formRecurrence,
      formContacts, formWeather,
    });
  },

  populateForm(block: TimeBlock) {
    this.setData({
      blockId: block.id,
      originalDate: toLocalDate(block.startTime),
      formDate: toLocalDate(block.startTime),
      formTitle: block.title,
      formStartTime: toLocalTime(block.startTime),
      formEndTime: toLocalTime(block.endTime),
      formStatus: block.status,
      formLocation: block.location || '',
      formDescription: block.description || '',
      formPriority: block.priority,
      formCategory: block.category,
      formRecurrence: block.recurrence,
      formContacts: block.contacts || '',
      formWeather: block.weather || '',
    });
  },
});
