
import { blockStore } from '../../../stores/blockStore';
import { getBlockById, getRemindersByBlock, getMyCircles, getSettings } from '../../../services/api';
import { initBlockForm, serializeBlockForm } from '../../../utils/block-form';
import { getBlockTimeRange, roundToNearestHalf } from '../../../utils/block-time';
import { ApprovalFormBehavior } from '../../../behaviors/approval-form';
import { storage, REMINDER_SUBSCRIBED } from '../../../utils/storage';
import { APP_CONFIG } from '../../../utils/config';
import { toLocalTime, todayStr, toLocalDate } from '../../../utils/date';
import { CATEGORY_OPTIONS as SHARED_CATEGORY_OPTIONS, CATEGORY_LABELS as SHARED_CATEGORY_LABELS } from '../../../constants/categories';
import { RECURRENCE_LABELS, NATURE_LABELS, REMINDER_OPTIONS, RIGIDITY_OPTIONS } from './constants';
import type { TimeBlock } from '../../../types/api';
import type { Circle } from '../../../types/api';
import { logError } from '../../../utils/logError';


interface DetailPageData {
  mode: 'create' | 'edit' | 'view';
  blockId: string;
  viewTitle: string;
  viewTriggerTime: string;
  viewStatus: string;
  viewLocation: string;
  viewDescription: string;
  viewCategory: string;
  viewCategoryRaw: string;
  viewRecurrence: string;
  viewRecurrenceRaw: string;
  viewContacts: string;
  viewWeather: string;
  viewCreatedAt: string;
  viewReminder: string;
  formTitle: string;
  formTriggerTime: string;
  formStartDate: string;
  formEndDate: string;
  formDuration: string;
  formEstimatedDuration: number;
  formStatus: string;
  formLocation: string;
  formDescription: string;
  formCategory: string;
  formCategoryLabel: string;
  formRecurrence: string;
  formContacts: string;
  formWeather: string;
  formReminderLead: number;
  formReminderId: string;
  formReminderIndex: number;
  formFullDay: boolean;
  formNature: string;
  formCircleId: string;
  formCircleLabel: string;
  showCatPicker: boolean;
  categoryOptions: { label: string; value: string }[];
  categoryLabels: Record<string, string>;
  natureOptions: { label: string; value: string }[];
  circleOptions: { id: string; name: string }[];
  viewNature: string;
  viewNatureRaw: string;
  viewCircleName: string;
  viewCircleId: string;
  reminderLabel: string;
  reminderOptions: { value: number; label: string }[];
  saving: boolean;
  showMoreOptions: boolean;
  showApprovalSheet: boolean;
  approvalPhoneInput: string;
  approvalPhoneList: string[];
  _editSnapshot: Record<string, string>;
  formRigidity: string;
  formBufferBefore: number;
  formBufferAfter: number;
  viewRigidityLabel: string;
  viewBufferLabel: string;
  RIGIDITY_OPTIONS: { label: string; value: string }[];
}

// RIGIDITY_LABELS 已提取至 utils/block-form.ts

interface DetailPageMethods {
  onTitleInput: (e: WechatMiniprogram.Input) => void;
  onTriggerTimeChange: (e: WechatMiniprogram.CustomEvent) => void;
  onStartDateChange: (e: WechatMiniprogram.CustomEvent) => void;
  onEndDateChange: (e: WechatMiniprogram.CustomEvent) => void;
  onStatusChange: (e: WechatMiniprogram.TouchEvent) => void;
  onLocationInput: (e: WechatMiniprogram.Input) => void;
  onDescriptionInput: (e: WechatMiniprogram.Input) => void;
  onRecurrenceChange: (e: WechatMiniprogram.TouchEvent) => void;
  onContactsInput: (e: WechatMiniprogram.Input) => void;
  onWeatherInput: (e: WechatMiniprogram.Input) => void;
  onReminderChange: (e: WechatMiniprogram.CustomEvent) => void;
  onFullDayChange: () => void;
  onNatureChange: (e: WechatMiniprogram.TouchEvent) => void;
  onCircleChange: (e: WechatMiniprogram.CustomEvent) => void;
  onOpenCatPicker: () => void;
  onCloseCatPicker: () => void;
  onCatSelected: (e: WechatMiniprogram.TouchEvent) => void;
  onNatureSegChange: (e: WechatMiniprogram.CustomEvent) => void;
  noop: () => void;
  onPreview: () => Promise<void>;
  onDelete: () => Promise<void>;
  onEditTap: () => void;
  populateForm: (block: TimeBlock) => void;
  loadReminders: (blockId: string) => Promise<void>;
  requestSubscribe: () => Promise<boolean>;
  onApproveTap: () => void;
  onToggleMoreOptions: () => void;
  onApprovalPhoneInput: (e: WechatMiniprogram.Input) => void;
  onApprovalAddPhone: () => void;
  onApprovalRemovePhone: (e: WechatMiniprogram.TouchEvent) => void;
  onApprovalSubmit: () => Promise<void>;
  onApprovalClose: () => void;
  onRigidityChange: (e: WechatMiniprogram.TouchEvent) => void;
  onEstimatedDurationInput: (e: WechatMiniprogram.Input) => void;
  onBufferBeforeInput: (e: WechatMiniprogram.Input) => void;
  onBufferAfterInput: (e: WechatMiniprogram.Input) => void;
}

Page<DetailPageData, DetailPageMethods>({
  // @ts-ignore behaviors is a valid WeChat mini program Page option
  behaviors: [ApprovalFormBehavior],

  data: {
    mode: 'create',
    blockId: '',
    viewTitle: '',
    viewTriggerTime: '',
    viewStatus: '',
    viewLocation: '',
    viewDescription: '',
    viewCategory: '',
    viewCategoryRaw: '',
    viewRecurrence: '',
    viewRecurrenceRaw: '',
    viewContacts: '',
    viewWeather: '',
    viewCreatedAt: '',
    showCatPicker: false,
    formTitle: '',
    formTriggerTime: '',
    formStartDate: '',
    formEndDate: '',
    formDuration: '1h',
    formEstimatedDuration: 0,
    formStatus: 'todo',
    formLocation: '',
    formDescription: '',
    formCategory: 'life',
    formCategoryLabel: '生活',
    formRecurrence: 'none',
    formContacts: '',
    formWeather: '',
    formFullDay: false,
    formNature: 'PUBLIC',
    formCircleId: '',
    formCircleLabel: '',
    categoryOptions: SHARED_CATEGORY_OPTIONS,
    categoryLabels: SHARED_CATEGORY_LABELS,
    natureOptions: [{ label: '公开', value: 'PUBLIC' }, { label: '自有', value: 'PRIVATE' }, { label: '圈子', value: 'CIRCLE_ONLY' }],
    circleOptions: [],
    viewNature: '',
    viewNatureRaw: '',
    viewCircleName: '',
    viewCircleId: '',
    formReminderLead: 0,
    formReminderId: '',
    formReminderIndex: 0,
    reminderLabel: '无提醒',
    viewReminder: '',
    reminderOptions: REMINDER_OPTIONS,

    saving: false,
    showMoreOptions: false,
    showApprovalSheet: false,
    approvalPhoneInput: '',
    approvalPhoneList: [] as string[],
    _editSnapshot: {},
    formRigidity: '',
    formBufferBefore: 0,
    formBufferAfter: 0,
    viewRigidityLabel: '',
    viewBufferLabel: '',
    RIGIDITY_OPTIONS: RIGIDITY_OPTIONS,
  },

  async onLoad(options: Record<string, string>) {
    let circles: Circle[] = [];
    try {
      circles = await getMyCircles();
    } catch (e) {
      logError('schedule_detail', e);
      circles = [];
    }
    const circleOptions = circles.map((c) => ({ id: c.id, name: c.name }));

    let defaults: Record<string, unknown> = {};
    try {
      const settings = await getSettings();
      const idx = REMINDER_OPTIONS.findIndex((o) => o.value === settings.reminderLeadMinutes);
      defaults = {
        formNature: settings.defaultNature,
        formReminderLead: settings.reminderLeadMinutes,
        formReminderIndex: idx >= 0 ? idx : 0,
        reminderLabel: idx >= 0 ? REMINDER_OPTIONS[idx].label : `${settings.reminderLeadMinutes} 分钟前`,
      };
    } catch (e) {
      logError('schedule_detail', e);
      // use defaults
    }

    if (options.id) {
      let block = blockStore.blocks.find((b) => b.id === options.id);
      if (!block) {
        try {
          block = await getBlockById(options.id);
        } catch (e) {
          logError('schedule_detail', e);
          wx.showToast({ title: '日程不存在', icon: 'error' });
          setTimeout(() => wx.navigateBack(), 1500);
          return;
        }
      }
      this.populateForm(block);
      const matchedCircle = circles.find((c) => c.id === block.circleId);
      const tr = getBlockTimeRange(block);
      this.setData({
        mode: 'view',
        viewTitle: block.title,
        viewTriggerTime: toLocalTime(tr.triggerTime),
        viewStatus: block.status,
        viewLocation: block.location || '',
        viewDescription: block.description || '',
        viewCategory: SHARED_CATEGORY_LABELS[block.category] || block.category,
        viewCategoryRaw: block.category,
        viewRecurrence: RECURRENCE_LABELS[block.recurrence] || block.recurrence,
        viewRecurrenceRaw: block.recurrence,
        viewContacts: block.contacts || '',
        viewWeather: block.weather || '',
        viewCreatedAt: toLocalDate(block.createdAt),
        viewNature: NATURE_LABELS[block.nature] || block.nature,
        viewNatureRaw: block.nature,
        viewCircleName: matchedCircle ? matchedCircle.name : '',
        viewCircleId: block.circleId || '',
        circleOptions,
      });
      this.loadReminders(block.id);
    } else {
      const startTime = options.startTime || roundToNearestHalf();
      
      const extra: Record<string, unknown> = {};
      try {
        const lastCategory = storage.get<string>('LAST_CATEGORY');
        if (lastCategory && ['work', 'life', 'private'].includes(lastCategory)) {
          extra.formCategory = lastCategory;
        }
      } catch (e) {
        logError('schedule_detail', e);
        // ignore
      }
      const cat = (extra.formCategory || defaults.formCategory || 'life') as string;
      this.setData({
        ...defaults,
        ...extra,
        mode: 'create',
        formStartDate: options.date || todayStr(),
        formTriggerTime: startTime,
        formEndDate: options.date || todayStr(),
        formStatus: options.status || 'todo',
        circleOptions,
        formCategoryLabel: SHARED_CATEGORY_LABELS[cat] || cat,
      });
    }
  },

  onTitleInput(e: WechatMiniprogram.Input) {
    this.setData({ formTitle: e.detail.value });
  },

  onTriggerTimeChange() {
    this.setData({ formTriggerTime: '' });
  },

  onStartDateChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ formStartDate: e.detail.value });
  },

  onEndDateChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ formEndDate: e.detail.value });
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

  onRecurrenceChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ formRecurrence: e.currentTarget.dataset.value as string });
  },

  onContactsInput(e: WechatMiniprogram.Input) {
    this.setData({ formContacts: e.detail.value });
  },

  onWeatherInput(e: WechatMiniprogram.Input) {
    this.setData({ formWeather: e.detail.value });
  },

  onFullDayChange() {
    const fullDay = !this.data.formFullDay;
    if (fullDay) {
      this.setData({ formFullDay: true, formTriggerTime: '00:00' });
    } else {
      this.setData({ formFullDay: false });
    }
  },

  onNatureChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ formNature: e.currentTarget.dataset.value as string });
  },

  onCircleChange(e: WechatMiniprogram.CustomEvent) {
    const idx = parseInt(e.detail.value, 10);
    const opt = this.data.circleOptions[idx];
    this.setData({ formCircleId: opt ? opt.id : '', formCircleLabel: opt ? opt.name : '' });
  },

  onOpenCatPicker() {
    this.setData({ showCatPicker: true });
  },

  onCloseCatPicker() {
    this.setData({ showCatPicker: false });
  },

  onCatSelected(e: WechatMiniprogram.CustomEvent) {
    const value = e.detail.value as string;
    const labelFull = e.detail.labelFull as string;
    if (value) {
      this.setData({ formCategory: value, formCategoryLabel: labelFull });
      try { storage.set('LAST_CATEGORY', value); } catch (e) { logError('schedule_detail_lastCategory', e) }
    }
    this.setData({ showCatPicker: false });
  },

  onNatureSegChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ formNature: e.detail.value as string });
  },

  onReminderChange(e: WechatMiniprogram.CustomEvent) {
    const index = parseInt(e.detail.value, 10);
    const opt = REMINDER_OPTIONS[index];
    if (opt) {
      this.setData({ formReminderLead: opt.value, formReminderIndex: index, reminderLabel: opt.label });
    }
  },

  async loadReminders(blockId: string) {
    try {
      const reminders = await getRemindersByBlock(blockId);
      const active = reminders.find((r) => r.status === 'PENDING' || r.status === 'SENDING');
      if (active) {
        const opt = REMINDER_OPTIONS.find((o) => o.value === active.leadMinutes);
        const idx = REMINDER_OPTIONS.findIndex((o) => o.value === active.leadMinutes);
        this.setData({
          formReminderLead: active.leadMinutes,
          formReminderId: active.id,
          formReminderIndex: idx >= 0 ? idx : 0,
          reminderLabel: opt ? opt.label : `${active.leadMinutes} 分钟前`,
          viewReminder: opt ? opt.label : `${active.leadMinutes} 分钟前`,
        });
      }
    } catch (e) {
      logError('schedule_detail', e);
      // silently ignore reminder load failures
    }
  },

  async requestSubscribe(): Promise<boolean> {
    const tmplIds = APP_CONFIG.SUBSCRIBE_TEMPLATE_IDS;
    if (tmplIds.length === 0) {
      return true;
    }
    const subscribed = storage.get<boolean>(REMINDER_SUBSCRIBED);
    if (subscribed) {
      return true;
    }
    try {
      const res = await wx.requestSubscribeMessage({ tmplIds });
      const accepted = Object.values(res).some((v) => v === 'accept');
      if (accepted) {
        storage.set(REMINDER_SUBSCRIBED, true);
      } else {
        storage.set(REMINDER_SUBSCRIBED, false);
      }
      return accepted;
    } catch (e) {
      logError('schedule_detail', e);
      return true;
    }
  },

  async onPreview() {
    if (this.data.saving) return;
    this.setData({ saving: true });
    try {
    const {
      formTitle, formStartDate, formTriggerTime, formEndDate, formStatus,
      formLocation, formDescription, formCategory, formRecurrence,
      formContacts, formWeather, mode,
      formNature, formCircleId,
      formReminderLead, formReminderId,
      formEstimatedDuration,
    } = this.data;

    if (!formTitle.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (this.data.formRigidity === 'absolute' && !formTriggerTime) {
      wx.showToast({ title: '请选择触发时间', icon: 'none' });
      return;
    }

    const { formRigidity, formBufferBefore, formBufferAfter } = this.data;
    const existing = mode === 'edit' ? blockStore.blocks.find((b) => b.id === this.data.blockId) : undefined;
    const baseData = serializeBlockForm({
      formTitle, formStartDate, formTriggerTime, formEndDate, formStatus,
      formLocation, formDescription, formCategory, formRecurrence,
      formContacts, formWeather,
      formNature, formCircleId,
      formReminderLead, formReminderId,
      formRigidity, formBufferBefore, formBufferAfter, formEstimatedDuration,
    }, mode as 'create' | 'edit', existing);

    (getApp().globalData as Record<string, unknown>).pendingBlock = baseData;
    wx.navigateTo({ url: '/pages/schedule/preview/index' });
    } catch (e) {
      logError('schedule/detail onPreview', e);
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
      formTitle, formTriggerTime, formStartDate, formEndDate, formStatus,
      formLocation, formDescription, formCategory, formRecurrence,
      formContacts, formWeather,
      formReminderLead, formReminderId, formReminderIndex, reminderLabel,
      formNature, formCircleId, formCircleLabel,
      formRigidity, formBufferBefore, formBufferAfter,
    } = this.data;
    this.setData({
      mode: 'edit',
      formTitle, formTriggerTime, formStartDate, formEndDate, formStatus,
      formLocation, formDescription, formCategory, formRecurrence,
      formContacts, formWeather,
      formReminderLead, formReminderId, formReminderIndex, reminderLabel,
      formNature, formCircleId, formCircleLabel,
      formRigidity, formBufferBefore, formBufferAfter,
    });
  },

  populateForm(block: TimeBlock) {
    this.setData(initBlockForm(block) as Record<string, unknown>);
  },

  noop() {},

  onToggleMoreOptions() {
    this.setData({ showMoreOptions: !this.data.showMoreOptions });
  },

  onRigidityChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ formRigidity: e.currentTarget.dataset.value as string });
  },

  onEstimatedDurationInput(e: WechatMiniprogram.Input) {
    const val = parseInt(e.detail.value, 10);
    this.setData({ formEstimatedDuration: isNaN(val) ? 0 : Math.max(val, 0) });
  },

  onBufferBeforeInput(e: WechatMiniprogram.Input) {
    const val = parseInt(e.detail.value, 10);
    this.setData({ formBufferBefore: isNaN(val) ? 0 : Math.max(val, 0) });
  },

  onBufferAfterInput(e: WechatMiniprogram.Input) {
    const val = parseInt(e.detail.value, 10);
    this.setData({ formBufferAfter: isNaN(val) ? 0 : Math.max(val, 0) });
  },

});
