export class CircleMemberResponseDto {
  id!: string;
  userId!: string;
  nickname!: string;
  avatar: string | null = null;
  role!: string;
  joinedAt!: string;
}
