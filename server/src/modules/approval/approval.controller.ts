import {
  Controller, Get, Post, Patch, Param, Body, UseGuards,
} from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { RespondApprovalDto } from './dto/respond-approval.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';


@Controller('api/v1/approvals')
@UseGuards(JwtAuthGuard)
export class ApprovalController {
  constructor(private readonly service: ApprovalService) {}

  @Post()
  async create(@CurrentUser('userId') userId: string, @Body() dto: CreateApprovalDto) {
    return this.service.create(userId, dto);
  }

  @Get('my-initiated')
  async findMyInitiated(@CurrentUser('userId') userId: string) {
    return this.service.findMyInitiated(userId);
  }

  @Get('my-pending')
  async findMyPending(@CurrentUser('userId') userId: string) {
    return this.service.findMyPending(userId);
  }

  @Get(':id')
  async findById(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.service.findById(userId, id);
  }

  @Patch(':requestId/recipients/:recipientId')
  async respond(
    @CurrentUser('userId') userId: string,
    @Param('requestId') requestId: string,
    @Param('recipientId') recipientId: string,
    @Body() dto: RespondApprovalDto,
  ) {
    return this.service.respond(userId, requestId, recipientId, dto);
  }

  @Post(':requestId/recipients/:recipientId/resend')
  async resend(
    @CurrentUser('userId') userId: string,
    @Param('requestId') requestId: string,
    @Param('recipientId') recipientId: string,
  ) {
    return this.service.resend(userId, requestId, recipientId);
  }

  @Post(':id/cancel')
  async cancel(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.service.cancel(userId, id);
  }

  @Public()
  @Get('shared/:token')
  async getByShareToken(@Param('token') token: string) {
    return this.service.getByShareToken(token);
  }

  @Post(':requestId/bind')
  async bindRecipient(
    @CurrentUser('userId') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.service.bindRecipient(userId, requestId);
  }
}
