import { CATEGORY_LABELS } from '../constants/categories';
import { toLocalTime, todayStr } from './date';
import { getBlockTimeRange } from './block-time';
import type { TimeBlock } from '../types/api';

const RIGIDITY_LABELS: Record<string, string> = { '': '弹性任务', absolute: '刚性任务 🔒' };

/**
 * 根据 TimeBlock 计算表单初始数据。
 * - 不传 block → 返回 create 模式的默认值
 * - 传入 block → 返回 edit/view 模式的表单填充值（含 _editSnapshot）
 */
export function initBlockForm(block?: TimeBlock): Record<string, unknown> {
  if (!block) {
    return {
      blockId: '',
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
      formCategoryLabel: CATEGORY_LABELS['life'] || '生活',
      formRecurrence: 'none',
      formContacts: '',
      formWeather: '',
      formNature: 'PUBLIC',
      formCircleId: '',
      formCircleLabel: '',
      formRigidity: '',
      formBufferBefore: 0,
      formBufferAfter: 0,
      _editSnapshot: {},
    };
  }

  const rigidity = block.rigidity || '';
  const bufferBefore = block.bufferBefore ?? 0;
  const bufferAfter = block.bufferAfter ?? 0;
  const snapshot = {
    title: block.title,
    status: block.status,
    startTime: toLocalTime(block.startTime),
    endTime: toLocalTime(block.endTime),
    location: block.location || '',
    description: block.description || '',
    category: block.category,
    recurrence: block.recurrence,
    contacts: block.contacts || '',
    weather: block.weather || '',
    nature: block.nature,
    circleId: block.circleId || '',
  };

  const tr = getBlockTimeRange(block);

  return {
    blockId: block.id,
    formStartDate: tr.startDate,
    formEndDate: tr.endDate,
    formTitle: block.title,
    formTriggerTime: toLocalTime(tr.triggerTime),
    formStatus: block.status,
    formLocation: block.location || '',
    formDescription: block.description || '',
    formCategory: block.category,
    formCategoryLabel: CATEGORY_LABELS[block.category] || block.category,
    formRecurrence: block.recurrence,
    formContacts: block.contacts || '',
    formWeather: block.weather || '',
    formNature: block.nature,
    formCircleId: block.circleId || '',
    formCircleLabel: '',
    formRigidity: rigidity,
    formBufferBefore: bufferBefore,
    formBufferAfter: bufferAfter,
    viewRigidityLabel: RIGIDITY_LABELS[rigidity] || '',
    viewBufferLabel: bufferBefore || bufferAfter ? `缓冲 ${bufferBefore}′/${bufferAfter}′` : '',
    _editSnapshot: snapshot,
  };
}

/**
 * 将页面表单数据序列化为 API 请求 payload（原 onPreview 中的 baseData 构建逻辑）。
 */
export function serializeBlockForm(
  formData: {
    formTitle: string;
    formStartDate: string;
    formEndDate: string;
    formTriggerTime: string;
    formStatus: string;
    formLocation: string;
    formDescription: string;
    formCategory: string;
    formRecurrence: string;
    formContacts: string;
    formWeather: string;
    formNature: string;
    formCircleId: string;
    formReminderLead: number;
    formReminderId: string;
    formRigidity: string;
    formBufferBefore: number;
    formBufferAfter: number;
    formEstimatedDuration: number;
  },
  mode: 'create' | 'edit',
  existingBlock?: TimeBlock,
): Record<string, unknown> {
  const {
    formTitle, formStartDate, formTriggerTime, formEndDate, formStatus,
    formLocation, formDescription, formCategory, formRecurrence,
    formContacts, formWeather,
    formNature, formCircleId,
    formReminderLead, formReminderId,
    formRigidity, formBufferBefore, formBufferAfter, formEstimatedDuration,
  } = formData;

  const baseData: Record<string, unknown> = {
    title: formTitle,
    status: formStatus,
    location: formLocation || undefined,
    description: formDescription || undefined,
    category: formCategory,
    recurrence: formRecurrence,
    contacts: formContacts || undefined,
    weather: formWeather || undefined,
    nature: formNature,
    circleId: formNature === 'CIRCLE_ONLY' && formCircleId ? formCircleId : undefined,
    triggerTime: formTriggerTime ? `${formStartDate || todayStr()}T${formTriggerTime}:00+08:00` : undefined,
    startDate: formStartDate || undefined,
    endDate: formEndDate || undefined,
    reminderLead: formReminderLead || undefined,
    reminderId: formReminderId || undefined,
    rigidity: formRigidity || undefined,
    estimatedDuration: formRigidity !== 'absolute' && formEstimatedDuration > 0 ? formEstimatedDuration : undefined,
    bufferBefore: formRigidity === 'absolute' ? formBufferBefore : undefined,
    bufferAfter: formRigidity === 'absolute' ? formBufferAfter : undefined,
  };

  if (mode === 'create') {
    baseData.startTime = formTriggerTime ? `${formStartDate || todayStr()}T${formTriggerTime}:00+08:00` : '';
    baseData.endTime = formTriggerTime ? `${formStartDate || todayStr()}T${formTriggerTime}:30+08:00` : '';
  } else {
    if (existingBlock) {
      baseData.startTime = existingBlock.startTime;
      baseData.endTime = existingBlock.endTime;
    }
  }

  return baseData;
}
