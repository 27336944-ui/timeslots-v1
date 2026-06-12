export class ApprovalRecipientResponseDto {
  id!: string;
  contactType!: string;
  contactValue!: string | null;
  status!: string;
  respondedAt!: string | null;
}
