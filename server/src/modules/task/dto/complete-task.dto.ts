import { IsString, MinLength } from 'class-validator';


export class CompleteTaskDto {
  @IsString()
  @MinLength(1)
  completedNote!: string;

  @IsString()
  @MinLength(1)
  retrospective!: string;
}
