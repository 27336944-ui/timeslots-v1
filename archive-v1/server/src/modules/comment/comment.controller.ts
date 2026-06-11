import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommentService, CommentView } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('time-blocks/:blockId/comments')
  async create(
    @CurrentUser('userId') userId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentView> {
    return this.commentService.create(userId, blockId, dto);
  }

  @Get('time-blocks/:blockId/comments')
  async findByBlock(
    @CurrentUser('userId') userId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
  ): Promise<CommentView[]> {
    return this.commentService.findByBlock(userId, blockId);
  }

  @Patch('comments/:id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommentDto,
  ): Promise<CommentView> {
    return this.commentService.update(userId, id, dto);
  }

  @Delete('comments/:id')
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ deleted: true }> {
    await this.commentService.remove(userId, id);
    return { deleted: true };
  }
}
