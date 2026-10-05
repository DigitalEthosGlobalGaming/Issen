/**
 * Drawing vocabulary used by posed artwork and scene effects. Pixel preparation
 * remains Canvas-only; neither readback nor arbitrary context APIs belong here.
 * Canvas contexts satisfy this structurally, while Pixi draws native geometry.
 */
export type SceneDrawing = Pick<
  CanvasRenderingContext2D,
  | 'canvas'
  | 'save'
  | 'restore'
  | 'translate'
  | 'rotate'
  | 'scale'
  | 'transform'
  | 'setTransform'
  | 'getTransform'
  | 'globalAlpha'
  | 'globalCompositeOperation'
  | 'fillStyle'
  | 'strokeStyle'
  | 'lineWidth'
  | 'lineCap'
  | 'lineJoin'
  | 'beginPath'
  | 'closePath'
  | 'moveTo'
  | 'lineTo'
  | 'quadraticCurveTo'
  | 'bezierCurveTo'
  | 'arc'
  | 'ellipse'
  | 'rect'
  | 'fill'
  | 'stroke'
  | 'clip'
  | 'fillRect'
  | 'strokeRect'
  | 'clearRect'
  | 'drawImage'
  | 'createLinearGradient'
  | 'createRadialGradient'
  | 'createPattern'
  | 'font'
  | 'textAlign'
  | 'textBaseline'
  | 'fillText'
  | 'strokeText'
  | 'measureText'
  | 'filter'
  | 'shadowBlur'
  | 'shadowColor'
  | 'shadowOffsetX'
  | 'shadowOffsetY'
  | 'imageSmoothingEnabled'
  | 'imageSmoothingQuality'
>;

const nativePaths = new WeakMap<SceneDrawing, (path: string) => void>();
const canvasPaths = new Map<string, Path2D>();
export type SceneFilmPass = (
  film: string,
  width: number,
  height: number,
  time: number,
  preferences: { reducedMotion?: boolean; reducedFlashes?: boolean },
) => boolean;
const filmPasses = new WeakMap<SceneDrawing, SceneFilmPass>();
export function registerSceneFilmPass(target: SceneDrawing, pass: SceneFilmPass): void {
  filmPasses.set(target, pass);
}
export function applySceneFilm(target: SceneDrawing, ...args: Parameters<SceneFilmPass>): boolean {
  return filmPasses.get(target)?.(...args) ?? false;
}
export function registerScenePathSink(target: SceneDrawing, fill: (path: string) => void): void {
  nativePaths.set(target, fill);
}
/** SVG paths are portable asset data; opaque browser Path2D objects are not. */
export function fillScenePath(target: SceneDrawing, svg: string): void {
  const fill = nativePaths.get(target);
  if (fill) {
    fill(svg);
    return;
  }
  let path = canvasPaths.get(svg);
  if (!path) {
    path = new Path2D(svg);
    canvasPaths.set(svg, path);
  }
  target.fill(path);
}
