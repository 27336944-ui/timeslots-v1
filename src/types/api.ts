


export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  path: string;
  timestamp: string;
}


export interface HealthData {
  status: string;
  db: string;
  timestamp: string;
}


export interface UserInfo {
  id: string;
  nickname: string;
  avatar: string | null;
}


export interface LoginResponse {
  accessToken: string;
  user: UserInfo;
}


export type WxRequestMethod = 'OPTIONS' | 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'CONNECT';


export type WxRequestData = string | Record<string, unknown> | ArrayBuffer;


export interface TaskStep {
  text: string;
  isDone: boolean;
}


export interface Task {
  id: string;
  userId: string;
  title: string;
  goal: string | null;
  steps: TaskStep[] | null;
  status: string;
  priority: string;
  category: string;
  dueAt: string | null;
  completedNote: string | null;
  retrospective: string | null;
  improvements: string | null;
  createdAt: string;
  updatedAt: string;
}


export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  done: number;
  arranged: number;
  unarranged: number;
  overdue: number;
  today: number;
  week: number;
}


export interface TimeBlock {
  id: string;
  userId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  location: string | null;
  description: string | null;
  priority: string;
  category: string;
  recurrence: string;
  contacts: string | null;
  weather: string | null;
  createdAt: string;
  updatedAt: string;
}
