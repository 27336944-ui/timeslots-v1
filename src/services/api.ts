
import { get, post, del, patch } from '../utils/request';
import type {
  HealthData, LoginResponse, TimeBlock, Task, TaskStats, Reminder,
  Circle, InviteResponse, UserSettings,
} from '../types/api';
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


export function updateProfile(data: {
  nickname?: string;
  avatar?: string;
}): Promise<{ id: string; nickname: string; avatar: string | null }> {
  return patch<{ id: string; nickname: string; avatar: string | null }>('/api/v1/auth/profile', data);
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


export function createBlock(data: {
  title: string;
  startTime: string;
  endTime: string;
  status?: string;
  location?: string;
  description?: string;
  priority?: string;
  category?: string;
  recurrence?: string;
  contacts?: string;
  weather?: string;
  taskId?: string;
  nature?: string;
  circleId?: string;
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
    priority?: string;
    category?: string;
    recurrence?: string;
    contacts?: string;
    weather?: string;
    taskId?: string;
    nature?: string;
    circleId?: string;
  },
): Promise<TimeBlock> {
  return patch<TimeBlock>(`/api/v1/time-blocks/${id}`, data);
}


export function deleteBlock(id: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`/api/v1/time-blocks/${id}`);
}


export function createTask(data: {
  title: string;
  goal?: string;
  steps?: { text: string; isDone: boolean }[];
  status?: string;
  priority?: string;
  category?: string;
  dueAt?: string;
}): Promise<Task> {
  return post<Task>('/api/v1/tasks', data);
}


export function getMyTasks(): Promise<Task[]> {
  return get<Task[]>('/api/v1/tasks/my');
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
  completedNote?: string;
  retrospective?: string;
  improvements?: string;
}): Promise<Task> {
  return patch<Task>(`/api/v1/tasks/${id}`, data);
}


export function deleteTask(id: string): Promise<{ deleted: boolean }> {
  return del<{ deleted: boolean }>(`/api/v1/tasks/${id}`);
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


export function createCircle(data: { name: string; description?: string }): Promise<Circle> {
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

export function updateCircle(id: string, data: {
  name?: string; description?: string; status?: string;
}): Promise<Circle> {
  return patch<Circle>(`/api/v1/circles/${id}`, data);
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
