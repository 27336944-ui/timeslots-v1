
import { IsString, MinLength } from 'class-validator';


export class WxLoginDto {
  @IsString()
  @MinLength(1)
  code!: string;
}
