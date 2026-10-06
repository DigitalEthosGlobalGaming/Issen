import type { SceneryAtlas } from './packed-scene-atlas.ts';
import { drawCachedImage, clearCachedMaterial } from '../cached-materials.ts';
import type { SceneDrawing } from '../scene-drawing.ts';
import { STAGES } from '../../game/content/stages.ts';
import { createLayout } from '../layout.ts';
import { createBackground } from '../scene/background.ts';
import { drawAtlasSprite as stamp } from './scene-kit.ts';

interface WaterFrame {
  width: number;
  height: number;
  time: number;
  reducedMotion: boolean;
  reducedFlashes: boolean;
  lowQuality: boolean;
}
// Separate low pools, rather than one lake. Coordinates are offsets from combat ground.
const POOLS = [
  { x: 0.2, y: -0.1, w: 0.3, h: 0.022 },
  { x: 0.73, y: -0.052, w: 0.38, h: 0.033 },
  { x: 0.36, y: 0.065, w: 0.43, h: 0.052 },
  { x: 0.89, y: 0.17, w: 0.32, h: 0.067 },
  { x: 0.02, y: 0.24, w: 0.22, h: 0.055 },
] as const;
function poolPath(g: SceneDrawing, x: number, y: number, w: number, h: number) {
  g.beginPath();
  // Broken margins resemble water collected between turf, not smooth oval decals.
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const edge = 0.91 + 0.065 * Math.sin(a * 7 + 0.8) + 0.025 * Math.sin(a * 17);
    const px = x + Math.cos(a) * w * 0.5 * edge;
    const py = y + Math.sin(a) * h * 0.5 * edge + h * 0.05 * Math.sin(a * 3);
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
}

/** A rain-dark basin with shallow, disconnected pools and low grass islands. */
export function drawRainwaterHollow(
  base: SceneDrawing,
  far: SceneDrawing,
  near: SceneDrawing,
  atlases: Record<string, SceneryAtlas>,
  width: number,
  height: number,
  scale: number,
  lowQuality: boolean,
) {
  const stage = STAGES[3]!,
    { horizonY, groundY, eH } = createLayout(width, height);
  const unit = Math.min(height, width * 1.3),
    bankY = groundY - eH * 0.4;
  const terrain = createBackground(width, height, scale, 3, {
    fieldMist: 0.38,
    hillHeight: (x) => bankY - height * 0.005 * Math.sin((x / width) * Math.PI * 4),
    hillShade: { top: '#434640', bottom: stage.field[0] },
    mountains(g) {
      stamp(
        g,
        atlases.mountains!,
        2,
        width * 0.58,
        horizonY + height * 0.028,
        Math.max(width * 0.9, unit * 0.9),
        { alpha: 0.13, anchorY: 0.92, fadeFrom: 0.67 },
      );
      const haze = g.createLinearGradient(0, horizonY - height * 0.08, 0, bankY);
      haze.addColorStop(0, 'rgba(126,130,124,0)');
      haze.addColorStop(0.75, 'rgba(139,144,136,.54)');
      haze.addColorStop(1, 'rgba(100,104,96,.2)');
      g.fillStyle = haze;
      g.fillRect(0, horizonY - height * 0.08, width, bankY - horizonY + height * 0.1);
    },
  }).canvas;
  drawCachedImage(base, terrain, [0, 0, terrain.width, terrain.height], 0, 0, width, height);
  clearCachedMaterial(terrain);
  terrain.width = terrain.height = 0;
  // Repeated treeline stays remote and below the empty rainy sky.
  const count = Math.ceil(width / (unit * 0.18));
  for (let i = 0; i < count; i++) {
    const x = ((i + 0.35) * width) / count;
    stamp(
      far,
      atlases.pines!,
      i % 2 ? 2 : 3,
      x,
      bankY + height * 0.006,
      unit * (0.13 + (i % 3) * 0.018),
      { alpha: 0.22, anchorY: 0.94, fadeFrom: 0.61 },
    );
    if (!lowQuality)
      stamp(far, atlases.shrubs!, i % 4, x + unit * 0.035, bankY + height * 0.017, unit * 0.1, {
        alpha: 0.22,
        fadeFrom: 0.6,
      });
  }
  for (let i = 0; i < POOLS.length; i++) {
    const p = POOLS[i]!,
      x = p.x * width,
      y = groundY + p.y * height,
      w = p.w * width,
      h = p.h * height;
    base.save();
    poolPath(base, x, y, w, h);
    base.clip();
    const water = base.createLinearGradient(0, y - h * 0.5, 0, y + h * 0.5);
    water.addColorStop(0, '#30332e');
    water.addColorStop(0.46, '#60655d');
    water.addColorStop(0.75, '#494f46');
    water.addColorStop(1, '#33392f');
    base.globalAlpha = 0.82;
    base.fillStyle = water;
    base.fillRect(x - w * 0.6, y - h, w * 1.2, h * 2);
    // Broken vertical reflection traces are confined to shallow water.
    for (let j = 0; j < 16; j++) {
      const rx = x - w * 0.45 + (j / 16) * w * 0.9;
      base.fillStyle = j % 3 ? 'rgba(18,24,21,.16)' : 'rgba(200,204,188,.11)';
      base.fillRect(rx, y - h * 0.45, w * (0.004 + (j % 3) * 0.005), h * (0.4 + (j % 4) * 0.13));
    }
    base.restore();
    base.save();
    poolPath(base, x, y, w, h);
    base.strokeStyle = 'rgba(154,161,142,.14)';
    base.lineWidth = Math.max(0.7, unit * 0.0012);
    base.stroke();
    base.restore();
    // Raised bank fragments interrupt the perimeter without surrounding every pool.
    stamp(far, atlases.banks!, i % 4, x - w * 0.24, y - h * 0.24, Math.min(unit * 0.31, w * 0.6), {
      alpha: 0.46,
      anchorY: 0.94,
      fadeFrom: 0.64,
    });
    stamp(
      far,
      atlases.grassEdges!,
      i % 4,
      x + w * 0.21,
      y + h * 0.34,
      Math.min(unit * 0.27, w * 0.55),
      { alpha: 0.55, anchorY: 0.85, fadeFrom: 0.72, fadeTo: 0.9 },
    );
  }
  // Reed anchors measured from the generated atlas, not the bottom of each cell.
  const anchors = [0.99, 0.993, 0.865, 0.87];
  for (const [cell, x, y, size] of [
    [3, 0.08, -0.062, 0.13],
    [1, 0.89, -0.083, 0.12],
    [2, 0.58, -0.115, 0.085],
    [0, -0.025, 0.2, 0.27],
    [1, 1.015, 0.25, 0.31],
  ] as const) {
    stamp(
      cell < 2 && Math.abs(x - 0.5) > 0.48 ? near : far,
      atlases.reeds!,
      cell,
      x * width,
      groundY + y * height,
      unit * size,
      {
        alpha: x < 0 || x > 1 ? 0.83 : 0.63,
        anchorY: anchors[cell]!,
        fadeFrom: anchors[cell]! - 0.12,
        fadeTo: anchors[cell]!,
        flip: x > 0.5,
      },
    );
  }
  stamp(near, atlases.rocks!, 2, width * 0.015, height * 0.94, unit * 0.2, {
    alpha: 0.66,
    fadeFrom: 0.73,
  });
}

/** Cosmetic ripples use a fixed layout and presentation time, never gameplay randomness. */
export function drawHollowMotion(ctx: SceneDrawing, frame: WaterFrame) {
  const { width: w, height: h } = frame,
    { groundY } = createLayout(w, h);
  const t = frame.reducedMotion || frame.reducedFlashes ? 0 : frame.time;
  ctx.save();
  ctx.lineWidth = Math.max(0.65, Math.min(w, h) * 0.0009);
  for (let i = 0; i < POOLS.length; i++) {
    const p = POOLS[i]!,
      x = p.x * w,
      y = groundY + p.y * h,
      pw = p.w * w,
      ph = p.h * h;
    ctx.save();
    poolPath(ctx, x, y, pw, ph);
    ctx.clip();
    for (let j = 0; j < (frame.lowQuality ? 2 : 5); j++) {
      const phase = (t * 0.25 + j * 0.217 + i * 0.131) % 1;
      const rx = x + pw * (Math.sin(j * 7.1 + i) * 0.32),
        ry = y + ph * (Math.cos(j * 3.3 + i) * 0.18);
      ctx.strokeStyle = `rgba(215,220,204,${0.16 * (1 - phase)})`;
      ctx.beginPath();
      ctx.ellipse(
        rx,
        ry,
        pw * (0.015 + 0.065 * phase),
        ph * (0.018 + 0.12 * phase),
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}
