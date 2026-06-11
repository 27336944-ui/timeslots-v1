
import { get, post, del, patch } from '../utils/request';
import type { HealthData, LoginResponse, TimeBlock, Task, TaskStats } from '../types/api';


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
}): Promise<TimeBlock> {
  return post<TimeBlock>('/api/v1/time-blocks', data);
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
