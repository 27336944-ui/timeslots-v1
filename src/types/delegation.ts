export interface Delegation {
  id: string;
  type: 'step_execution' | 'appointment';
  initiatorId: string;
  recipientUserId: string | null;
  recipientPhone: string | null;
  shareToken: string;
  stepId: string | null;
  taskId: string | null;
  blockId: string | null;
  candidateSlots: { startTime: string; endTime: string }[] | null;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating' | 'completed' | 'cancelled';
  message: string | null;
  deadline: string | null;
  acceptedSlot: { startTime: string; endTime: string } | null;
  deliverNote: string | null;
  createdAt: string;
}

export interface DelegationListItem {
  id: string;
  type: string;
  initiatorId: string;
  initiatorName: string;
  stepText: string | null;
  taskTitle: string | null;
  status: string;
  message: string | null;
  deadline: string | null;
  createdAt: string;
}

export interface DelegationListResult {
  initiated: DelegationListItem[];
  received: DelegationListItem[];
}

export interface CreateDelegationParams extends Record<string, unknown> {
  type: 'step_execution' | 'appointment';
  stepId?: string;
  taskId?: string;
  blockId?: string;
  recipientUserId?: string;
  recipientPhone?: string;
  candidateSlots?: { startTime: string; endTime: string }[];
  message?: string;
  deadline?: string;
}

export interface RespondDelegationParams extends Record<string, unknown> {
  action: 'accept' | 'reject';
  acceptedSlot?: { startTime: string; endTime: string };
}

export interface DeliverDelegationParams extends Record<string, unknown> {
  note: string;
}
