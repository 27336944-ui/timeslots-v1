import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { ShareService } from './share.service';
import { CreateShareRecipientDto, UpdateShareRecipientDto, StealthDto } from './dto/share.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';


@Controller('api/v1/share')
@UseGuards(JwtAuthGuard)
export class ShareController {
  constructor(private readonly service: ShareService) {}

  @Get('recipients')
  async listRecipients(@CurrentUser('userId') userId: string) {
    return this.service.findAll(userId);
  }

  @Post('recipients')
  async createRecipient(@CurrentUser('userId') userId: string, @Body() dto: CreateShareRecipientDto) {
    return this.service.create(userId, dto);
  }

  @Patch('recipients/:id')
  async updateRecipient(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateShareRecipientDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @Delete('recipients/:id')
  async removeRecipient(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }

  @Get('stealth')
  async getStealth(@CurrentUser('userId') userId: string) {
    return this.service.getStealth(userId);
  }

  @Post('stealth')
  async setStealth(@CurrentUser('userId') userId: string, @Body() dto: StealthDto) {
    if (dto.action === 'off') {
      return this.service.disableStealth(userId);
    }
    return this.service.setStealth(userId, dto.durationMinutes);
  }
}
