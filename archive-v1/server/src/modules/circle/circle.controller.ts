import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards,
} from '@nestjs/common';
import { CircleService, CircleView } from './circle.service';
import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('api/v1/circles')
@UseGuards(JwtAuthGuard)
export class CircleController {
  constructor(private readonly circleService: CircleService) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateCircleDto,
  ): Promise<CircleView> {
    return this.circleService.create(userId, dto);
  }

  @Get('my')
  async findMy(@CurrentUser('userId') userId: string): Promise<CircleView[]> {
    return this.circleService.findMyCircles(userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CircleView> {
    return this.circleService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCircleDto,
  ): Promise<CircleView> {
    return this.circleService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ deleted: true }> {
    await this.circleService.remove(userId, id);
    return { deleted: true };
  }

  @Post(':id/invite')
  async getInviteCode(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ inviteCode: string }> {
    const code = await this.circleService.getInviteCode(userId, id);
    return { inviteCode: code };
  }

  @Post('join/:inviteCode')
  async joinByCode(
    @CurrentUser('userId') userId: string,
    @Param('inviteCode') inviteCode: string,
  ): Promise<CircleView> {
    return this.circleService.joinByCode(userId, inviteCode);
  }

  @Delete(':circleId/members/:memberId')
  async removeMember(
    @CurrentUser('userId') userId: string,
    @Param('circleId', ParseUUIDPipe) circleId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<{ deleted: true }> {
    await this.circleService.removeMember(userId, circleId, memberId);
    return { deleted: true };
  }
}
