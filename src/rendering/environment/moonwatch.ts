import type { SceneDrawing } from '../scene-drawing.ts';
import { createBackground } from '../scene/background.ts';
import { createLayout } from '../layout.ts';
import { drawAtlasSprite as sprite } from './scene-kit.ts';

/** One quiet landmark and isolated trees; moon and weather remain shared presentation. */
export function drawMoonwatchClearing(
  base: SceneDrawing,
  far: SceneDrawing,
  near: SceneDrawing,
  atlases: Record<string, HTMLImageElement>,
  width: number,
  height: number,
  scale: number,
  lowQuality: boolean,
) {
  const { horizonY, groundY, eH } = createLayout(width, height);
  const unit = Math.min(height, width * 1.3);
  const terrain = createBackground(width, height, scale, 8, {
    fieldMist: 0.12,
    mountains(g) {
      sprite(
        g,
        atlases.mountains!,
        2,
        width * 0.5,
        horizonY + height * 0.085,
        Math.max(width * 1.15, unit * 1.2),
        { alpha: 0.22, fadeFrom: 0.76, fadeTo: 0.96 },
      );
    },
  }).canvas;
  base.drawImage(terrain, 0, 0, width, height);
  terrain.width = terrain.height = 0;
  const foot = groundY - eH * 0.27;
  sprite(far, atlases.pines!, 3, width * 0.12, foot, unit * 0.16, {
    alpha: 0.46,
    fadeFrom: 0.85,
    fadeTo: 0.96,
  });
  sprite(far, atlases.pines!, 1, width * 0.9, foot - height * 0.009, unit * 0.095, {
    alpha: 0.24,
    fadeFrom: 0.87,
    fadeTo: 0.97,
  });
  const landmarkX = width * 0.71;
  if (atlases.templeSteps)
    sprite(far, atlases.templeSteps, 0, landmarkX, foot + height * 0.012, unit * 0.15, {
      frame: { x: 0, y: 0, width: 808, height: 724 },
      alpha: 0.52,
      anchorY: 0.83,
      fadeFrom: 0.76,
      fadeTo: 0.86,
    });
  if (atlases.templePosts)
    sprite(far, atlases.templePosts, 0, landmarkX, foot + height * 0.001, unit * 0.16, {
      frame: { x: 0, y: 0, width: 950, height: 724 },
      alpha: 0.58,
      anchorX: 0.47,
      anchorY: 0.925,
      fadeFrom: 0.86,
      fadeTo: 0.95,
    });
  // Low separate mist stays below the landmark opening and leaves the moon's sky clear.
  for (let i = 0; i < (lowQuality ? 2 : 3); i++)
    sprite(
      far,
      atlases.fogWisps!,
      i + 1,
      width * (0.17 + i * 0.32),
      foot + height * 0.012,
      unit * 0.44,
      { alpha: 0.045, translucent: true, anchorY: 0.9, fadeFrom: 0.75, fadeTo: 0.95 },
    );
  sprite(near, atlases.fieldRocks!, 1, width * 0.035, height * 0.95, unit * 0.22, {
    alpha: 0.37,
    fadeFrom: 0.78,
    fadeTo: 0.96,
  });
}
