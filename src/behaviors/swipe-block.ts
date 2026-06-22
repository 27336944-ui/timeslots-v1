import { blockStore } from '../stores/blockStore';
import { initGesture, analyzeSwipe, SWIPE_ACTION_THRESHOLD, CANCEL_MOVE_THRESHOLD } from '../utils/gesture';

export const swipeBlockData = {
  swipeOffset: {} as Record<string, number>,
};

export const swipeBlockMethods = {
  onBlockTouchStart(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const gst = initGesture(id, e.touches[0].clientX, e.touches[0].clientY);
    this.setData({ _swipeId: id, _swipeGesture: gst } as Record<string, unknown>);
  },

  onBlockTouchMove(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const data: Record<string, unknown> = this.data as Record<string, unknown>;
    const stepId = data._swipeId as string | undefined;
    const gst = data._swipeGesture as ReturnType<typeof initGesture> | undefined;
    if (!stepId || !gst) return;
    const g = analyzeSwipe(gst, e.touches[0].clientX, e.touches[0].clientY);
    const clamped = Math.max(-60, Math.min(0, g.dx));
    this.setData({ [`swipeOffset.${stepId}`]: clamped });
  },

  onBlockTouchEnd(this: WechatMiniprogram.Page.TrivialInstance, e: WechatMiniprogram.TouchEvent) {
    const data: Record<string, unknown> = this.data as Record<string, unknown>;
    const gst = data._swipeGesture as ReturnType<typeof initGesture> | undefined;
    const id = data._swipeId as string | undefined;
    this.setData({
      _swipeGesture: undefined,
      _swipeId: undefined,
      [`swipeOffset.${id || ''}`]: 0,
    } as Record<string, unknown>);
    if (!gst || !id) return;
    if (!e.changedTouches[0]) return;
    const result = analyzeSwipe(gst, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    if (result.swipeDistance > SWIPE_ACTION_THRESHOLD && result.dy < CANCEL_MOVE_THRESHOLD) {
      blockStore.updateBlock(id, { status: 'done' }).then(() => {
        wx.showToast({ title: '标记完成', icon: 'success', duration: 1000 });
        (data.refreshView as () => void)?.();
      }).catch((e: unknown) => {
        console.error('[Schedule] swipe done failed:', e);
        wx.showToast({ title: '出了点问题，再试一次', icon: 'none' });
      });
    }
  },
};
