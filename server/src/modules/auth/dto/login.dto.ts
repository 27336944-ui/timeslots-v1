import { IsUUID } from 'class-validator';


export class LoginDto {
  @IsUUID()
  userId!: string;
}


export class LoginResponseDto {
  accessToken!: string;
  user!: {
    id: string;
    nickname: string;
    avatar: string | null;
  };
}
