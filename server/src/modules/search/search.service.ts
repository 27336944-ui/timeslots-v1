import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export class SearchResultItemDto {
  type!: 'timeblock' | 'task' | 'circle';
  id!: string;
  title!: string;
  subtitle!: string | null;
}

export class SearchResponseDto {
  results!: SearchResultItemDto[];
  total!: number;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(userId: string, q: string): Promise<SearchResponseDto> {
    const query = q.trim();
    if (!query) {
      return { results: [], total: 0 };
    }

    const [timeBlocks, tasks, circles] = await Promise.all([
      this.searchTimeBlocks(userId, query),
      this.searchTasks(userId, query),
      this.searchCircles(userId, query),
    ]);

    const results = [...timeBlocks, ...tasks, ...circles];
    return { results, total: results.length };
  }

  private async searchTimeBlocks(userId: string, q: string): Promise<SearchResultItemDto[]> {
    const blocks = await this.prisma.client.timeBlock.findMany({
      where: {
        userId,
        isDeleted: false,
        title: { contains: q },
      },
      select: { id: true, title: true },
      take: 20,
    });

    return blocks.map((b) => ({
      type: 'timeblock' as const,
      id: b.id,
      title: b.title,
      subtitle: null,
    }));
  }

  private async searchTasks(userId: string, q: string): Promise<SearchResultItemDto[]> {
    const tasks = await this.prisma.client.task.findMany({
      where: {
        userId,
        isDeleted: false,
        OR: [
          { title: { contains: q } },
          { goal: { contains: q } },
        ],
      },
      select: { id: true, title: true, goal: true },
      take: 20,
    });

    return tasks.map((t) => ({
      type: 'task' as const,
      id: t.id,
      title: t.title,
      subtitle: t.goal,
    }));
  }

  private async searchCircles(userId: string, q: string): Promise<SearchResultItemDto[]> {
    const circles = await this.prisma.client.circle.findMany({
      where: {
        isDeleted: false,
        name: { contains: q },
        OR: [
          { ownerId: userId },
          { members: { some: { userId, isDeleted: false } } },
        ],
      },
      select: { id: true, name: true, description: true },
      take: 20,
    });

    return circles.map((c) => ({
      type: 'circle' as const,
      id: c.id,
      title: c.name,
      subtitle: c.description,
    }));
  }
}
