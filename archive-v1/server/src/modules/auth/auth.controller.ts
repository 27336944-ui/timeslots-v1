import { Body, Controller, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';

class LoginDto {
  @IsString()
  userId!: string;
}

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<{ accessToken: string }> {
    return this.authService.login(dto.userId);
  }
}
