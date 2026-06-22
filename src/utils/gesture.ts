

export interface GestureState {
  startX: number;
  startY: number;
  startTime: number;
  targetId: string;
}

export interface GestureResult {
  dx: number;
  dy: number;
  isHorizontal: boolean;
  isVertical: boolean;
  isLeftSwipe: boolean;
  isRightSwipe: boolean;
  swipeDistance: number;
  duration: number;
  targetId: string;
}

export const SWIPE_THRESHOLD = 30;
export const SWIPE_ACTION_THRESHOLD = 60;
export const LONG_PRESS_MS = 600;
export const CANCEL_MOVE_THRESHOLD = 10;

export function initGesture(id: string, x: number, y: number): GestureState {
  return { startX: x, startY: y, startTime: Date.now(), targetId: id };
}

export function analyzeSwipe(
  state: GestureState,
  endX: number,
  endY: number,
): GestureResult {
  const dx = endX - state.startX;
  const dy = Math.abs(endY - state.startY);
  const isHorizontal = Math.abs(dx) > dy;
  const isVertical = dy > Math.abs(dx);
  const isLeftSwipe = isHorizontal && dx < 0;
  const isRightSwipe = isHorizontal && dx > 0;
  return {
    dx, dy,
    isHorizontal, isVertical,
    isLeftSwipe, isRightSwipe,
    swipeDistance: Math.abs(dx),
    duration: Date.now() - state.startTime,
    targetId: state.targetId,
  };
}

export function isLongPress(
  state: GestureState,
  threshold: number = LONG_PRESS_MS,
): boolean {
  return (Date.now() - state.startTime) >= threshold;
}

export function shouldCancelLongPress(
  state: GestureState,
  currentX: number,
  currentY: number,
  threshold: number = CANCEL_MOVE_THRESHOLD,
): boolean {
  const dx = Math.abs(currentX - state.startX);
  const dy = Math.abs(currentY - state.startY);
  return dx > threshold || dy > threshold;
}
