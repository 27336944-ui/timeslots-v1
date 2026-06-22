export interface DelegationResponseDto {
  id: string;
  type: string;
  initiatorId: string;
  recipientUserId: string | null;
  recipientPhone: string | null;
  shareToken: string;
  stepId: string | null;
  taskId: string | null;
  blockId: string | null;
  candidateSlots: { startTime: string; endTime: string }[] | null;
  status: string;
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
