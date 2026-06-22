export interface ShareRecipient {
  id: string;
  targetUserId: string;
  targetName: string;
  level: 'full' | 'freebusy' | 'invite_only';
  status: 'active' | 'revoked';
  expiresAt: string | null;
  createdAt: string;
}

export interface CreateShareRecipientParams extends Record<string, unknown> {
  targetUserId: string;
  level?: string;
  expiresAt?: string;
}

export interface UpdateShareRecipientParams extends Record<string, unknown> {
  level?: string;
  status?: string;
  expiresAt?: string;
}

export interface StealthStatus {
  enabled: boolean;
  expiresAt: string | null;
}
