import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CircleService } from './circle.service';
import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { CircleResponseDto } from './dto/circle-response.dto';
import { InviteResponseDto } from './dto/invite-response.dto';
import { AddCircleMembersDto } from './dto/add-circle-members.dto';
import { MemberSlotsDto } from './dto/member-availability.dto';


@Controller('api/v1/circles')
@UseGuards(JwtAuthGuard)
export class CircleController {
  constructor(private readonly circleService: CircleService) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateCircleDto,
  ): Promise<CircleResponseDto> {
    return this.circleService.create(userId, dto);
  }

  @Get('my')
  async findMyCircles(
    @CurrentUser('userId') userId: string,
  ): Promise<CircleResponseDto[]> {
    return this.circleService.findMyCircles(userId);
  }

  @Get(':id')
  async findById(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<CircleResponseDto> {
    return this.circleService.findById(userId, id);
  }

  @Get(':circleId/availability')
  async getAvailability(
    @CurrentUser('userId') userId: string,
    @Param('circleId') circleId: string,
    @Query('date') date: string,
  ): Promise<MemberSlotsDto[]> {
    return this.circleService.getMemberAvailability(userId, circleId, date);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCircleDto,
  ): Promise<CircleResponseDto> {
    return this.circleService.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<{ deleted: boolean }> {
    await this.circleService.softDelete(userId, id);
    return { deleted: true };
  }

  @Post(':id/invite')
  async invite(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ): Promise<InviteResponseDto> {
    return this.circleService.invite(userId, id);
  }

  @Post('join/:code')
  async joinByCode(
    @CurrentUser('userId') userId: string,
    @Param('code') code: string,
  ): Promise<CircleResponseDto> {
    return this.circleService.joinByCode(userId, code);
  }

  @Post(':circleId/leave')
  async leaveCircle(
    @CurrentUser('userId') userId: string,
    @Param('circleId') circleId: string,
  ): Promise<{ deleted: boolean }> {
    await this.circleService.leaveCircle(userId, circleId);
    return { deleted: true };
  }

  @Delete(':circleId/members/:memberId')
  async removeMember(
    @CurrentUser('userId') userId: string,
    @Param('circleId') circleId: string,
    @Param('memberId') memberId: string,
  ): Promise<{ deleted: boolean }> {
    await this.circleService.removeMember(userId, circleId, memberId);
    return { deleted: true };
  }

  @Post(':circleId/members')
  async addMembers(
    @CurrentUser('userId') userId: string,
    @Param('circleId') circleId: string,
    @Body() dto: AddCircleMembersDto,
  ): Promise<CircleResponseDto> {
    return this.circleService.addMembers(userId, circleId, dto.userIds);
  }
}
