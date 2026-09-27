import type { Direction } from '../shared/directions.ts';

export interface PointerActions {
  activate(): void;
  threshold(): number;
  swipe(direction: Direction): void;
  tapDown(): boolean;
  tap(): void;
}

export function bindPointer(canvas: HTMLCanvasElement, actions: PointerActions): () => void {
  const listeners = new AbortController();
  const { signal } = listeners;
  let pointer: { id: number; x: number; y: number; used: boolean } | null = null;
  const swipe = (dx: number, dy: number) =>
    actions.swipe(
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up',
    );
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      event.preventDefault();
      actions.activate();
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, used: false };
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        /* Capture can be unavailable. */
      }
      if (actions.tapDown()) pointer.used = true;
    },
    { passive: false, signal },
  );
  canvas.addEventListener(
    'pointermove',
    (event) => {
      if (!pointer || event.pointerId !== pointer.id || pointer.used) return;
      const dx = event.clientX - pointer.x,
        dy = event.clientY - pointer.y;
      const threshold = actions.threshold();
      if (dx * dx + dy * dy > threshold * threshold) {
        pointer.used = true;
        swipe(dx, dy);
      }
    },
    { signal },
  );
  const end = (event: PointerEvent) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (!pointer.used && event.type === 'pointerup') {
      const dx = event.clientX - pointer.x,
        dy = event.clientY - pointer.y;
      const threshold = actions.threshold();
      if (dx * dx + dy * dy > threshold * threshold * 0.25) swipe(dx, dy);
      else actions.tap();
    }
    pointer = null;
  };
  canvas.addEventListener('pointerup', end, { signal });
  canvas.addEventListener('pointercancel', end, { signal });
  canvas.addEventListener(
    'lostpointercapture',
    (event) => {
      if (event.pointerId === pointer?.id) pointer = null;
    },
    { signal },
  );
  canvas.addEventListener('contextmenu', (event) => event.preventDefault(), { signal });
  return () => {
    listeners.abort();
    pointer = null;
  };
}
