import { Module } from '@nestjs/common';
import { CircleController } from './circle.controller';
import { CircleService } from './circle.service';

/**
 * 圈子（Circle）模块。
 *
 * 圈子是共享日程的容器。owner 创建后通过 inviteCode 邀请他人加入。
 *
 * 路由：
 * - `POST   /api/v1/circles`                    创建圈子
 * - `GET    /api/v1/circles/my`                 我的圈子列表
 * - `GET    /api/v1/circles/:id`                圈子详情
 * - `PATCH  /api/v1/circles/:id`                更新圈子
 * - `DELETE /api/v1/circles/:id`                软删除圈子
 * - `POST   /api/v1/circles/:id/invite`         生成/获取 inviteCode
 * - `POST   /api/v1/circles/join/:inviteCode`   通过 inviteCode 加入
 * - `DELETE /api/v1/circles/:id/members/:memberId` 踢出成员
 */
@Module({
  controllers: [CircleController],
  providers: [CircleService],
  exports: [CircleService],
})
export class CircleModule {}
