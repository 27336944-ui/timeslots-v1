import { getMyTemplates, applyTemplate } from '../../../services/api';
import type { Template } from '../../../types/api';
import { logError } from '../../../utils/logError';

interface FilterItem {
  label: string;
  value: string;
}

interface ApplyPageData {
  templates: Template[];
  loading: boolean;
  currentFilter: string;
  showDatePicker: boolean;
  applyTemplateId: string;
  applyDate: string;
  filterTypes: FilterItem[];
}

interface ApplyPageMethods {
  loadTemplates: () => void;
  onFilterChange: (e: WechatMiniprogram.TouchEvent) => void;
  onApply: (e: WechatMiniprogram.TouchEvent) => void;
  onCancelPicker: () => void;
  onApplyDateChange: (e: WechatMiniprogram.TouchEvent) => void;
  onConfirmApply: () => void;
}

Page<ApplyPageData, ApplyPageMethods>({
  data: {
    templates: [],
    loading: true,
    currentFilter: '',
    showDatePicker: false,
    applyTemplateId: '',
    applyDate: '',
    filterTypes: [
      { label: '全部', value: '' },
      { label: '任务模板', value: 'task' },
      { label: '日程模板', value: 'timeblock' },
    ],
  },

  onLoad() {
    this.loadTemplates();
  },

  async loadTemplates() {
    this.setData({ loading: true });
    try {
      const type = this.data.currentFilter || undefined;
      const templates = await getMyTemplates(type);
      this.setData({ templates, loading: false });
    } catch (e) {
      logError('templates_apply', e);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onFilterChange(e: WechatMiniprogram.TouchEvent) {
    const value = e.currentTarget.dataset.value as string;
    this.setData({ currentFilter: value });
    this.loadTemplates();
  },

  onApply(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    this.setData({
      showDatePicker: true,
      applyTemplateId: id,
      applyDate: `${y}-${m}-${d}`,
    });
  },

  onCancelPicker() {
    this.setData({ showDatePicker: false });
  },

  onApplyDateChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ applyDate: e.detail.value });
  },

  async onConfirmApply() {
    const { applyTemplateId, applyDate } = this.data;
    if (!applyTemplateId || !applyDate) return;
    this.setData({ showDatePicker: false });
    wx.showLoading({ title: '应用�?..' });
    try {
      await applyTemplate(applyTemplateId, { date: applyDate });
      wx.hideLoading();
      wx.showToast({ title: '应用成功', icon: 'success' });
    } catch (e) {
      logError('templates_apply', e);
      wx.hideLoading();
      wx.showToast({ title: '应用失败', icon: 'none' });
    }
  },
});
