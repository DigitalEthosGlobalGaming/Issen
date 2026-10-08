/** Required renderer capabilities failed; no alternate scene backend exists. */
export class GraphicsUnsupportedError extends Error {
  constructor(cause?: unknown) {
    super('This device’s graphics are not supported by Issen.', { cause });
    this.name = 'GraphicsUnsupportedError';
  }
}
export const GRAPHICS_ERROR_EVENT = 'issen-graphics-error';
export function reportGraphicsError(canvas: HTMLCanvasElement, reload = true): void {
  canvas.dataset.contextState = 'unsupported';
  canvas.ownerDocument.dispatchEvent(new CustomEvent(GRAPHICS_ERROR_EVENT, { detail: { reload } }));
}

declare global {
  interface DocumentEventMap {
    'issen-graphics-error': CustomEvent<{ reload: boolean }>;
  }
}
