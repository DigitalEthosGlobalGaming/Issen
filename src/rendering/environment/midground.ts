import type { SceneDrawing } from '../scene-drawing.ts';
import { drawAtlasSprite } from './scene-kit.ts';
import { createLayout } from '../layout.ts';

interface FieldAtlases {
  banks: HTMLImageElement;
  shrubs: HTMLImageElement;
  rocks: HTMLImageElement;
}

/** Low scenery anchored behind the combat ground, baked into the distant plane. */
export function drawFieldMidground(
  ctx: SceneDrawing,
  atlases: FieldAtlases,
  width: number,
  height: number,
  lowQuality: boolean,
) {
  const { groundY, eH } = createLayout(width, height);
  const unit = Math.min(height, width * 1.3);
  const baseline = groundY - eH * 0.33;
  const count = Math.ceil(width / (unit * (lowQuality ? 0.58 : 0.42))) + 1;
  function sprite(
    image: HTMLImageElement,
    cell: number,
    x: number,
    foot: number,
    size: number,
    alpha: number,
    flip: boolean,
    anchor = 0.92,
  ) {
    drawAtlasSprite(ctx, image, cell, x, foot, size, { alpha, flip, anchorY: anchor });
  }
  for (let i = 0; i < count; i++) {
    const variation = ((i * 43 + 17) % 97) / 97;
    const x = width * ((i + 0.28 + Math.sin(i * 2.4) * 0.13) / count);
    const foot = baseline + height * (variation - 0.5) * 0.009;
    const bankWidth = unit * (0.32 + variation * 0.08);
    // Banks are broad but shallow; large gaps keep the rolling field visible.
    sprite(atlases.banks, i % 4, x, foot, bankWidth, 0.28, i % 2 === 0);
    sprite(
      atlases.shrubs,
      (i + 1) % 4,
      x - bankWidth * 0.22,
      foot - height * 0.002,
      unit * (0.042 + variation * 0.02),
      0.38,
      i % 2 !== 0,
      0.87,
    );
    if (i % 2 === 0) {
      sprite(
        atlases.rocks,
        (i / 2) % 4,
        x + bankWidth * 0.26,
        foot + height * 0.004,
        unit * (0.055 + variation * 0.025),
        0.42,
        i % 4 === 0,
      );
    }
    if (!lowQuality && i % 3 === 1) {
      sprite(
        atlases.shrubs,
        (i + 3) % 4,
        x + bankWidth * 0.16,
        foot - height * 0.004,
        unit * 0.035,
        0.24,
        true,
        0.87,
      );
    }
  }
}
