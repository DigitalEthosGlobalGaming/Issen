import { drawCachedImage, clearCachedMaterial } from '../cached-materials.ts';
import type { SceneDrawing } from '../scene-drawing.ts';
import { sceneryCount, type SceneryDetail } from './scenery-detail.ts';
import { createBackground } from '../scene/background.ts';
import { createLayout } from '../layout.ts';
import { drawAtlasSprite as sprite } from './scene-kit.ts';

/** Broad snow negative space with fitted snow art, independent of gameplay weather. */
export function drawWhiteSilencePass(
  base: SceneDrawing,
  far: SceneDrawing,
  near: SceneDrawing,
  atlases: Record<string, HTMLImageElement>,
  width: number,
  height: number,
  scale: number,
  lowQuality: boolean,
  sceneryDetail?: SceneryDetail,
) {
  const { horizonY, groundY, eH } = createLayout(width, height);
  const unit = Math.min(height, width * 1.3);
  // Explicit source windows retain complete selected objects and exclude neighbouring-cell dust.
  function snowSprite(
    g: SceneDrawing,
    image: HTMLImageElement,
    rect: readonly [number, number, number, number],
    x: number,
    foot: number,
    size: number,
    anchorY: number,
    alpha: number,
  ) {
    sprite(g, image, 0, x, foot, size, {
      frame: { x: rect[0], y: rect[1], width: rect[2], height: rect[3] },
      alpha,
      anchorY,
      fadeFrom: anchorY - 0.07,
      fadeTo: anchorY + 0.015,
    });
  }

  const terrain = createBackground(width, height, scale, 5, {
    fieldMist: 0.15,
    hillShade: { top: '#b5b6b0', bottom: '#9da19d' },
    hillHeight: (x) => groundY - eH * 0.28 - height * (0.025 + 0.014 * Math.cos((x / width) * 5)),
    mountains(g) {
      sprite(g, atlases.mountains!, 2, width * 0.19, horizonY + height * 0.07, unit * 0.98, {
        alpha: 0.34,
        fadeFrom: 0.76,
        fadeTo: 0.95,
      });
      // A full-width source retains broad snow facets without enlarging a small atlas cell.
      g.save();
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = 'high';
      sprite(
        g,
        atlases.snowPeak!,
        0,
        width * 0.58,
        horizonY + height * 0.1,
        Math.min(unit * 1.5, width * 1.6),
        {
          columns: 1,
          rows: 1,
          alpha: 0.58,
          anchorY: 0.9,
          fadeFrom: 0.69,
          fadeTo: 0.94,
        },
      );
      g.restore();
    },
  }).canvas;
  drawCachedImage(base, terrain, [0, 0, terrain.width, terrain.height], 0, 0, width, height);
  clearCachedMaterial(terrain);
  terrain.width = terrain.height = 0;
  // Opaque broad snow covers meadow texture; a low contrast wind-carved saddle remains.
  const snowTop = groundY - eH * 0.16;
  const snow = base.createLinearGradient(0, snowTop, 0, height);
  snow.addColorStop(0, '#c6c7be');
  snow.addColorStop(0.55, '#d5d3c8');
  snow.addColorStop(1, '#adafa8');
  base.fillStyle = snow;
  base.beginPath();
  base.moveTo(0, snowTop);
  base.bezierCurveTo(
    width * 0.24,
    snowTop - height * 0.027,
    width * 0.49,
    snowTop + height * 0.018,
    width,
    snowTop - height * 0.006,
  );
  base.lineTo(width, height);
  base.lineTo(0, height);
  base.closePath();
  base.fill();
  base.strokeStyle = 'rgba(249,247,232,.18)';
  base.lineWidth = Math.max(1, unit * 0.002);
  for (let i = 0; i < sceneryCount(lowQuality, sceneryDetail, 3, 4, 5, 5); i++) {
    const y = snowTop + (height - snowTop) * (0.13 + i * 0.17);
    base.beginPath();
    base.moveTo(width * (i % 2 ? 0.53 : -0.05), y);
    base.bezierCurveTo(
      width * 0.31,
      y - height * 0.01,
      width * 0.53,
      y + height * 0.012,
      width * (i % 2 ? 1.06 : 0.39),
      y,
    );
    base.stroke();
  }
  snowSprite(
    far,
    atlases.snowPines!,
    [700, 0, 554, 627],
    width * 0.075,
    snowTop + height * 0.005,
    unit * 0.24,
    0.975,
    0.73,
  );
  snowSprite(
    far,
    atlases.snowPines!,
    [660, 660, 594, 594],
    width * 0.9,
    snowTop - height * 0.012,
    unit * 0.16,
    0.81,
    0.46,
  );
  if (!lowQuality)
    snowSprite(
      far,
      atlases.snowRocks!,
      [0, 500, 887, 387],
      width * 0.77,
      snowTop + height * 0.005,
      unit * 0.13,
      0.82,
      0.6,
    );
  sprite(near, atlases.snowBoulders!, 0, width * 0.97, height * 0.94, unit * 0.35, {
    alpha: 0.92,
    anchorY: 0.95,
    fadeFrom: 0.86,
    fadeTo: 0.97,
  });
  snowSprite(
    near,
    atlases.snowRocks!,
    [0, 500, 887, 387],
    width * 0.035,
    height * 0.9,
    unit * 0.18,
    0.82,
    0.7,
  );
}
