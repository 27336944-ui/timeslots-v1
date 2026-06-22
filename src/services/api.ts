
import { get, post, del, patch } from '../utils/request';
import { storage } from '../utils/storage';
import { APP_CONFIG } from '../utils/config';
import type {
  HealthData, LoginResponse, TimeBlock, Task, TaskStats, Reminder, Step, Template,
  Circle, InviteResponse, UserSettings, ShareCardResponse, NamecardResponse, ShareCardRespondItem,
  TimeBlockStats, SearchResponse, CategoryItem, MemberAvailability, SseEvent,
} from '../types/api';
import type { ParseResult } from '../types/parse';
import type {
  ApprovalRequest, ApprovalPendingItem, ApprovalShareInfo, RecipientInput,
} from '../types/approval';


export function healthCheck(): Promise<HealthData> {
  return get<HealthData>('/api/v1/health');
}


export function login(userId: string): Promise<LoginResponse> {
  return post<LoginResponse>('/api/v1/auth/login', { userId });
}


export function wxLogin(code: string): Promise<LoginResponse> {
  return post<LoginResponse>('/api/v1/auth/wx-login', { code });
}


export function migrateDevData(devUserId: string): Promise<{ migrated: number }> {
  return post<{ migrated: number }>('/api/v1/auth/migrate-dev-data', { devUserId });
}


export function deleteDevData(devUserId: string): Promise<{ deleted: number }> {
  return post<{ deleted: number }>('/api/v1/auth/delete-dev-data', { devUserId });
}


export type DeleteAccountResponse = { deleted: boolean; restoreToken: string };

export function deleteAccount(): Promise<DeleteAccountResponse> {
  return del<DeleteAccountResponse>('/api/v1/auth/account');
}


export function restoreAccount(userId: string, restoreToken: string): Promise<LoginResponse> {
  return post<LoginResponse>('/api/v1/auth/restore', { userId, restoreToken });
}


export function getMyBlocksByDate(date: string): Promise<TimeBlock[]> {
  return get<TimeBlock[]>(`/api/v1/time-blocks/by-date/${date}`);
}


export function getMyBlocksByDateRange(start: string, end: string): Promise<Record<string, TimeBlock[]>> {
  return get<Record<string, TimeBlock[]>>(`/api/v1/time-blocks/by-date-range?start=${start}&end=${end}`);
}


export function getBlockById(id: string): Promise<TimeBlock> {
  return get<TimeBlock>(`/api/v1/time-blocks/${id}`);
}


export function checkConflicts(data: {
  startTime: string;
  endTime: string;
  excludeId?: string;
}): Promise<Array<{ id: string; title: string; startTime: string; endTime: string }>> {
  return post<Array<{ id: string; title: string; startTime: string; endTime: string }>>(
    '/api/v1/time-blocks/check-conflicts', data,
  );
}


export function createBlock(data: {
  title: string;
  startTime: string;
  endTime: string;
  status?: string;
  location?: string;
  description?: string;
  category?: string;
  categoryId?: string;
  source?: string;
  sourceId?: string;
  recurrence?: string;
  recurrenceEndAt?: string;
  contacts?: string;
  weather?: string;
  taskId?: string;
  nature?: string;
  circleId?: string;
  triggerTime?: string;
  startDate?: string;
  endDate?: string;
}): Promise<TimeBlock> {
  return post<TimeBlock>('/api/v1/time-blocks', data);
}


export function getBlocksByTask(taskId: string): Promise<TimeBlock[]> {
  return get<TimeBlock[]>(`/api/v1/time-blocks/by-task/${taskId}`);
}


export function updateBlock(
  id: string,
  data: {
    title?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
    location?: string;
    description?: string;
    category?: string;
    categoryId?: string;
    recurrence?: string;
    recurrenceEndAt?: string;
    contacts?: string;
    weather?: string;
    taskId?: string;
    nature?: string;
    circleId?: string;
    updateMode?: string;
    triggerTime?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<TimeBlock> {
  return patch<TimeBlock>(`/api/v1/time-blocks/${id}`, data);
}


export function deleteBlock(id: string, updateMode?: string): Promise<{ deleted: boolean }> {
  const query = updateMode ? `?updateMode=${updateMode}` : '';
  return del<{ deleted: boolean }>(`/api/v1/time-blocks/${id}${query}`);
}


export function createTask(data: {
  title: string;
  goal?: string;
  steps?: { text: string; isDone: boolean }[];
  status?: string;
  priority?: string;
  category?: string;
  dueAt?: string;
  startDate?: string;
  estimatedDuration?: number;
}): Promise<Task> {
  return post<Task>('/api/v1/tasks', data);
}


/** 文本→任务转发（仍在用：tasks/forward-create/index.ts；NLP 稳定后迁移至 aiParse） */
export function forwardCreateTask(text: string): Promise<Task> {
  return post<Task>('/api/v1/tasks/from-text', { text });
}


export function getMyTasks(limit?: number, offset?: number): Promise<Task[]> {
  const params: string[] = [];
  if (limit !== undefined) params.push(`limit=${limit}`);
  if (offset !== undefined) params.push(`offset=${offset}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return get<Task[]>(`/api/v1/tasks/my${query}`);
}


export function getTaskStats(): Promise<TaskStats> {
  return get<TaskStats>('/api/v1/tasks/my/stats');
}


export function getTasksByCategory(category: string): Promise<Task[]> {
  return get<Task[]>(`/api/v1/tasks/my/category/${category}`);
}


export function getTaskById(id: string): Promise<Task> {
  return get<Task>(`/api/v1/tasks/${id}`);
}


export function updateTask(id: string, data: {
  title?: string;
  goal?: string;
  steps?: { text: string; isDone: boolean }[];
  status?: string;
  priority?: string;
  category?: string;
  dueAt?: string;
  estimatedDuration?: number;
  completedNote?: string;
  retrospective?: string;
  improvements?: string;
}): Promise<Task> {
  return patch<Task>(`/api/v1/tasks/${id}`, data);
}


export function deleteTask(id: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`/api/v1/tasks/${id}`);
}


export function completeTaskWithReview(taskId: string, completedNote: string, retrospective: string): Promise<Task> {
  return post<Task>(`/api/v1/tasks/${taskId}/complete`, { completedNote, retrospective });
}


export function getRemindersByBlock(blockId: string): Promise<Reminder[]> {
  return get<Reminder[]>(`/api/v1/reminders/block/${blockId}`);
}


export function createReminder(data: {
  blockId: string;
  leadMinutes: number;
}): Promise<Reminder> {
  return post<Reminder>('/api/v1/reminders', data);
}


export function updateReminder(
  id: string,
  data: { leadMinutes?: number; status?: string },
): Promise<Reminder> {
  return patch<Reminder>(`/api/v1/reminders/${id}`, data);
}


export function deleteReminder(id: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`/api/v1/reminders/${id}`);
}


export function createCircle(data: { name: string; description?: string; parentId?: string }): Promise<Circle> {
  return post<Circle>('/api/v1/circles', data);
}


export function getMyCircles(): Promise<Circle[]> {
  return get<Circle[]>('/api/v1/circles/my');
}


export function getCircleDetail(id: string): Promise<Circle> {
  return get<Circle>(`/api/v1/circles/${id}`);
}


export function getSettings(): Promise<UserSettings> {
  return get<UserSettings>('/api/v1/auth/settings');
}

export function updateSettings(data: Partial<UserSettings>): Promise<UserSettings> {
  return patch<UserSettings>('/api/v1/auth/settings', data);
}

export function deleteCircle(id: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`/api/v1/circles/${id}`);
}


export function generateInviteCode(circleId: string): Promise<InviteResponse> {
  return post<InviteResponse>(`/api/v1/circles/${circleId}/invite`);
}


export function joinCircleByCode(code: string): Promise<Circle> {
  return post<Circle>(`/api/v1/circles/join/${code}`);
}


export function leaveCircle(circleId: string): Promise<{ deleted: boolean }> {
  return post<{ deleted: boolean }>(`/api/v1/circles/${circleId}/leave`);
}


export function removeCircleMember(circleId: string, memberId: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`/api/v1/circles/${circleId}/members/${memberId}`);
}

export function addCircleMembers(circleId: string, userIds: string[]): Promise<Circle> {
  return post<Circle>(`/api/v1/circles/${circleId}/members`, { userIds });
}

export function getCircleAvailability(circleId: string, date: string): Promise<MemberAvailability[]> {
  return get<MemberAvailability[]>(`/api/v1/circles/${circleId}/availability?date=${date}`);
}


// ---- Category APIs ----

export function createCategory(data: { name: string; parentId?: string; color?: string }): Promise<CategoryItem> {
  return post<CategoryItem>('/api/v1/categories', data);
}


export function getMyCategories(): Promise<CategoryItem[]> {
  return get<CategoryItem[]>('/api/v1/categories/my');
}


export function deleteCategory(id: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`/api/v1/categories/${id}`);
}


export function updateCategory(id: string, data: { name?: string; sortOrder?: number; color?: string }): Promise<CategoryItem> {
  return patch<CategoryItem>(`/api/v1/categories/${id}`, data);
}


export function updateCircle(id: string, data: { name?: string; description?: string; status?: string }): Promise<Circle> {
  return patch<Circle>(`/api/v1/circles/${id}`, data);
}


// ---- Template APIs ----

export function createTemplate(data: {
  name: string; type: string; title: string; goal?: string;
  priority?: string; categoryId?: string; estimatedMinutes?: number;
  defaultDuration?: number; defaultNature?: string; sortOrder?: number;
}): Promise<Template> {
  return post<Template>('/api/v1/templates', data);
}


export function getMyTemplates(type?: string): Promise<Template[]> {
  const query = type ? `?type=${type}` : '';
  return get<Template[]>(`/api/v1/templates${query}`);
}


export function getTemplateById(id: string): Promise<Template> {
  return get<Template>(`/api/v1/templates/${id}`);
}


export function deleteTemplate(id: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`/api/v1/templates/${id}`);
}


// ---- Share Card & Namecard APIs (冷启动引擎) ----

export function createShareCard(date: string): Promise<ShareCardResponse> {
  return post<ShareCardResponse>('/api/v1/time-blocks/share-card', { date });
}


export function getShareCard(token: string): Promise<ShareCardResponse> {
  return get<ShareCardResponse>(`/api/v1/time-blocks/share-card/${token}`);
}


export function respondToShareCard(token: string, data: { startTime: string; endTime: string; userName?: string }): Promise<ShareCardRespondItem> {
  return post<ShareCardRespondItem>(`/api/v1/time-blocks/share-card/${token}/respond`, data);
}


export function getNamecard(date: string): Promise<NamecardResponse> {
  return get<NamecardResponse>(`/api/v1/time-blocks/namecard?date=${date}`);
}


export function getTimeBlockStats(start: string, end: string): Promise<TimeBlockStats> {
  return get<TimeBlockStats>(`/api/v1/time-blocks/stats?start=${start}&end=${end}`);
}


export function search(q: string): Promise<SearchResponse> {
  return get<SearchResponse>(`/api/v1/search?q=${encodeURIComponent(q)}`);
}


// ---- Apply Template ----

export function applyTemplate(templateId: string, data: { date: string }): Promise<{ blocks: TimeBlock[] }> {
  return post<{ blocks: TimeBlock[] }>(`/api/v1/templates/${templateId}/apply`, data);
}


// ---- Step APIs ----

export function getStepsByTask(taskId: string): Promise<Step[]> {
  return get<Step[]>(`/api/v1/steps/by-task/${taskId}`);
}


export function createStep(data: { taskId: string; text: string; estimatedMinutes?: number; sortOrder?: number; status?: string; dependsOnId?: string }): Promise<Step> {
  return post<Step>('/api/v1/steps', data);
}


export function updateStep(id: string, data: { text?: string; estimatedMinutes?: number; status?: string; sortOrder?: number; dependsOnId?: string }): Promise<Step> {
  return patch<Step>(`/api/v1/steps/${id}`, data);
}


export function deleteStep(id: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`/api/v1/steps/${id}`);
}


export function scheduleStep(id: string, data: { startTime: string; endTime: string }): Promise<{
  id: string; status: string; timeBlockId: string; timeBlock: TimeBlock;
}> {
  return post(`/api/v1/steps/${id}/schedule`, data);
}


function parseSseText(text: string): SseEvent[] {
  const events: SseEvent[] = [];
  const lines = text.split('\n');
  let current: { type?: string; id?: string; data?: string } = {};

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      current.type = line.slice(7).trim();
    } else if (line.startsWith('id: ')) {
      current.id = line.slice(4).trim();
    } else if (line.startsWith('data: ')) {
      current.data = line.slice(6).trim();
    } else if (line === '') {
      if (current.type && current.data !== undefined) {
        try {
          events.push({ type: current.type, id: current.id, data: JSON.parse(current.data) });
        } catch (e) {
          logError('api_upload', e);
          events.push({ type: current.type, id: current.id, data: current.data });
        }
      }
      current = {};
    }
  }

  return events;
}


export function decomposeTask(title: string, goal?: string): Promise<SseEvent[]> {
  const token = storage.get<string>(APP_CONFIG.TOKEN_KEY);
  const header: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) header['Authorization'] = `Bearer ${token}`;

  return new Promise<SseEvent[]>((resolve, reject) => {
    wx.request({
      url: `${APP_CONFIG.getBaseUrl()}/api/v1/ai/decompose`,
      method: 'POST',
      data: { title, goal },
      header,
      timeout: 30000,
      enableHttp2: false,
      success(res) {
        const text = res.data as string;
        if (!text) {
          reject(new Error('AI 拆解返回为空'));
          return;
        }
        const events = parseSseText(text);
        if (events.length === 0) {
          reject(new Error('AI 拆解返回格式异常'));
          return;
        }
        resolve(events);
      },
      fail(err) {
        reject(new Error(err.errMsg || 'AI 拆解请求失败'));
      },
    });
  });
}


// ---- Approval APIs ----

export function createApproval(data: { blockId: string; recipients: RecipientInput[] }): Promise<ApprovalRequest> {
  return post<ApprovalRequest>('/api/v1/approvals', data);
}


export function getMyInitiatedApprovals(): Promise<ApprovalRequest[]> {
  return get<ApprovalRequest[]>('/api/v1/approvals/my-initiated');
}


export function getMyPendingApprovals(): Promise<ApprovalPendingItem[]> {
  return get<ApprovalPendingItem[]>('/api/v1/approvals/my-pending');
}


export function getApprovalDetail(id: string): Promise<ApprovalRequest> {
  return get<ApprovalRequest>(`/api/v1/approvals/${id}`);
}


export function respondApproval(requestId: string, recipientId: string, action: 'approve' | 'reject'): Promise<{ action: string; ok: boolean }> {
  return patch<{ action: string; ok: boolean }>(`/api/v1/approvals/${requestId}/recipients/${recipientId}`, { action });
}


export function resendApproval(requestId: string, recipientId: string): Promise<{ ok: boolean }> {
  return post<{ ok: boolean }>(`/api/v1/approvals/${requestId}/recipients/${recipientId}/resend`);
}


export function cancelApproval(id: string): Promise<{ ok: boolean }> {
  return post<{ ok: boolean }>(`/api/v1/approvals/${id}/cancel`);
}


export function getApprovalByShareToken(token: string): Promise<ApprovalShareInfo> {
  return get<ApprovalShareInfo>(`/api/v1/approvals/shared/${token}`);
}


export function bindApprovalRecipient(requestId: string): Promise<{ recipientId: string }> {
  return post<{ recipientId: string }>(`/api/v1/approvals/${requestId}/bind`);
}


export function suggestSlots(date: string, steps: { id: string; text: string; estimatedMinutes?: number; dependsOnId?: string }[]): Promise<{ suggestions: { stepId: string; suggestedStart: string | null; suggestedEnd: string | null; reason: string }[] }> {
  return post('/api/v1/ai/suggest-slots', { date, steps });
}


import type { Delegation, DelegationListResult, CreateDelegationParams, RespondDelegationParams, DeliverDelegationParams } from '../types/delegation';

export function createDelegation(data: CreateDelegationParams): Promise<Delegation> {
  return post<Delegation>('/api/v1/delegations', data);
}

export function getMyDelegations(): Promise<DelegationListResult> {
  return get<DelegationListResult>('/api/v1/delegations/my');
}

export function getDelegationDetail(id: string): Promise<Delegation> {
  return get<Delegation>(`/api/v1/delegations/${id}`);
}

export function respondDelegation(id: string, data: RespondDelegationParams): Promise<Delegation> {
  return patch<Delegation>(`/api/v1/delegations/${id}/respond`, data);
}

export function deliverDelegation(id: string, data: DeliverDelegationParams): Promise<Delegation> {
  return post<Delegation>(`/api/v1/delegations/${id}/deliver`, data);
}


import type { ShareRecipient, CreateShareRecipientParams, UpdateShareRecipientParams, StealthStatus } from '../types/share';
import { logError } from '../utils/logError';

export function getShareRecipients(): Promise<ShareRecipient[]> {
  return get<ShareRecipient[]>('/api/v1/share/recipients');
}

export function createShareRecipient(data: CreateShareRecipientParams): Promise<ShareRecipient> {
  return post<ShareRecipient>('/api/v1/share/recipients', data);
}

export function updateShareRecipient(id: string, data: UpdateShareRecipientParams): Promise<ShareRecipient> {
  return patch<ShareRecipient>(`/api/v1/share/recipients/${id}`, data);
}

export function removeShareRecipient(id: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`/api/v1/share/recipients/${id}`);
}

export function getStealthStatus(): Promise<StealthStatus> {
  return get<StealthStatus>('/api/v1/share/stealth');
}

export function setStealthMode(durationMinutes?: number): Promise<StealthStatus> {
  return post<StealthStatus>('/api/v1/share/stealth', { action: 'on', durationMinutes });
}

export function aiParse(text: string): Promise<ParseResult> {
  return post<ParseResult>('/api/v1/ai/parse', { text });
}

export function disableStealthMode(): Promise<{ enabled: boolean }> {
  return post<{ enabled: boolean }>('/api/v1/share/stealth', { action: 'off' });
}


// ---- Gap & Flexible Task APIs ----

export interface GapItem {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export function getGaps(date: string): Promise<GapItem[]> {
  return get<GapItem[]>(`/api/v1/time-blocks/gaps?date=${date}`);
}

export function placeFlexible(data: {
  taskId: string;
  startTime: string;
  endTime: string;
}): Promise<TimeBlock> {
  return post<TimeBlock>('/api/v1/time-blocks/place-flexible', data);
}

export function unplaceBlock(id: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`/api/v1/time-blocks/${id}/unplace`);
}
