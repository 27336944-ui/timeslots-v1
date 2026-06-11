
import { IsUUID } from 'class-validator';


export class MigrateDevDataDto {
  @IsUUID()
  devUserId!: string;
}
