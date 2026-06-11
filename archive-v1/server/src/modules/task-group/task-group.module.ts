import { Module } from '@nestjs/common';
import { TaskGroupController } from './task-group.controller';
import { TaskGroupService } from './task-group.service';

@Module({
  controllers: [TaskGroupController],
  providers: [TaskGroupService],
  exports: [TaskGroupService],
})
export class TaskGroupModule {}
