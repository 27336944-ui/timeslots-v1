import { blockStore } from '../stores/blockStore';
import { logError } from '../utils/logError';
import { initGesture, shouldCancelLongPress } from '../utils/gesture';

export const longpressBlockData = {
  _longPressTimer: undefined as ReturnType<typeof setTimeout> | undefined,
};

export const longpressBlockMethods = {
  onBlockLongPressStart(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const gst = initGesture(id, e.touches[0].clientX, e.touches[0].clientY);

    const timer = setTimeout(() => {
      this.setData({ _longPressTimer: undefined } as Record<string, unknown>);
      const data: Record<string, unknown> = this.data as Record<string, unknown>;
      if ((data._swipeGesture as typeof gst | undefined)?.targetId !== id) return;

      const blocks = data.viewMode === 'week'
        ? ((data._weekBlocks as Record<string, unknown[]>)?.[data.selectedDay as string] || [])
        : blockStore.blocks;
      const block = (blocks as Array<{ id: string; source: string }>).find((b) => b.id === id);
      const isFlexible = block?.source === 'flexible';
      const itemList = isFlexible
        ? ['编辑', '删除', '标记完成', '放回任务池']
        : ['编辑', '删除', '标记完成'];

      wx.showActionSheet({
        itemList,
        success: (res: WechatMiniprogram.ShowActionSheetSuccessCallbackResult) => {
          const bid = id;
          if (res.tapIndex === 0) {
            wx.navigateTo({ url: `/pages/schedule/detail/index?id=${bid}&mode=edit` });
          } else if (res.tapIndex === 1) {
            wx.showModal({
              title: '确认移除',
              content: '移除了就不会出现在时间轴上',
              confirmColor: '#e74c3c',
              success: (m) => {
                if (m.confirm) {
                  blockStore.deleteBlock(bid).then(() => {
                    (data.refreshView as () => void)?.();
                  }).catch((e: unknown) => {
                    logError('Schedule deleteBlock', e);
                    wx.showToast({ title: '删除失败', icon: 'none' });
                  });
                }
              },
            });
          } else if (res.tapIndex === 2) {
            blockStore.updateBlock(bid, { status: 'done' }).then(() => {
              (data.refreshView as () => void)?.();
            }).catch((e: unknown) => {
              logError('Schedule updateBlock done', e);
              wx.showToast({ title: '出了点问题，再试一次', icon: 'none' });
            });
          } else if (isFlexible && res.tapIndex === 3) {
            import('../services/api').then(({ unplaceBlock: ub }) => {
              ub(bid).then(() => {
                wx.showToast({ title: '已放回任务池', icon: 'success', duration: 1000 });
                (data.refreshView as () => void)?.();
              }).catch((e: unknown) => {
                logError('Schedule unplaceBlock', e);
                wx.showToast({ title: '操作失败', icon: 'none' });
              });
            });
          }
        },
      });
    }, 600);

    this.setData({
      _swipeId: id,
      _swipeGesture: gst,
      _longPressTimer: timer,
    } as Record<string, unknown>);
  },

  onBlockLongPressMove(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const data: Record<string, unknown> = this.data as Record<string, unknown>;
    const timer = data._longPressTimer as ReturnType<typeof setTimeout> | undefined;
    const gs = data._swipeGesture as ReturnType<typeof initGesture> | undefined;
    if (timer && gs) {
      if (shouldCancelLongPress(gs, e.touches[0].clientX, e.touches[0].clientY)) {
        clearTimeout(timer);
        this.setData({ _longPressTimer: undefined } as Record<string, unknown>);
      }
    }
  },

  onBlockLongPressEnd(this: WechatMiniprogram.Page.TrivialInstance) {
    const data: Record<string, unknown> = this.data as Record<string, unknown>;
    const timer = data._longPressTimer as ReturnType<typeof setTimeout> | undefined;
    if (timer) {
      clearTimeout(timer);
      this.setData({ _longPressTimer: undefined } as Record<string, unknown>);
    }
  },
};
