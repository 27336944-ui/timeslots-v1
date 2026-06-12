import { Controller, Post, Delete, Patch, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { WxLoginDto } from './dto/wx-login.dto';
import { MigrateDevDataDto } from './dto/migrate-dev-data.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { RestoreAccountDto } from './dto/restore-account.dto';


@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Post('wx-login')
  @HttpCode(HttpStatus.OK)
  async wxLogin(@Body() dto: WxLoginDto): Promise<LoginResponseDto> {
    return this.authService.wxLogin(dto);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<{ id: string; nickname: string; avatar: string | null }> {
    return this.authService.updateProfile(userId, dto);
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getSettings(
    @CurrentUser('userId') userId: string,
  ): Promise<Record<string, unknown>> {
    return this.authService.getSettings(userId);
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateSettings(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateSettingsDto,
  ): Promise<Record<string, unknown>> {
    return this.authService.updateSettings(userId, dto);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @CurrentUser('userId') userId: string,
  ): Promise<{ deleted: boolean; restoreToken: string }> {
    return this.authService.deleteAccount(userId);
  }

  @Post('restore')
  @HttpCode(HttpStatus.OK)
  async restoreAccount(
    @Body() dto: RestoreAccountDto,
  ): Promise<LoginResponseDto> {
    return this.authService.restoreAccount(dto);
  }

  @Post('migrate-dev-data')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async migrateDevData(
    @CurrentUser('userId') userId: string,
    @Body() dto: MigrateDevDataDto,
  ): Promise<{ migrated: number }> {
    return this.authService.migrateDevData(userId, dto.devUserId);
  }

  @Post('delete-dev-data')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteDevData(
    @CurrentUser('userId') userId: string,
    @Body() dto: MigrateDevDataDto,
  ): Promise<{ deleted: number }> {
    return this.authService.deleteDevData(userId, dto.devUserId);
  }
}
