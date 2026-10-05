import type { SceneDrawing } from './scene-drawing.ts';
import type { PixiScenePainter } from './pixi/scene-painter.ts';

export interface SceneSurface {
  canvas: HTMLCanvasElement;
  drawing: SceneDrawing;
  native?: PixiScenePainter;
  dispose(): void;
}

/** Select a context before runtime input/resize binding. Failure gets a fresh canvas. */
export async function createSceneSurface(
  canvas: HTMLCanvasElement,
  pixi: boolean,
  recoverPreview = false,
): Promise<SceneSurface> {
  if (pixi) {
    try {
      const { createPixiScenePainter } = await import('./pixi/scene-painter.ts');
      const drawing = await createPixiScenePainter(canvas);
      canvas.dataset.graphicsBackend = 'pixi';
      const surface: SceneSurface = { canvas, drawing, native: drawing, dispose };
      let timer: ReturnType<typeof setTimeout> | undefined;
      function clearRecovery() {
        clearTimeout(timer);
        timer = undefined;
      }
      function recover() {
        clearRecovery();
        timer = setTimeout(() => {
          timer = undefined;
          if (!drawing.contextLost) return;
          const replacement = canvas.cloneNode(false) as HTMLCanvasElement;
          const context = replacement.getContext('2d');
          if (!context) return;
          dispose();
          canvas.replaceWith(replacement);
          replacement.dataset.graphicsBackend = 'canvas';
          replacement.dataset.rendererFallback = 'context-loss';
          replacement.dataset.contextState = 'ready';
          surface.canvas = replacement;
          surface.drawing = context;
          surface.native = undefined;
        }, 8000);
      }
      function dispose() {
        clearRecovery();
        canvas.removeEventListener('webglcontextlost', recover);
        canvas.removeEventListener('webglcontextrestored', clearRecovery);
        drawing.dispose();
      }
      if (recoverPreview) {
        canvas.addEventListener('webglcontextlost', recover);
        canvas.addEventListener('webglcontextrestored', clearRecovery);
      }
      return surface;
    } catch (error) {
      // A failed WebGL initialization may already have fixed the old context type.
      const replacement = canvas.cloneNode(false) as HTMLCanvasElement;
      canvas.replaceWith(replacement);
      canvas = replacement;
      canvas.dataset.rendererFallback = error instanceof Error ? error.name : 'initialization';
    }
  }
  const drawing = canvas.getContext('2d');
  if (!drawing) throw new Error('No supported scene rendering context');
  canvas.dataset.graphicsBackend = 'canvas';
  return { canvas, drawing, dispose() {} };
}
