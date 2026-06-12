import { ApprovalRecipientResponseDto } from './approval-recipient-response.dto';


export class ApprovalResponseDto {
  id!: string;
  initiatorId!: string;
  blockId!: string;
  title!: string;
  startTime!: string;
  endTime!: string;
  description!: string | null;
  category!: string;
  status!: string;
  shareToken!: string;
  isInitiator!: boolean;
  recipients!: ApprovalRecipientResponseDto[];
  createdAt!: string;
}
