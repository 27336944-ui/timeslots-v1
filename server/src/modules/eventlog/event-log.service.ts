import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';


export interface EventPayload {
  source?: string;
  entityId?: string;
  stepId?: string;
  taskId?: string;
  categoryId?: string;
  fromStatus?: string;
  toStatus?: string;
  taskTitle?: string;
}


@Injectable()
export class EventLogService {
  private readonly logger = new Logger(EventLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(userId: string, eventType: string, payload: EventPayload): Promise<void> {
    try {
      await this.prisma.client.eventLog.create({
        data: {
          userId,
          eventType,
          payload: payload as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      this.logger.warn('[event-log] write failed:', err);
    }
  }
}
