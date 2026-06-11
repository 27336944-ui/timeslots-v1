import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CoachService } from './coach.service';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { GenerateCardDto } from './dto/generate-card.dto';

@Controller('api/v1/coach')
@UseGuards(AuthGuard('jwt'))
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Get('cards')
  listCards(@CurrentUser('userId') userId: string) {
    return this.coachService.listCards(userId);
  }

  @Get('cards/:id')
  getCard(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.coachService.getCard(userId, id);
  }

  @Post('cards/:id/feedback')
  submitFeedback(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.coachService.submitFeedback(userId, id, dto);
  }

  @Post('cards/generate')
  generateCard(
    @CurrentUser('userId') userId: string,
    @Body() dto: GenerateCardDto,
  ) {
    if (dto.startDate && dto.endDate) {
      return this.coachService.generateWeekly(userId);
    }
    return this.coachService.generateDaily(userId);
  }
}
