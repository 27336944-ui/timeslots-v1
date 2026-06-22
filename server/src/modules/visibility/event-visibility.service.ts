import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';


interface BlockWithVisibility {
  id: string;
  userId: string;
  nature: string;
  circleId: string | null;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class VisibilityCache {
  private readonly ttl = 60000; // 60 seconds
  private readonly circleCache = new Map<string, CacheEntry<Set<string>>>();
  private readonly stealthCache = new Map<string, CacheEntry<Set<string>>>();

  getCircleIds(viewerId: string): Set<string> | undefined {
    const entry = this.circleCache.get(viewerId);
    if (entry && Date.now() < entry.expiresAt) return entry.value;
    this.circleCache.delete(viewerId);
    return undefined;
  }

  setCircleIds(viewerId: string, ids: Set<string>): void {
    this.circleCache.set(viewerId, { value: ids, expiresAt: Date.now() + this.ttl });
  }

  getStealthSet(key: string): Set<string> | undefined {
    const entry = this.stealthCache.get(key);
    if (entry && Date.now() < entry.expiresAt) return entry.value;
    this.stealthCache.delete(key);
    return undefined;
  }

  setStealthSet(key: string, ids: Set<string>): void {
    this.stealthCache.set(key, { value: ids, expiresAt: Date.now() + this.ttl });
  }

  /** Invalidate all circle-related caches — call on CircleService member change */
  invalidateCircles(): void {
    this.circleCache.clear();
  }

  /** Invalidate stealth caches for a specific user — call on StealthService.toggle() */
  invalidateStealth(_userId: string): void {
    // Stealth keys are per-ownerId-set, clear all entries that included this user
    // For simplicity, clear everything since stealth is rare
    this.stealthCache.clear();
  }

  /** Full invalidation */
  invalidateAll(): void {
    this.circleCache.clear();
    this.stealthCache.clear();
  }
}


@Injectable()
export class EventVisibilityService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly cache = new VisibilityCache();

  /** Exposed for CircleService / StealthService to invalidate on data change */
  invalidateCircleCache(): void {
    this.cache.invalidateCircles();
  }

  invalidateStealthCache(_userId?: string): void {
    this.cache.invalidateStealth(_userId ?? '');
  }

  async filter<T extends BlockWithVisibility>(viewerId: string, blocks: T[]): Promise<T[]> {
    const [viewerCircleIds, shareSet, stealthSet] = await Promise.all([
      this.loadViewerCircleIds(viewerId),
      this.loadShareRecipientUserIds(viewerId),
      this.getStealthUserIds(blocks.map(b => b.userId)),
    ]);
    return blocks.filter((b) => this.isVisible(b, viewerId, viewerCircleIds, shareSet, stealthSet));
  }

  async canView<T extends BlockWithVisibility>(block: T, viewerId: string): Promise<boolean> {
    const [viewerCircleIds, shareSet, stealthSet] = await Promise.all([
      this.loadViewerCircleIds(viewerId),
      this.loadShareRecipientUserIds(viewerId),
      this.getStealthUserIds([block.userId]),
    ]);
    return this.isVisible(block, viewerId, viewerCircleIds, shareSet, stealthSet);
  }

  private isVisible<T extends BlockWithVisibility>(
    block: T, viewerId: string, viewerCircleIds: Set<string>,
    shareSet: Set<string>, stealthSet: Set<string>,
  ): boolean {
    if (block.userId === viewerId) return true;
    if (stealthSet.has(block.userId)) return false;
    if (block.nature === 'PUBLIC') {
      return true;
    }
    if (block.nature === 'PRIVATE') {
      return shareSet.has(block.userId);
    }
    if (block.nature === 'CIRCLE_ONLY') {
      if (!block.circleId) return false;
      if (viewerCircleIds.has(block.circleId)) return true;
      return shareSet.has(block.userId);
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
    const cached = this.cache.getCircleIds(viewerId);
    if (cached) return cached;
    const ids = await this.getViewerCircleIds(viewerId);
    const set = new Set(ids);
    this.cache.setCircleIds(viewerId, set);
    return set;
  }

  async getShareRecipientUserIds(ownerId: string): Promise<string[]> {
    const recipients = await this.prisma.client.shareRecipient.findMany({
      where: { userId: ownerId, isDeleted: false, status: 'active' },
      select: { targetUserId: true },
    });
    return recipients.map(r => r.targetUserId);
  }

  private async loadShareRecipientUserIds(viewerId: string): Promise<Set<string>> {
    const owners = await this.prisma.client.shareRecipient.findMany({
      where: { targetUserId: viewerId, isDeleted: false, status: 'active' },
      select: { userId: true },
    });
    return new Set(owners.map(o => o.userId));
  }

  private async getStealthUserIds(ownerIds: string[]): Promise<Set<string>> {
    if (ownerIds.length === 0) return new Set();
    const key = ownerIds.sort().join(',');
    const cached = this.cache.getStealthSet(key);
    if (cached) return cached;
    const users = await this.prisma.client.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, settings: true },
    });
    const now = new Date();
    const stealthIds = new Set<string>();
    for (const u of users) {
      const settings = (u.settings ?? {}) as Record<string, unknown>;
      if (settings.stealthMode) {
        const expiresAt = settings.stealthExpiresAt as string | undefined;
        if (expiresAt && new Date(expiresAt) < now) continue;
        stealthIds.add(u.id);
      }
    }
    this.cache.setStealthSet(key, stealthIds);
    return stealthIds;
  }
}
