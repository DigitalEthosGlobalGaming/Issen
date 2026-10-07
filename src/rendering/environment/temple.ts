import { drawCachedImage, clearCachedMaterial } from '../cached-materials.ts';
import type { SceneDrawing } from '../scene-drawing.ts';
import { STAGES } from '../../game/content/stages.ts';
import { createLayout } from '../layout.ts';
import { createBackground } from '../scene/background.ts';
import { drawAtlasSprite } from './scene-kit.ts';
import type { SpritePlacement } from './scene-kit.ts';

/** Packed source frames in pixels, measured from the untouched 2172 x 724 source sheets. */
export const TEMPLE_ATLAS_FRAMES = {
  posts: [
    { x: 0, y: 0, width: 950, height: 724 },
    { x: 950, y: 0, width: 500, height: 724 },
    { x: 1450, y: 0, width: 722, height: 724 },
  ],
  roofs: [
    { x: 0, y: 0, width: 568, height: 724 },
    { x: 568, y: 0, width: 980, height: 724 },
    { x: 1548, y: 0, width: 624, height: 724 },
  ],
  steps: [
    { x: 0, y: 0, width: 808, height: 724 },
    { x: 808, y: 0, width: 602, height: 724 },
    { x: 1410, y: 0, width: 762, height: 724 },
  ],
  walls: [
    { x: 0, y: 0, width: 731, height: 724 },
    { x: 731, y: 0, width: 822, height: 724 },
    { x: 1553, y: 0, width: 619, height: 724 },
  ],
} as const;
/** Ember Courtyard: offset ruined gateway, fractured roofline and an open central floor. */
export function drawEmberCourtyard(
  base: SceneDrawing,
  far: SceneDrawing,
  near: SceneDrawing,
  atlases: Record<string, HTMLImageElement>,
  width: number,
  height: number,
  scale: number,
  lowQuality: boolean,
) {
  function piece(
    g: SceneDrawing,
    image: HTMLImageElement,
    cell: number,
    x: number,
    foot: number,
    size: number,
    placement: SpritePlacement,
  ) {
    const family =
      image === atlases.templePosts
        ? 'posts'
        : image === atlases.templeRoofs
          ? 'roofs'
          : image === atlases.templeSteps
            ? 'steps'
            : image === atlases.templeWalls
              ? 'walls'
              : null;
    const anchorY =
      family === 'posts' ? 0.925 : family === 'roofs' ? 0.83 : family === 'steps' ? 0.84 : 0.8;
    drawAtlasSprite(
      g,
      image,
      cell,
      x,
      foot,
      size,
      family
        ? {
            ...placement,
            frame: TEMPLE_ATLAS_FRAMES[family][cell]!,
            anchorY,
            anchorX: family === 'posts' && cell === 0 ? 0.47 : 0.5,
            fadeFrom:
              placement.fadeFrom === undefined
                ? undefined
                : Math.min(placement.fadeFrom, anchorY - 0.1),
          }
        : placement,
    );
  }
  const stage = STAGES[6]!;
  const { horizonY, groundY, eH } = createLayout(width, height);
  const unit = Math.min(height, width * 1.3);
  const foot = groundY - eH * 0.28;
  const terrain = createBackground(width, height, scale, 6, {
    fieldMist: 0.25,
    mountains(g) {
      drawAtlasSprite(
        g,
        atlases.mountains!,
        2,
        width * 0.61,
        horizonY + height * 0.08,
        width * 1.2,
        { alpha: 0.17, fadeFrom: 0.59 },
      );
    },
  }).canvas;
  drawCachedImage(base, terrain, [0, 0, terrain.width, terrain.height], 0, 0, width, height);
  clearCachedMaterial(terrain);
  terrain.width = terrain.height = 0;
  for (const [i, x] of [0.1, 0.81, 1.04].entries()) {
    drawAtlasSprite(far, atlases.pines!, i % 4, width * x, foot - height * 0.07, unit * 0.18, {
      alpha: 0.21,
      fadeFrom: 0.72,
    });
  }
  // Firelight remains separate from architecture. Existing smoke/embers draw above it at runtime.
  for (const [x, radius] of [
    [0.2, 0.21],
    [0.9, 0.15],
  ] as const) {
    const glow = far.createRadialGradient(
      width * x,
      foot - unit * 0.11,
      0,
      width * x,
      foot - unit * 0.11,
      unit * radius,
    );
    glow.addColorStop(0, 'rgba(235,146,81,0.28)');
    glow.addColorStop(0.45, 'rgba(208,104,59,0.11)');
    glow.addColorStop(1, 'rgba(208,104,59,0)');
    far.fillStyle = glow;
    far.fillRect(0, 0, width, groundY);
  }
  const architecture = { fadeFrom: 0.72 };
  // Assemble this ruin around one ground origin. The stair flight projects forward
  // from the threshold; its top no longer fills the doorway behind the posts.
  const gateX = width * 0.17;
  const gateFoot = foot - unit * 0.02;
  const gateWidth = unit * 0.32;
  const roofWidth = unit * 0.36;
  // Post lintel top is source y190; the roof eave contact is source y520.
  // Derive their contact from the packed-frame scales rather than unrelated offsets.
  const lintelY = gateFoot - ((0.925 * 724 - 190) * gateWidth) / 950;
  const roofFoot = lintelY + ((0.83 * 724 - 520) * roofWidth) / 980;
  piece(far, atlases.templeSteps!, 0, gateX, gateFoot + unit * 0.055, unit * 0.19, {
    ...architecture,
    alpha: 0.48,
  });
  piece(far, atlases.templePosts!, 0, gateX, gateFoot, gateWidth, {
    fadeFrom: 0.85,
    alpha: 0.79,
  });
  piece(far, atlases.templeRoofs!, 1, gateX, roofFoot, roofWidth, {
    alpha: 0.79,
  });
  piece(far, atlases.templeWalls!, 0, -width * 0.045, foot + height * 0.016, unit * 0.32, {
    ...architecture,
    alpha: 0.65,
    angle: 0.025,
  });
  piece(far, atlases.templeWalls!, 1, width * 0.98, foot + height * 0.012, unit * 0.49, {
    ...architecture,
    alpha: 0.67,
    angle: -0.03,
  });
  piece(far, atlases.templePosts!, 1, width * 0.95, foot, unit * 0.32, {
    ...architecture,
    alpha: 0.65,
  });
  piece(far, atlases.templeRoofs!, 0, width * 0.98, foot - unit * 0.21, unit * 0.39, {
    alpha: 0.58,
    angle: 0.025,
  });
  for (const [i, x] of (lowQuality ? [0.05, 0.92] : [0.05, 0.27, 0.87, 0.96]).entries()) {
    drawAtlasSprite(far, atlases.rocks!, i % 4, width * x, foot + height * 0.024, unit * 0.09, {
      alpha: 0.5,
      angle: i % 2 ? 0.04 : -0.04,
      fadeFrom: 0.74,
    });
  }
  piece(near, atlases.templeRoofs!, 2, width * 1.01, height * 0.94, unit * 0.37, {
    ...architecture,
    alpha: 0.75,
    angle: -0.08,
  });
  drawAtlasSprite(near, atlases.rocks!, 3, -width * 0.035, height * 0.96, unit * 0.25, {
    alpha: 0.68,
    angle: 0.04,
    fadeFrom: 0.74,
  });
}
