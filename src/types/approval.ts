export interface ApprovalRecipientEntry {
  id: string;
  contactType: string;
  contactValue: string | null;
  status: string;
  respondedAt: string | null;
}

export interface ApprovalRequest {
  id: string;
  initiatorId: string;
  blockId: string;
  title: string;
  startTime: string;
  endTime: string;
  description: string | null;
  category: string;
  status: string;
  shareToken: string;
  isInitiator: boolean;
  recipients: ApprovalRecipientEntry[];
  createdAt: string;
  progressPercent: number;
  approvedCount: number;
}

export interface ApprovalPendingItem {
  recipientId: string;
  requestId: string;
  title: string;
  startTime: string;
  endTime: string;
  triggerTime: string | null;
  description: string | null;
  status: string;
  initiator: { id: string; nickname: string; avatar: string | null };
  createdAt: string;
}

export interface ApprovalShareInfo {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description: string | null;
  category: string;
  status: string;
  initiator: { id: string; nickname: string; avatar: string | null };
}

export interface RecipientInput {
  contactType: 'friend' | 'phone' | 'qr';
  contactValue?: string;
}
