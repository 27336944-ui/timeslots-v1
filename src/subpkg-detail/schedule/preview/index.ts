import { createBlock as apiCreateBlock, createTask } from '../../../services/api';
import { createReminder } from '../../../services/api';
import type { TimeBlock } from '../../../types/api';
import { logError } from '../../../utils/logError';

const CATEGORY_LABELS: Record<string, string> = { work: '工作', life: '生活', private: '自有' };
const NATURE_LABELS: Record<string, string> = { PUBLIC: '公开', PRIVATE: '自有', CIRCLE_ONLY: '圈子可见' };

interface PreviewPageData {
  heroTitle: string;
  heroSubtitle: string;
  heroCategory: string;
  heroBadge: string;
  heroBadgeClass: string;
  viewLocation: string;
  viewDescription: string;
  viewCategory: string;
  saving: boolean;
  showShareSheet: boolean;
}

interface PreviewPageMethods {
  onBack: () => void;
  onConfirm: () => Promise<void>;
  onShare: () => void;
  onShareClose: () => void;
  onShareWechat: () => void;
  onShareMoments: () => void;
  onCopyLink: () => void;
  noop: () => void;
}

Page<PreviewPageData, PreviewPageMethods>({
  data: {
    heroTitle: '',
    heroSubtitle: '',
    heroCategory: 'life',
    heroBadge: '待完成',
    heroBadgeClass: 'todo',
    viewLocation: '',
    viewDescription: '',
    viewCategory: '',
    saving: false,
    showShareSheet: false,
  },

  onLoad() {
    const pending = (getApp().globalData as Record<string, unknown>).pendingBlock as TimeBlock | undefined;
    if (!pending) {
      wx.showToast({ title: '数据丢失，请重新创建', icon: 'error' });
      setTimeout(() => wx.navigateBack({ delta: 2 }), 1500);
      return;
    }

    const categoryLabel = CATEGORY_LABELS[pending.category] || pending.category;
    const natureLabel = NATURE_LABELS[pending.nature] || pending.nature;

    // Build subtitle: date range + trigger time
    const dateParts: string[] = [];
    if (pending.startDate) dateParts.push(pending.startDate);
    if (pending.endDate && pending.endDate !== pending.startDate) dateParts.push(`~ ${pending.endDate}`);
    const dateStr = dateParts.join(' ');
    const triggerTime = pending.triggerTime || '';
    const subtitle = triggerTime
      ? `${dateStr}${dateStr ? ' · ' : ''}触发 ${triggerTime}`
      : dateStr;

    this.setData({
      heroTitle: pending.title,
      heroSubtitle: subtitle,
      heroCategory: pending.category || 'life',
      heroBadge: pending.status === 'done' ? '已完成' : '待完成',
      heroBadgeClass: pending.status === 'done' ? 'done' : 'todo',
      viewLocation: pending.location || '',
      viewDescription: pending.description || '',
      viewCategory: `${categoryLabel}${pending.nature ? ` · ${natureLabel}` : ''}`,
    });
  },

  onBack() {
    wx.navigateBack();
  },

  async onConfirm() {
    if (this.data.saving) return;
    const pending = (getApp().globalData as Record<string, unknown>).pendingBlock as TimeBlock | undefined;
    if (!pending) {
      wx.showToast({ title: '数据丢失', icon: 'error' });
      return;
    }

    this.setData({ saving: true });
    try {
      const isFlexible = !pending.startTime;
      if (isFlexible) {
        const raw = pending as unknown as Record<string, unknown>;
        await createTask({
          title: pending.title,
          status: pending.status || 'pending',
          category: pending.category || 'life',
          estimatedDuration: typeof raw.estimatedDuration === 'number' ? raw.estimatedDuration : undefined,
          startDate: pending.startDate || undefined,
          goal: pending.description || undefined,
        });
      } else {
        await apiCreateBlock({
          title: pending.title,
          startTime: pending.startTime || '',
          endTime: pending.endTime || '',
          status: pending.status || 'todo',
          location: pending.location || undefined,
          description: pending.description || undefined,
          category: pending.category || 'life',
          categoryId: pending.categoryId || undefined,
          nature: pending.nature || 'PUBLIC',
          circleId: pending.circleId || undefined,
          triggerTime: pending.triggerTime || undefined,
          startDate: pending.startDate || undefined,
          endDate: pending.endDate || undefined,
          recurrence: pending.recurrence || undefined,
          recurrenceEndAt: pending.recurrenceEndAt || undefined,
          contacts: pending.contacts || undefined,
          weather: pending.weather || undefined,
          taskId: pending.taskId || undefined,
        }).then(async (createdBlock) => {
          // Create reminder if leadMinutes is set
          const leadMinutes = Number((pending as unknown as Record<string, unknown>).reminderLead);
          if (leadMinutes && leadMinutes > 0) {
            try {
              await createReminder({ blockId: createdBlock.id, leadMinutes });
            } catch (e) {
              logError('schedule_preview', e);
              // Reminder creation is non-critical; continue
            }
          }
          return createdBlock;
        });
      }
      wx.showToast({ title: '已创建', icon: 'success' });
      wx.navigateBack({ delta: 2 });
    } catch (e) {
      wx.showToast({ title: (e as Error).message || '创建失败', icon: 'error' });
    } finally {
      this.setData({ saving: false });
    }
  },

  onShare() {
    this.setData({ showShareSheet: true });
  },

  onShareClose() {
    this.setData({ showShareSheet: false });
  },

  onShareWechat() {
    this.onShareClose();
    wx.showToast({ title: '分享到微信', icon: 'none' });
  },

  onShareMoments() {
    this.onShareClose();
    wx.showToast({ title: '分享到朋友圈', icon: 'none' });
  },

  onCopyLink() {
    this.onShareClose();
    wx.setClipboardData({ data: '', success() { wx.showToast({ title: '链接已复制', icon: 'success' }); } });
  },

  noop() {},
});
