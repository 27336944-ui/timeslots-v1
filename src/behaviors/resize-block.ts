import { blockStore } from '../stores/blockStore';
import { logError } from '../utils/logError';
import { HEIGHT_PER_MINUTE } from '../utils/block-grouper';

export const resizeBlockData = {
  _isResizing: false,
  resizeHeights: {} as Record<string, number>,
  resizeTimeHint: '',
};

export const resizeBlockMethods = {
  onResizeStart(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const data: Record<string, unknown> = this.data as Record<string, unknown>;
    const blocks = data.viewMode === 'week'
      ? ((data._weekBlocks as Record<string, unknown[]>)?.[data.selectedDay as string] || [])
      : blockStore.blocks;
    const block = (blocks as Array<{ id: string; endTime: string }>).find((b) => b.id === id);
    if (!block) return;
    const origHeight = (data.resizeHeights as Record<string, number>)[id] ||
      (data.hourGroups as Array<{ blocks: Array<{ id: string; blockHeight: number }> }>)
        .flatMap((g) => g.blocks)
        .find((b) => b.id === id)?.blockHeight || 60;
    const origEnd = new Date(block.endTime);
    const durationMin = origHeight / HEIGHT_PER_MINUTE;
    const origStart = new Date(origEnd.getTime() - durationMin * 60000);

    this.setData({
      _resizeBlockId: id,
      _resizeStartY: e.touches[0].clientY,
      _resizeOriginalHeight: origHeight,
      _resizeOriginalEndTime: block.endTime,
      _resizeOriginalStartTime: origStart.toISOString(),
      _isResizing: true,
      resizeTimeHint: '',
    } as Record<string, unknown>);
  },

  onResizeMove(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const data: Record<string, unknown> = this.data as Record<string, unknown>;
    const id = data._resizeBlockId as string | undefined;
    const startY = data._resizeStartY as number | undefined;
    const origStartStr = data._resizeOriginalStartTime as string | undefined;
    if (!id || startY === undefined || !origStartStr) return;
    const origStart = new Date(origStartStr);
    const dy = e.touches[0].clientY - startY;
    const origH = data._resizeOriginalHeight as number;
    const newHeight = Math.max(60, (origH || 60) + dy);
    const minuteDiff = Math.round(dy / HEIGHT_PER_MINUTE);
    const newEnd = new Date(origStart.getTime() + (newHeight / HEIGHT_PER_MINUTE) * 60000);
    const sh = String(origStart.getHours()).padStart(2, '0');
    const sm = String(origStart.getMinutes()).padStart(2, '0');
    const eh = String(newEnd.getHours()).padStart(2, '0');
    const em = String(newEnd.getMinutes()).padStart(2, '0');
    const diffStr = minuteDiff > 0 ? `+${minuteDiff}m` : `${minuteDiff}m`;
    this.setData({
      [`resizeHeights.${id}`]: newHeight,
      resizeTimeHint: `${sh}:${sm} - ${eh}:${em}（${diffStr}）`,
    });
  },

  onResizeEnd(this: WechatMiniprogram.Page.TrivialInstance) {
    const data: Record<string, unknown> = this.data as Record<string, unknown>;
    const id = data._resizeBlockId as string | undefined;
    const origHeight = data._resizeOriginalHeight as number | undefined;
    const origEndTime = data._resizeOriginalEndTime as string | undefined;
    this.setData({
      _resizeBlockId: undefined,
      _resizeStartY: undefined,
      _resizeOriginalHeight: undefined,
      _resizeOriginalEndTime: undefined,
      _resizeOriginalStartTime: undefined,
      _isResizing: false,
      resizeTimeHint: '',
    } as Record<string, unknown>);
    if (!id || !origHeight || !origEndTime) return;
    const newHeight = (data.resizeHeights as Record<string, number>)[id] || origHeight;
    const minuteDiff = Math.round((newHeight - origHeight) / HEIGHT_PER_MINUTE);
    if (Math.abs(minuteDiff) < 2) {
      const h = { ...(data.resizeHeights as Record<string, number>) };
      delete h[id];
      this.setData({ resizeHeights: h });
      return;
    }
    const newEnd = new Date(new Date(origEndTime).getTime() + minuteDiff * 60000);
    blockStore.updateBlock(id, { endTime: newEnd.toISOString() }).then(() => {
      (data.refreshView as () => void)?.();
    }).catch((e: unknown) => {
      logError('Schedule resize update', e);
      wx.showToast({ title: '调整失败', icon: 'none' });
      (data.refreshView as () => void)?.();
    });
  },
};
