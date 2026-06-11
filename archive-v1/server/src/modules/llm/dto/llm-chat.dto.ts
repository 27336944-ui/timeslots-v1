import { IsString, IsArray, IsOptional, IsObject, ArrayMinSize } from 'class-validator';

export class LlmChatDto {
  @IsArray()
  @ArrayMinSize(1)
  messages!: { role: string; content: string }[];

  @IsString()
  @IsOptional()
  templateKey?: string;

  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;
}
