import { IsString } from 'class-validator';

export class DeliverDelegationDto {
  @IsString()
  note!: string;
}
