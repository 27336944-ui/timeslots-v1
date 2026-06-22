import { Injectable, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException, ErrorCodes } from '../../common/exceptions/business-exception';
import { ShareCardResponseDto, ShareCardRespondResponse, TimeSlotDto, ShareCardRespondDto } from './dto/share-card.dto';


@Injectable()
export class ShareCardService {
  constructor(private readonly prisma: PrismaService) {}

  async generateShareCard(userId: string, date: string): Promise<ShareCardResponseDto> {
    const user = await this.prisma.client.user.findFirst({ where: { id: userId, isDeleted: false } });
    const userName = user?.nickname || '用户';

    const blocks = await this.prisma.client.timeBlock.findMany({
      where: { userId, isDeleted: false },
      select: { startTime: true, endTime: true },
    });
    const sorted = [...blocks].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );

    const busySlots: TimeSlotDto[] = sorted.map((b) => ({
      start: b.startTime.toISOString(),
      end: b.endTime.toISOString(),
    }));

    const dayStart = new Date(`${date}T00:00:00+08:00`);
    const dayEnd = new Date(`${date}T23:59:59+08:00`);

    const freeSlots: TimeSlotDto[] = [];
    let cursor = dayStart.getTime();
    for (const b of sorted) {
      const bs = b.startTime.getTime();
      if (bs > cursor) {
        freeSlots.push({
          start: new Date(cursor).toISOString(),
          end: b.startTime.toISOString(),
        });
      }
      const be = b.endTime.getTime();
      if (be > cursor) cursor = be;
    }
    if (dayEnd.getTime() > cursor) {
      freeSlots.push({
        start: new Date(cursor).toISOString(),
        end: dayEnd.toISOString(),
      });
    }

    const token = uuidv4();
    const now = new Date();

    await this.prisma.client.shareCard.create({
      data: {
        token,
        userId,
        userName,
        date,
        busySlots: JSON.parse(JSON.stringify(busySlots)),
        freeSlots: JSON.parse(JSON.stringify(freeSlots)),
        responses: [],
        createdAt: now,
      },
    });

    return {
      token,
      userName,
      date,
      busySlots,
      freeSlots,
      responses: [],
      createdAt: now.toISOString(),
    };
  }

  async getShareCard(token: string): Promise<ShareCardResponseDto | null> {
    const card = await this.prisma.client.shareCard.findFirst({ where: { token } });
    if (!card) return null;

    const busySlots = (card.busySlots as { start: string; end: string }[]).map(
      (s) => ({ start: s.start, end: s.end }),
    );
    const freeSlots = (card.freeSlots as { start: string; end: string }[]).map(
      (s) => ({ start: s.start, end: s.end }),
    );
    const responses = (card.responses as unknown as ShareCardRespondResponse[]).map(
      (r) => ({
        startTime: r.startTime,
        endTime: r.endTime,
        userName: r.userName,
        createdAt: r.createdAt,
      }),
    );

    return {
      token: card.token,
      userName: card.userName,
      date: card.date,
      busySlots,
      freeSlots,
      responses,
      createdAt: card.createdAt.toISOString(),
    };
  }

  async respondToShareCard(
    token: string,
    dto: ShareCardRespondDto,
  ): Promise<ShareCardRespondResponse> {
    const card = await this.prisma.client.shareCard.findFirst({ where: { token } });
    if (!card) {
      throw new BusinessException(ErrorCodes.EVENT_NOT_FOUND, '分享卡片不存在或已过期', HttpStatus.NOT_FOUND);
    }

    const response: ShareCardRespondResponse = {
      startTime: dto.startTime,
      endTime: dto.endTime,
      userName: dto.userName || '朋友',
      createdAt: new Date().toISOString(),
    };

    const currentResponses = (card.responses as unknown as ShareCardRespondResponse[]) || [];
    currentResponses.push(response);

    await this.prisma.client.shareCard.update({
      where: { id: card.id },
      data: { responses: JSON.parse(JSON.stringify(currentResponses)) },
    });

    return response;
  }
}