/** One-shot captures run before the browser discards a non-preserved WebGL buffer. */
const captures = new WeakMap<HTMLCanvasElement, () => void>();

export function requestPresentedFrame(canvas: HTMLCanvasElement, capture: () => void) {
  captures.set(canvas, capture);
  return () => {
    if (captures.get(canvas) === capture) captures.delete(canvas);
  };
}

export function finishPresentedFrame(canvas: HTMLCanvasElement): void {
  const capture = captures.get(canvas);
  if (!capture) return;
  captures.delete(canvas);
  capture();
}
