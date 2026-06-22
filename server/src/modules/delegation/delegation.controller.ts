import {
  Controller, Get, Post, Patch, Param, Body, UseGuards,
} from '@nestjs/common';
import { DelegationService } from './delegation.service';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { RespondDelegationDto } from './dto/respond-delegation.dto';
import { DeliverDelegationDto } from './dto/deliver-delegation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';


@Controller('api/v1/delegations')
@UseGuards(JwtAuthGuard)
export class DelegationController {
  constructor(private readonly service: DelegationService) {}

  @Post()
  async create(@CurrentUser('userId') userId: string, @Body() dto: CreateDelegationDto) {
    return this.service.create(userId, dto);
  }

  @Get('my')
  async findMy(@CurrentUser('userId') userId: string) {
    return this.service.findMy(userId);
  }

  @Get(':id')
  async findById(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.service.findById(userId, id);
  }

  @Patch(':id/respond')
  async respond(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: RespondDelegationDto,
  ) {
    return this.service.respond(userId, id, dto);
  }

  @Post(':id/deliver')
  async deliver(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: DeliverDelegationDto,
  ) {
    return this.service.deliver(userId, id, dto);
  }
}
