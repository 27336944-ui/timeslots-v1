


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

export interface UserSettings {
  dayStartsAt: string;
  reminderLeadMinutes: number;
  defaultNature: string;
  defaultDuration: string;
  defaultCategory: string;
  weekStartsOn: number;
  weeklyReportEnabled: boolean;
  weeklyReportTime: string;
  privacyFallback: string;
  age?: number;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  spouseName?: string;
  residence?: string;
  company?: string;
  occupation?: string;
}


export type WxRequestMethod = 'OPTIONS' | 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'TRACE' | 'CONNECT';


export type WxRequestData = string | Record<string, unknown> | ArrayBuffer;


export interface Task {
  id: string;
  userId: string;
  title: string;
  goal: string | null;
  /** @deprecated use stepRows (Step API association) instead */
  steps: { text: string; isDone: boolean }[] | null;
  /** Steps loaded via GET /steps/by-task/:taskId association */
  stepRows?: Step[];
  status: string;
  category: string;
  categoryId: string | null;
  startDate: string | null;
  dueAt: string | null;
  triggerTime: string | null;
  completedNote: string | null;
  retrospective: string | null;
  improvements: string | null;
  estimatedDuration: number | null;
  createdAt: string;
  updatedAt: string;
}


export interface Reminder {
  id: string;
  userId: string;
  blockId: string;
  remindAt: string;
  leadMinutes: number;
  status: string;
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


export interface Circle {
  id: string;
  ownerId: string;
  name: string;
  parentId: string | null;
  level: number;
  isFixed: boolean;
  isDefault: boolean;
  sortOrder: number;
  description: string | null;
  inviteCode: string;
  status: string;
  memberCount: number;
  members?: Array<{ id: string; userId: string; nickname: string; avatar: string | null; role: string; joinedAt: string }>;
  myRole: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberAvailability {
  userId: string;
  nickname: string;
  role: string;
  busySlots: TimeSlot[];
}

export interface CircleItem {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  sortOrder: number;
  isFixed: boolean;
  isDefault: boolean;
  description: string | null;
  memberCount: number;
  myRole: string;
  children: CircleItem[];
}


export interface InviteResponse {
  inviteCode: string;
}


export interface Step {
  id: string;
  taskId: string;
  sortOrder: number;
  text: string;
  estimatedMinutes: number | null;
  status: string;
  dependsOnId: string | null;
  blocked: boolean;
  suggestedStart: string | null;
  suggestedEnd: string | null;
  timeBlockId: string | null;
  scheduledDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}


export interface DecomposeStepItem {
  index?: number;
  text: string;
  estimatedMinutes: number;
  dependsOnIndex: number;
}


export interface DecomposeResult {
  steps: DecomposeStepItem[];
  totalMinutes: number;
  rationale: string;
}


export interface SseEvent {
  type: string;
  id?: string;
  data: unknown;
}


export interface Template {
  id: string;
  userId: string;
  name: string;
  type: 'task' | 'timeblock';
  title: string;
  goal: string | null;
  priority: string | null;
  categoryId: string | null;
  estimatedMinutes: number | null;
  defaultDuration: number | null;
  defaultNature: string | null;
  sortOrder: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}


export interface TimeSlot {
  start: string;
  end: string;
}


export interface ShareCardResponse {
  token: string;
  userName: string;
  date: string;
  busySlots: TimeSlot[];
  freeSlots: TimeSlot[];
  responses: ShareCardRespondItem[];
  createdAt: string;
}


export interface ShareCardRespondItem {
  startTime: string;
  endTime: string;
  userName: string;
  createdAt: string;
}


export interface DayFreeSlot {
  date: string;
  freeSlots: TimeSlot[];
}


export interface NamecardResponse {
  totalHours: number;
  freeHours: number;
  busyHours: number;
  avgBlockDuration: number;
  weeklyHeatmap: DayFreeSlot[];
}


export interface TimeBlockStats {
  totalBlocks: number;
  totalHours: number;
  byCategory: Record<string, number>;
  avgDurationMinutes: number;
  dailyDistribution: Record<string, number>;
}

export interface CategoryItem {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  sortOrder: number;
  isFixed: boolean;
  isDefault: boolean;
  color: string;
  children: CategoryItem[];
}

export interface SearchResultItem {
  type: 'timeblock' | 'task' | 'circle';
  id: string;
  title: string;
  subtitle: string | null;
}

export interface SearchResponse {
  results: SearchResultItem[];
  total: number;
}

export interface TimeBlock {
  id: string;
  userId: string;
  title: string;
  startTime: string;
  endTime: string;
  triggerTime: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  location: string | null;
  description: string | null;
  category: string;
  categoryId: string | null;
  source: string | null;
  sourceId: string | null;
  recurrence: string;
  recurrenceEndAt: string | null;
  recurrenceGroupId: string | null;
  contacts: string | null;
  weather: string | null;
  taskId: string | null;
  nature: string;
  circleId: string | null;
  rigidity: string | null;
  bufferBefore: number | null;
  bufferAfter: number | null;
  anchorType: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TimeBlockRigidity = 'absolute' | 'relative';
export type AnchorType = 'meeting' | 'commute' | 'social' | 'medical' | 'other';
