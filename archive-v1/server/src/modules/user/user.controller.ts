import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { UserService, UserProfileView } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@CurrentUser('userId') userId: string): Promise<UserProfileView> {
    return this.userService.getProfile(userId);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileView> {
    return this.userService.updateProfile(userId, dto);
  }

  @Delete('me')
  async deleteAccount(@CurrentUser('userId') userId: string): Promise<{ message: string }> {
    await this.userService.requestDelete(userId);
    return { message: '账号删除已申请，7 天内可恢复' };
  }

  @Post('me/restore')
  async restoreAccount(@CurrentUser('userId') userId: string): Promise<{ message: string }> {
    await this.userService.restoreAccount(userId);
    return { message: '账号已恢复' };
  }
}
