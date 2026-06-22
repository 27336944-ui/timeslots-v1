import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';


export class AddCircleMembersDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  userIds!: string[];
}