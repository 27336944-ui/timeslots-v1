import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';


interface BlockWithVisibility {
  id: string;
  userId: string;
  nature: string;
  circleId: string | null;
}


@Injectable()
export class EventVisibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async filter<T extends BlockWithVisibility>(viewerId: string, blocks: T[]): Promise<T[]> {
    const viewerCircleIds = await this.loadViewerCircleIds(viewerId);
    return blocks.filter((b) => this.isVisible(b, viewerId, viewerCircleIds));
  }

  async canView<T extends BlockWithVisibility>(block: T, viewerId: string): Promise<boolean> {
    const viewerCircleIds = await this.loadViewerCircleIds(viewerId);
    return this.isVisible(block, viewerId, viewerCircleIds);
  }

  private isVisible<T extends BlockWithVisibility>(block: T, viewerId: string, viewerCircleIds: Set<string>): boolean {
    if (block.userId === viewerId) return true;
    if (block.nature === 'PUBLIC') return true;
    if (block.nature === 'PRIVATE') return false;
    if (block.nature === 'CIRCLE_ONLY') {
      if (!block.circleId) return true;
      return viewerCircleIds.has(block.circleId);
    }
    return true;
  }

  async getViewerCircleIds(viewerId: string): Promise<string[]> {
    const memberships = await this.prisma.client.circleMember.findMany({
      where: { userId: viewerId, isDeleted: false },
      select: { circleId: true },
    });
    return memberships.map((m) => m.circleId);
  }

  private async loadViewerCircleIds(viewerId: string): Promise<Set<string>> {
    const ids = await this.getViewerCircleIds(viewerId);
    return new Set(ids);
  }
}
