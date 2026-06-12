import { IsEnum } from 'class-validator';


export class RespondApprovalDto {
  @IsEnum(['approve', 'reject'])
  action!: string;
}
