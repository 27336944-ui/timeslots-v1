import { CircleMemberResponseDto } from './circle-member-response.dto';


export class CircleResponseDto {
  id!: string;
  ownerId!: string;
  name!: string;
  parentId: string | null = null;
  level: number = 1;
  isFixed: boolean = false;
  isDefault: boolean = false;
  sortOrder: number = 0;
  description: string | null = null;
  inviteCode!: string;
  status!: string;
  memberCount!: number;
  members?: CircleMemberResponseDto[];
  myRole!: string;
  createdAt!: string;
  updatedAt!: string;
}
