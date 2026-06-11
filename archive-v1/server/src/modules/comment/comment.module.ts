import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

/**
 * 评论模块。
 *
 * 关联 TimeBlock 的上下文评论。
 *
 * 路由：
 * - `POST /api/v1/time-blocks/:blockId/comments` — 创建评论
 * - `GET  /api/v1/time-blocks/:blockId/comments` — 查询评论列表
 * - `PATCH  /api/v1/comments/:id`                — 修改评论
 * - `DELETE /api/v1/comments/:id`                — 软删除评论
 */
@Module({
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
