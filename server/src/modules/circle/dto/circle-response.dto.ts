import { CircleMemberResponseDto } from './circle-member-response.dto';


export class CircleResponseDto {
  id!: string;
  ownerId!: string;
  name!: string;
  description: string | null = null;
  inviteCode!: string;
  status!: string;
  memberCount!: number;
  members?: CircleMemberResponseDto[];
  myRole!: string;
  createdAt!: string;
  updatedAt!: string;
}
