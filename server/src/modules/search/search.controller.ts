import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SearchService, SearchResponseDto } from './search.service';

@Controller('api/v1/search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @CurrentUser('userId') userId: string,
    @Query('q') q: string,
  ): Promise<SearchResponseDto> {
    return this.searchService.search(userId, q);
  }
}
