import type { SceneDrawing } from './scene-drawing.ts';
import type { PixiScenePainter } from './pixi/scene-painter.ts';
import { GraphicsUnsupportedError, reportGraphicsError } from './graphics-error.ts';

/** Owns one WebGL2 scene context and its cancellable auxiliary recovery deadline. */
export class SceneSurface {
  drawing?: SceneDrawing;
  native?: PixiScenePainter;
  private initialization?: Promise<void>;
  private disposed = false;
  private timer?: ReturnType<typeof setTimeout>;
  constructor(
    readonly canvas: HTMLCanvasElement,
    private readonly recoverPreview = false,
  ) {}
  initialize(): Promise<void> {
    if (this.disposed) return Promise.resolve();
    return (this.initialization ??= this.prepare());
  }
  private async prepare(): Promise<void> {
    try {
      const { createPixiScenePainter } = await import('./pixi/scene-painter.ts');
      if (this.disposed) return;
      const drawing = await createPixiScenePainter(this.canvas);
      if (this.disposed) {
        drawing.dispose();
        return;
      }
      this.canvas.dataset.graphicsBackend = 'pixi';
      this.drawing = this.native = drawing;
      if (this.recoverPreview) {
        this.canvas.addEventListener('webglcontextlost', this.recover);
        this.canvas.addEventListener('webglcontextrestored', this.clearRecovery);
      }
    } catch (error) {
      if (!this.disposed) throw new GraphicsUnsupportedError(error);
    }
  }
  private readonly clearRecovery = (): void => {
    clearTimeout(this.timer);
    this.timer = undefined;
  };
  private readonly recover = (): void => {
    this.clearRecovery();
    if (this.disposed) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      if (!this.disposed && this.native?.contextLost) reportGraphicsError(this.canvas);
    }, 8000);
  };
  readonly dispose = (): void => {
    if (this.disposed) return;
    this.disposed = true;
    this.clearRecovery();
    this.canvas.removeEventListener('webglcontextlost', this.recover);
    this.canvas.removeEventListener('webglcontextrestored', this.clearRecovery);
    const drawing = this.drawing;
    this.drawing = this.native = undefined;
    drawing?.dispose?.();
  };
}
