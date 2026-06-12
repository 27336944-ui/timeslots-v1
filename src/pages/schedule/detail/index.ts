
import { blockStore } from '../../../stores/blockStore';
import { approvalStore } from '../../../stores/approvalStore';
import { getBlockById, getMyTasks, getTaskById, getRemindersByBlock, createReminder, updateReminder, deleteReminder, getMyCircles, getSettings } from '../../../services/api';
import { storage, REMINDER_SUBSCRIBED } from '../../../utils/storage';
import { APP_CONFIG } from '../../../utils/config';
import type { TimeBlock } from '../../../types/api';
import type { Circle } from '../../../types/api';


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

function roundToNearestHalf(isoStr?: string): string {
  if (isoStr) return isoStr;
  const d = new Date();
  const m = d.getMinutes();
  let h = d.getHours();
  if (m >= 45) h += 1;
  const roundedM = m < 15 ? 0 : m < 45 ? 30 : 0;
  return `${String(h).padStart(2, '0')}:${String(roundedM).padStart(2, '0')}`;
}

function toISO(dateStr: string, timeStr: string): string {
  const d = new Date(`${dateStr}T${timeStr}:00+08:00`);
  return d.toISOString();
}

const CATEGORY_LABELS: Record<string, string> = { work: '工作', life: '生活', private: '私有' };
const PRIORITY_LABELS: Record<string, string> = { high: '高', medium: '中', low: '低' };
const RECURRENCE_LABELS: Record<string, string> = { none: '不重复', daily: '每天', weekly: '每周', monthly: '每月', yearly: '每年' };
const NATURE_LABELS: Record<string, string> = { PUBLIC: '公开', PRIVATE: '私有', CIRCLE_ONLY: '圈子可见' };
const REMINDER_OPTIONS = [
  { value: 0, label: '无提醒' },
  { value: 5, label: '5 分钟前' },
  { value: 15, label: '15 分钟前' },
  { value: 30, label: '30 分钟前' },
  { value: 60, label: '1 小时前' },
];


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
  viewPriorityRaw: string;
  viewCategory: string;
  viewCategoryRaw: string;
  viewRecurrence: string;
  viewRecurrenceRaw: string;
  viewContacts: string;
  viewWeather: string;
  viewCreatedAt: string;
  viewTaskTitle: string;
  viewReminder: string;
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
  formTaskId: string;
  formTaskTitle: string;
  formReminderLead: number;
  formReminderId: string;
  formReminderIndex: number;
  formFullDay: boolean;
  formNature: string;
  formCircleId: string;
  formCircleLabel: string;
  circleOptions: { id: string; name: string }[];
  viewNature: string;
  viewNatureRaw: string;
  viewCircleName: string;
  viewCircleId: string;
  reminderLabel: string;
  reminderOptions: { value: number; label: string }[];
  showTaskPicker: boolean;
  taskOptions: { id: string; title: string; status: string }[];
  saving: boolean;
  showMoreOptions: boolean;
  showApprovalSheet: boolean;
  approvalPhoneInput: string;
  approvalPhoneList: string[];
  _savedTaskId: string;
  _editSnapshot: Record<string, string>;
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
  onReminderChange: (e: WechatMiniprogram.CustomEvent) => void;
  onTaskPickerTap: () => Promise<void>;
  onTaskPickerClose: () => void;
  onSelectTask: (e: WechatMiniprogram.TouchEvent) => void;
  onClearTask: () => void;
  onViewTaskTap: () => void;
  onFullDayChange: () => void;
  onNatureChange: (e: WechatMiniprogram.TouchEvent) => void;
  onCircleChange: (e: WechatMiniprogram.CustomEvent) => void;
  noop: () => void;
  onSave: () => Promise<void>;
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
  onBack: () => void;
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
    viewPriorityRaw: '',
    viewCategory: '',
    viewCategoryRaw: '',
    viewRecurrence: '',
    viewRecurrenceRaw: '',
    viewContacts: '',
    viewWeather: '',
    viewCreatedAt: '',
    viewTaskTitle: '',
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
    formTaskId: '',
    formTaskTitle: '',
    _savedTaskId: '',
    formFullDay: false,
    formNature: 'PUBLIC',
    formCircleId: '',
    formCircleLabel: '',
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
    showTaskPicker: false,
    taskOptions: [],
    saving: false,
    showMoreOptions: false,
    showApprovalSheet: false,
    approvalPhoneInput: '',
    approvalPhoneList: [],
    _editSnapshot: {},
  },

  async onLoad(options: Record<string, string>) {
    let circles: Circle[] = [];
    try {
      circles = await getMyCircles();
    } catch {
      circles = [];
    }
    const circleOptions = circles.map((c) => ({ id: c.id, name: c.name }));

    const REMINDER_OPTIONS_LOCAL = REMINDER_OPTIONS;
    let defaults: Record<string, unknown> = {};
    try {
      const settings = await getSettings();
      const idx = REMINDER_OPTIONS_LOCAL.findIndex((o) => o.value === settings.reminderLeadMinutes);
      defaults = {
        formNature: settings.defaultNature,
        formReminderLead: settings.reminderLeadMinutes,
        formReminderIndex: idx >= 0 ? idx : 0,
        reminderLabel: idx >= 0 ? REMINDER_OPTIONS_LOCAL[idx].label : `${settings.reminderLeadMinutes} 分钟前`,
      };
    } catch {
      // use defaults
    }

    if (options.taskId) {
      this.setData({ mode: 'create', formDate: options.date || todayStr(), taskId: options.taskId, circleOptions, ...defaults });
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
      let viewTaskTitle = '';
      if (block.taskId) {
        try {
          const task = await getTaskById(block.taskId);
          viewTaskTitle = task.title;
        } catch {
          viewTaskTitle = '(已删除)';
        }
      }
      const matchedCircle = circles.find((c) => c.id === block.circleId);
      this.setData({
        mode: 'view',
        viewTitle: block.title,
        viewTimeRange: `${toLocalTime(block.startTime)} - ${toLocalTime(block.endTime)}`,
        viewStatus: block.status,
        viewLocation: block.location || '',
        viewDescription: block.description || '',
        viewPriority: PRIORITY_LABELS[block.priority] || block.priority,
        viewPriorityRaw: block.priority,
        viewCategory: CATEGORY_LABELS[block.category] || block.category,
        viewCategoryRaw: block.category,
        viewRecurrence: RECURRENCE_LABELS[block.recurrence] || block.recurrence,
        viewRecurrenceRaw: block.recurrence,
        viewContacts: block.contacts || '',
        viewWeather: block.weather || '',
        viewCreatedAt: toLocalDate(block.createdAt),
        viewTaskTitle,
        viewNature: NATURE_LABELS[block.nature] || block.nature,
        viewNatureRaw: block.nature,
        viewCircleName: matchedCircle ? matchedCircle.name : '',
        viewCircleId: block.circleId || '',
        circleOptions,
      });
      this.loadReminders(block.id);
    } else {
      const startTime = options.startTime || roundToNearestHalf();
      const endTime = options.endTime || roundToNearestHalf(startTime);
      const extra: Record<string, unknown> = {};
      try {
        const lastCategory = storage.get<string>('LAST_CATEGORY');
        if (lastCategory && ['work', 'life', 'private'].includes(lastCategory)) {
          extra.formCategory = lastCategory;
        }
      } catch {
        // ignore
      }
      this.setData({
        mode: 'create',
        formDate: options.date || todayStr(),
        formStartTime: startTime,
        formEndTime: endTime,
        formStatus: options.status || 'todo',
        circleOptions,
        ...defaults,
        ...extra,
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

  onFullDayChange() {
    const fullDay = !this.data.formFullDay;
    if (fullDay) {
      this.setData({ formFullDay: true, formStartTime: '00:00', formEndTime: '23:59' });
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
    } catch {
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
    } catch {
      return true;
    }
  },

  async onSave() {
    if (this.data.saving) return;
    const {
      formTitle, formDate, formStartTime, formEndTime, formStatus,
      formLocation, formDescription, formPriority, formCategory, formRecurrence,
      formContacts, formWeather, mode, blockId,
      formNature, formCircleId,
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
        const newBlock = await blockStore.createBlock({
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
          taskId: this.data.formTaskId || this.data.taskId || undefined,
          nature: formNature,
          circleId: formNature === 'CIRCLE_ONLY' && formCircleId ? formCircleId : undefined,
        });
        if (this.data.formReminderLead > 0) {
          await this.requestSubscribe();
          try {
            await createReminder({ blockId: newBlock.id, leadMinutes: this.data.formReminderLead });
          } catch {
            // reminder creation failure is non-blocking
          }
        }
        storage.set('LAST_CATEGORY', formCategory);
        setTimeout(() => wx.navigateBack(), 300);
      } else {
        const snap = this.data._editSnapshot;
        const data: Record<string, string | undefined> = {};
        if (formTitle !== snap.title) data.title = formTitle;
        if (formStatus !== snap.status) data.status = formStatus;
        const d = this.data.originalDate || formDate;
        if (formStartTime !== snap.startTime) data.startTime = toISO(d, formStartTime);
        if (formEndTime !== snap.endTime) data.endTime = toISO(d, formEndTime);
        if (formLocation !== snap.location) data.location = formLocation || undefined;
        if (formDescription !== snap.description) data.description = formDescription || undefined;
        if (formPriority !== snap.priority) data.priority = formPriority;
        if (formCategory !== snap.category) data.category = formCategory;
        if (formRecurrence !== snap.recurrence) data.recurrence = formRecurrence;
        if (formContacts !== snap.contacts) data.contacts = formContacts || undefined;
        if (formWeather !== snap.weather) data.weather = formWeather || undefined;
        if (this.data.formTaskId !== snap.taskId) data.taskId = this.data.formTaskId || undefined;
        if (formNature !== snap.nature) data.nature = formNature;
        if (formCircleId !== snap.circleId) data.circleId = formCircleId || undefined;
        await blockStore.updateBlock(blockId, data);
        const { formReminderLead, formReminderId } = this.data;
        if (formReminderLead > 0) {
          await this.requestSubscribe();
        }
        if (formReminderLead > 0 && formReminderId) {
          try {
            await updateReminder(formReminderId, { leadMinutes: formReminderLead });
          } catch {
            // non-blocking
          }
        } else if (formReminderLead > 0 && !formReminderId) {
          try {
            await createReminder({ blockId, leadMinutes: formReminderLead });
          } catch {
            // non-blocking
          }
        } else if (formReminderLead === 0 && formReminderId) {
          try {
            await deleteReminder(formReminderId);
          } catch {
            // non-blocking
          }
        }
      }
      setTimeout(() => wx.navigateBack(), 300);
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
      formContacts, formWeather, formTaskId, formTaskTitle,
      formReminderLead, formReminderId, formReminderIndex, reminderLabel,
      formNature, formCircleId, formCircleLabel,
    } = this.data;
    this.setData({
      mode: 'edit',
      formTitle, formStartTime, formEndTime, formStatus,
      formLocation, formDescription, formPriority, formCategory, formRecurrence,
      formContacts, formWeather, formTaskId, formTaskTitle,
      formReminderLead, formReminderId, formReminderIndex, reminderLabel,
      formNature, formCircleId, formCircleLabel,
    });
  },

  populateForm(block: TimeBlock) {
    const snapshot = {
      title: block.title,
      status: block.status,
      startTime: toLocalTime(block.startTime),
      endTime: toLocalTime(block.endTime),
      location: block.location || '',
      description: block.description || '',
      priority: block.priority,
      category: block.category,
      recurrence: block.recurrence,
      contacts: block.contacts || '',
      weather: block.weather || '',
      taskId: block.taskId || '',
      nature: block.nature,
      circleId: block.circleId || '',
    };
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
      formTaskId: block.taskId || '',
      _savedTaskId: block.taskId || '',
      formTaskTitle: '',
      formNature: block.nature,
      formCircleId: block.circleId || '',
      formCircleLabel: '',
      _editSnapshot: snapshot,
    });
    if (block.taskId) {
      getTaskById(block.taskId).then(t => {
        this.setData({ formTaskTitle: t.title });
      }).catch(() => {
        this.setData({ formTaskTitle: '(已删除)' });
      });
    }
  },

  async onTaskPickerTap() {
    try {
      const tasks = await getMyTasks();
      const filtered = tasks.filter(t => t.status !== 'done');
      this.setData({ taskOptions: filtered, showTaskPicker: true });
    } catch {
      wx.showToast({ title: '加载任务失败', icon: 'none' });
    }
  },

  onTaskPickerClose() {
    this.setData({ showTaskPicker: false });
  },

  onSelectTask(e: WechatMiniprogram.TouchEvent) {
    const { id, title } = e.currentTarget.dataset as { id: string; title: string };
    this.setData({ formTaskId: id, formTaskTitle: title, showTaskPicker: false });
  },

  onClearTask() {
    this.setData({ formTaskId: '', formTaskTitle: '' });
  },

  onViewTaskTap() {
    const { formTaskId } = this.data;
    if (formTaskId) {
      wx.navigateTo({ url: `/pages/tasks/task-detail/index?id=${formTaskId}` });
    }
  },

  onApproveTap() {
    this.setData({ showApprovalSheet: true, approvalPhoneInput: '', approvalPhoneList: [] });
  },

  onApprovalPhoneInput(e: WechatMiniprogram.Input) {
    this.setData({ approvalPhoneInput: e.detail.value });
  },

  onApprovalAddPhone() {
    const phone = this.data.approvalPhoneInput.trim();
    if (!phone || phone.length < 11) {
      wx.showToast({ title: '请输入完整手机号', icon: 'none' });
      return;
    }
    if (this.data.approvalPhoneList.includes(phone)) {
      wx.showToast({ title: '该手机号已添加', icon: 'none' });
      return;
    }
    this.setData({
      approvalPhoneList: [...this.data.approvalPhoneList, phone],
      approvalPhoneInput: '',
    });
  },

  onApprovalRemovePhone(e: WechatMiniprogram.TouchEvent) {
    const value = e.currentTarget.dataset.value as string;
    this.setData({ approvalPhoneList: this.data.approvalPhoneList.filter((p) => p !== value) });
  },

  onApprovalClose() {
    this.setData({ showApprovalSheet: false });
  },

  async onApprovalSubmit() {
    const { blockId, approvalPhoneList } = this.data;
    if (approvalPhoneList.length === 0) {
      wx.showToast({ title: '请添加至少一个手机号', icon: 'none' });
      return;
    }
    const recipients = approvalPhoneList.map((p) => ({ contactType: 'phone' as const, contactValue: p }));
    try {
      wx.showLoading({ title: '发起中...' });
      await approvalStore.createApproval(blockId, recipients);
      wx.hideLoading();
      this.setData({ showApprovalSheet: false });
      wx.showToast({ title: '已发起审批', icon: 'success', duration: 1500 });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: (err as Error).message || '发起失败', icon: 'none' });
    }
  },

  noop() {},

  onToggleMoreOptions() {
    this.setData({ showMoreOptions: !this.data.showMoreOptions });
  },

  onBack() {
    wx.navigateBack();
  },
});
