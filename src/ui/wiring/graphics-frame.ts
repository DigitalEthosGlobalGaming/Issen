import { requestPresentedFrame } from '../../rendering/presented-frame.ts';
import { trackPixelSource } from '../../platform/pixel-memory.ts';

/** Retain one accounted colour frame independently of scenery resource admission. */
export function createGraphicsFrameRetention(canvas: HTMLCanvasElement) {
  const doc = canvas.ownerDocument;
  let held: HTMLCanvasElement | undefined;
  let cancel: (() => void) | undefined;
  let showing = false;
  let afterCapture: (() => void) | undefined;
  return {
    get pending() {
      return !!cancel;
    },
    whenCaptured(action: () => void) {
      afterCapture = action;
    },
    cancelCommit() {
      afterCapture = undefined;
    },
    request() {
      if (held || cancel || canvas.dataset.sceneState !== 'ready') return;
      cancel = requestPresentedFrame(canvas, () => {
        cancel = undefined;
        const copy = trackPixelSource(doc, doc.createElement('canvas'), 'canvas');
        copy.width = canvas.width;
        copy.height = canvas.height;
        copy.getContext('2d')!.drawImage(canvas, 0, 0);
        copy.className = 'graphics-retained-frame';
        copy.setAttribute('aria-hidden', 'true');
        copy.hidden = !showing;
        canvas.after(copy);
        held = copy;
        const action = afterCapture;
        afterCapture = undefined;
        action?.();
      });
    },
    show() {
      showing = true;
      if (held) held.hidden = false;
    },
    clear() {
      cancel?.();
      cancel = undefined;
      showing = false;
      afterCapture = undefined;
      if (held) {
        held.remove();
        held.width = held.height = 0;
        held = undefined;
      }
    },
  };
}
