
import { IsUUID, IsString } from 'class-validator';


export class RestoreAccountDto {
  @IsUUID()
  userId!: string;

  @IsString()
  restoreToken!: string;
}
