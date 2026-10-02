import { drawAtlasSprite } from './scene-kit.ts';
import { STAGES } from '../../game/content/stages.ts';
import { createLayout } from '../layout.ts';
import { createBackground } from '../scene/background.ts';

interface BlossomAtlases {
  cherries: HTMLImageElement;
  petals: HTMLImageElement;
  mountains: HTMLImageElement;
  banks: HTMLImageElement;
  shrubs: HTMLImageElement;
  rocks: HTMLImageElement;
}

/** Cells retain full transparent padding. Cherry anchors use frame-local pixels; petal anchors are normalized. */
export const BLOSSOM_SPRITE_LAYOUT = {
  cherries: {
    width: 1254,
    height: 1254,
    columns: 2,
    rows: 2,
    // Frame-local trunk contact anchors in pixels, measured from the generated silhouettes.
    frames: [
      { name: 'leaning', x: 0, y: 0, width: 627, height: 627, anchorX: 250, anchorY: 594 },
      { name: 'upright', x: 627, y: 0, width: 627, height: 627, anchorX: 323, anchorY: 594 },
      { name: 'spreading', x: 0, y: 627, width: 627, height: 627, anchorX: 355, anchorY: 488 },
      { name: 'sparse', x: 627, y: 627, width: 627, height: 627, anchorX: 333, anchorY: 483 },
    ],
  },
  petals: {
    width: 1659,
    height: 948,
    columns: 2,
    rows: 2,
    // Frame origins are top-left pixels; odd sheet width intentionally gives half-pixel frames.
    frames: [
      { name: 'thin-scatter', x: 0, y: 0, width: 829.5, height: 474, anchorX: 0.5, anchorY: 0.9 },
      { name: 'crescent', x: 829.5, y: 0, width: 829.5, height: 474, anchorX: 0.5, anchorY: 0.95 },
      { name: 'dense-patch', x: 0, y: 474, width: 829.5, height: 474, anchorX: 0.5, anchorY: 0.78 },
      {
        name: 'broken-strip',
        x: 829.5,
        y: 474,
        width: 829.5,
        height: 474,
        anchorX: 0.5,
        anchorY: 0.71,
      },
    ],
  },
} as const;

/** Falling Blossom Path uses a sparse orchard and a broken track, never a scenery plate. */
export function drawFallingBlossomPath(
  base: CanvasRenderingContext2D,
  distant: CanvasRenderingContext2D,
  nearby: CanvasRenderingContext2D,
  atlases: BlossomAtlases,
  width: number,
  height: number,
  scale: number,
  lowQuality: boolean,
) {
  const stage = STAGES[2]!;
  const { horizonY, groundY, eH } = createLayout(width, height);
  const unit = Math.min(height, width * 1.3);
  const hillBase = groundY - eH * 0.31;
  const slope = (x: number) =>
    hillBase - height * 0.012 * Math.sin((x / width) * Math.PI * 2 + 0.6);

  function sprite(
    g: CanvasRenderingContext2D,
    atlas: HTMLImageElement,
    cell: number,
    x: number,
    foot: number,
    size: number,
    opacity: number,
    anchor = 0.94,
    angle = 0,
    fadeFrom = 0.76,
  ) {
    const sw = atlas.naturalWidth / 2,
      sh = atlas.naturalHeight / 2;
    const cherry =
      atlas === atlases.cherries ? BLOSSOM_SPRITE_LAYOUT.cherries.frames[cell] : undefined;
    const anchorX = cherry ? cherry.anchorX / sw : 0.5;
    if (cherry) anchor = cherry.anchorY / sh;
    fadeFrom = Math.min(fadeFrom, anchor - 0.09);
    drawAtlasSprite(g, atlas, cell, x, foot, size, {
      alpha: opacity,
      anchorX,
      anchorY: anchor,
      angle,
      fadeFrom,
      fadeTo: anchor,
    });
  }

  const terrain = createBackground(width, height, scale, 2, {
    fieldMist: 0.4,
    hillHeight: slope,
    hillShade: { top: stage.hill, bottom: stage.field[0] },
    mountains(g) {
      // Just one low, remote landform: the orchard, rather than mountains, defines this scene.
      sprite(
        g,
        atlases.mountains,
        2,
        width * 0.53,
        horizonY + height * 0.08,
        Math.max(width * 1.05, unit * 1.3),
        0.2,
        0.94,
        0,
        0.62,
      );
    },
  }).canvas;
  base.drawImage(terrain, 0, 0, width, height);
  terrain.width = terrain.height = 0;

  // A widening S-curve is broken into dry, uneven patches. Grass still draws over it at runtime.
  const path = (t: number) => ({
    x: width * (0.48 - Math.sin(t * Math.PI) * 0.22 + t * t * 0.5),
    y: hillBase + height * 0.015 + (height * 1.02 - hillBase) * t,
    half: width * (0.004 + Math.pow(t, 1.8) * 0.09),
  });
  const track = base.canvas.ownerDocument.createElement('canvas');
  track.width = base.canvas.width;
  track.height = base.canvas.height;
  const trail = track.getContext('2d');
  if (trail) {
    trail.setTransform(scale, 0, 0, scale, 0, 0);
    trail.beginPath();
    for (const side of [-1, 1]) {
      for (let i = 0; i <= 96; i++) {
        const t = (side === -1 ? i : 96 - i) / 96;
        const p = path(t);
        const edge = 0.92 + 0.055 * Math.sin(t * 39 + side) + 0.025 * Math.sin(t * 103);
        const x = p.x + side * p.half * edge;
        if (side === -1 && i === 0) trail.moveTo(x, p.y);
        else trail.lineTo(x, p.y);
      }
    }
    trail.closePath();
    const chalk = trail.createLinearGradient(0, hillBase, 0, height);
    chalk.addColorStop(0, 'rgba(226,217,201,0.17)');
    chalk.addColorStop(0.6, 'rgba(226,217,201,0.21)');
    chalk.addColorStop(1, 'rgba(226,217,201,0.07)');
    trail.fillStyle = chalk;
    trail.fill();
    // Faint irregular wear breaks the interior without slicing the trail into paving slabs.
    trail.globalCompositeOperation = 'destination-out';
    trail.fillStyle = 'rgba(0,0,0,0.17)';
    for (let i = 0; i < 23; i++) {
      const t = (i + 1) / 25,
        p = path(t);
      trail.beginPath();
      trail.ellipse(
        p.x + Math.sin(i * 2.4) * p.half * 0.6,
        p.y,
        p.half * (0.13 + (i % 3) * 0.04),
        height * 0.003,
        -0.4,
        0,
        Math.PI * 2,
      );
      trail.fill();
    }
    base.save();
    base.filter = `blur(${Math.max(1, unit * 0.0025)}px)`;
    base.drawImage(track, 0, 0, width, height);
    base.restore();
  }
  track.width = track.height = 0;
  const orchard = lowQuality ? [0.29, 0.7, 0.92] : [0.23, 0.34, 0.62, 0.77, 0.95];
  for (const [i, x] of orchard.entries()) {
    sprite(
      distant,
      atlases.cherries,
      1 + (i % 3),
      width * x,
      slope(width * x) - eH * 0.12,
      unit * (0.105 + (i % 2) * 0.035),
      0.4 + (i % 2) * 0.1,
    );
  }
  for (const [i, x] of [0.08, 0.87].entries()) {
    const angle = Math.atan2(slope(width * x + 4) - slope(width * x - 4), 8);
    sprite(
      distant,
      atlases.banks,
      i * 2,
      width * x,
      slope(width * x) + height * 0.008,
      unit * 0.37,
      0.26,
      0.94,
      angle,
      0.65,
    );
    sprite(
      distant,
      atlases.shrubs,
      i + 1,
      width * (x + 0.045),
      slope(width * x) + height * 0.01,
      unit * 0.06,
      0.37,
      0.94,
      angle,
    );
  }
  sprite(
    distant,
    atlases.rocks,
    1,
    width * 0.64,
    hillBase + height * 0.025,
    unit * 0.085,
    0.38,
    0.94,
    -0.025,
  );

  const deposits = [
    { cell: 0, x: 0.12, foot: groundY + height * 0.04, size: 0.32, angle: -0.045 },
    { cell: 2, x: 0.69, foot: height * 0.85, size: 0.38, angle: 0.035 },
    { cell: 1, x: 0.42, foot: groundY + height * 0.045, size: 0.14, angle: -0.06 },
    { cell: 3, x: 0.91, foot: height * 0.97, size: 0.28, angle: 0.04 },
  ];
  for (const patch of deposits.slice(0, lowQuality ? 2 : 4)) {
    sprite(
      base,
      atlases.petals,
      patch.cell,
      width * patch.x,
      patch.foot,
      unit * patch.size,
      0.48,
      BLOSSOM_SPRITE_LAYOUT.petals.frames[patch.cell]!.anchorY,
      patch.angle,
      0.64,
    );
  }
  // Cropped at the left viewport edge deliberately; the canopy remains above the combat heads.
  sprite(
    nearby,
    atlases.cherries,
    0,
    -width * 0.12,
    hillBase - eH * 0.55,
    Math.min(height * 0.85, width * 1.02),
    0.87,
    0.94,
    0,
    0.84,
  );
}
