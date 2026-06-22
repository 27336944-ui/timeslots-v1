import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SlotSuggesterService } from './slot-suggester.service';
import { SuggestSlotsRequestDto, SuggestSlotsResponseDto } from './dto/suggest-slots.dto';


@Controller('api/v1/ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly slotSuggester: SlotSuggesterService) {}

  @Post('suggest-slots')
  async suggestSlots(
    @CurrentUser('userId') userId: string,
    @Body() dto: SuggestSlotsRequestDto,
  ): Promise<SuggestSlotsResponseDto> {
    dto.userId = userId;
    const suggestions = await this.slotSuggester.suggest(dto);
    return { suggestions };
  }
}
