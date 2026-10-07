import { createPixiScenePainter } from '../../../src/rendering/pixi/scene-painter.ts';
/** Native scene fixtures keep pixel readback in a separate Canvas preparation tool. */
export async function createTestDrawing(canvas: HTMLCanvasElement) {
  const painter = await createPixiScenePainter(canvas);
  const copy = document.createElement('canvas');
  const read = copy.getContext('2d')!;
  function snapshot() {
    painter.flush();
    copy.width = canvas.width;
    copy.height = canvas.height;
    read.drawImage(canvas, 0, 0);
  }
  const nativeUrl = canvas.toDataURL.bind(canvas);
  canvas.toDataURL = (...args) => {
    painter.flush();
    return nativeUrl(...args);
  };
  const drawing = Object.assign(painter, {
    getImageData(x: number, y: number, width: number, height: number) {
      snapshot();
      return read.getImageData(x, y, width, height);
    },
  });
  painter.begin();
  return drawing;
}
