import { IsUUID, ArrayMinSize, ValidateNested, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';


class RecipientDto {
  @IsEnum(['friend', 'phone', 'qr'])
  contactType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  contactValue?: string;
}


export class CreateApprovalDto {
  @IsUUID()
  blockId!: string;

  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  recipients!: RecipientDto[];
}
