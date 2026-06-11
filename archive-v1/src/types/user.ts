export interface UserProfile {
  profile: {
    nickname: string;
    subtitle: string;
  };
  quota: {
    permanent: number;
    monthly: number;
    expiresLabel: string;
  };
}
