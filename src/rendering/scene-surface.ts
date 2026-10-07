import type { SceneDrawing } from './scene-drawing.ts';
import type { PixiScenePainter } from './pixi/scene-painter.ts';

/** Owns a scene context, including initialization and auxiliary recovery. */
export class SceneSurface {
  canvas: HTMLCanvasElement;
  drawing?: SceneDrawing;
  native?: PixiScenePainter;
  private initialization?: Promise<void>;
  private disposed = false;
  private timer?: ReturnType<typeof setTimeout>;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly recoverPreview = false,
  ) {
    this.canvas = canvas;
  }

  initialize(pixi = true): Promise<void> {
    if (this.disposed) return Promise.resolve();
    return (this.initialization ??= this.prepare(pixi));
  }

  private async prepare(pixi: boolean): Promise<void> {
    if (pixi) {
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
        return;
      } catch (error) {
        if (this.disposed) return;
        // A failed WebGL attempt may have fixed the old canvas's context type.
        this.replaceCanvas();
        this.canvas.dataset.rendererFallback =
          error instanceof Error ? error.name : 'initialization';
      }
    }
    const drawing = this.canvas.getContext('2d');
    if (!drawing) throw new Error('No supported scene rendering context');
    this.canvas.dataset.graphicsBackend = 'canvas';
    this.drawing = drawing;
  }

  private replaceCanvas(): void {
    const replacement = this.canvas.cloneNode(false) as HTMLCanvasElement;
    this.canvas.replaceWith(replacement);
    this.canvas = replacement;
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
      if (this.disposed || !this.native?.contextLost) return;
      const replacement = this.canvas.cloneNode(false) as HTMLCanvasElement;
      const drawing = replacement.getContext('2d');
      if (!drawing) return;
      this.releaseContext();
      this.canvas.replaceWith(replacement);
      this.canvas = replacement;
      this.canvas.dataset.graphicsBackend = 'canvas';
      this.canvas.dataset.rendererFallback = 'context-loss';
      this.canvas.dataset.contextState = 'ready';
      this.drawing = drawing;
    }, 8000);
  };

  private releaseContext(): void {
    this.clearRecovery();
    this.canvas.removeEventListener('webglcontextlost', this.recover);
    this.canvas.removeEventListener('webglcontextrestored', this.clearRecovery);
    const drawing = this.drawing;
    this.drawing = this.native = undefined;
    drawing?.dispose?.();
  }

  // Runtime lifecycle owners register this callback without rebinding it.
  readonly dispose = (): void => {
    if (this.disposed) return;
    this.disposed = true;
    this.releaseContext();
  };
}
