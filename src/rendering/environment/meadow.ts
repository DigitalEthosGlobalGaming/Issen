import type { SceneDrawing } from '../scene-drawing.ts';
import { drawCachedImage } from '../cached-materials.ts';
import { createLayout } from '../layout.ts';
import type { EnvironmentFrame } from './index.ts';

function tile(
  ctx: SceneDrawing,
  atlas: HTMLImageElement,
  cell: number,
  x: number,
  foot: number,
  width: number,
  alpha: number,
  flip: boolean,
) {
  const sw = atlas.naturalWidth / 2,
    sh = atlas.naturalHeight / 2;
  const height = (width * sh) / sw;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, foot);
  ctx.scale(flip ? -1 : 1, 1);
  drawCachedImage(
    ctx,
    atlas,
    [(cell % 2) * sw, Math.floor(cell / 2) * sh, sw, sh],
    -width / 2,
    -height * 0.9,
    width,
    height,
  );
  ctx.restore();
}

/** Cached meadow texture fills the transition without replacing any live grass. */
export function drawMeadowTransition(
  ctx: SceneDrawing,
  edges: HTMLImageElement,
  patches: HTMLImageElement,
  width: number,
  height: number,
  lowQuality: boolean,
) {
  const { groundY, eH } = createLayout(width, height);
  const unit = Math.min(height, width * 1.3);
  const start = groundY - eH * 0.18;
  const count = Math.ceil(width / (unit * (lowQuality ? 0.34 : 0.24))) + 1;
  for (let i = 0; i < count; i++) {
    const v = ((i * 53 + 23) % 101) / 101;
    const x = (width * (i + 0.3 + Math.sin(i * 2.7) * 0.17)) / count;
    tile(
      ctx,
      patches,
      (i + 1) % 4,
      x,
      start + height * (v - 0.3) * 0.025,
      unit * (0.18 + v * 0.1),
      0.24,
      i % 2 === 0,
    );
    tile(
      ctx,
      edges,
      i % 4,
      x + unit * 0.05,
      start - height * 0.008 + v * height * 0.012,
      unit * (0.14 + v * 0.07),
      0.4,
      i % 2 !== 0,
    );
  }
}

/** Sparse separate fog stamps; no full-width pale band or gameplay random calls. */
export function drawMeadowFog(ctx: SceneDrawing, atlas: HTMLImageElement, frame: EnvironmentFrame) {
  const { width, height } = frame;
  const { groundY, eH } = createLayout(width, height);
  const unit = Math.min(height, width * 1.3);
  const count = Math.ceil(width / (unit * (frame.lowQuality ? 0.6 : 0.42)));
  const time = frame.reducedMotion || frame.reducedFlashes || frame.lowQuality ? 0 : frame.time;
  for (let i = 0; i < count; i++) {
    const v = ((i * 37 + 9) % 97) / 97;
    const drift = Math.sin(time * 0.055 + i * 2.1) * unit * 0.015;
    const x = (width * (i + 0.4)) / count + drift;
    tile(
      ctx,
      atlas,
      i % 4,
      x,
      groundY - eH * 0.22 - v * height * 0.017,
      unit * (0.25 + v * 0.12),
      0.1 + v * 0.04,
      i % 2 === 0,
    );
  }
}
