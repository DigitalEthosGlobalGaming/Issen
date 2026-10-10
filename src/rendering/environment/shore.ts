import { drawCachedImage, clearCachedMaterial } from '../cached-materials.ts';
import type { SceneDrawing } from '../scene-drawing.ts';
import { sceneryCount, type SceneryDetail } from './scenery-detail.ts';
import { STAGES } from '../../game/content/stages.ts';
import { createLayout } from '../layout.ts';
import { createBackground } from '../scene/background.ts';
import { drawAtlasSprite as stamp } from './scene-kit.ts';
import { FOREGROUND_BOULDER_FRAMES } from './foreground.ts';
interface WaterFrame {
  width: number;
  height: number;
  time: number;
  reducedMotion: boolean;
  reducedFlashes: boolean;
  lowQuality: boolean;
}
function coastline(x: number, w: number, h: number) {
  const portrait = h >= w * 0.9;
  const groundY = h * (portrait ? 0.56 : 0.66);
  const eH = portrait ? Math.min(h * 0.16, w * 0.3) : Math.min(h * 0.3, w * 0.12);
  return groundY - eH * 0.43 + h * (0.065 - (0.145 * x) / w) + h * 0.008 * Math.sin((x / w) * 17);
}
function seaClip(g: SceneDrawing, w: number, h: number) {
  const { horizonY } = createLayout(w, h);
  g.beginPath();
  g.moveTo(0, horizonY - h * 0.005);
  g.lineTo(w, horizonY - h * 0.005);
  for (let x = w; x >= 0; x -= w / 70) g.lineTo(x, coastline(x, w, h));
  g.lineTo(0, coastline(0, w, h));
  g.closePath();
}
/** Exposed sea on the left, a rising coastal shelf and wind-bent pine on the right. */
export function drawBrokenShore(
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
  const stage = STAGES[7]!,
    { horizonY, groundY } = createLayout(width, height),
    unit = Math.min(height, width * 1.3);
  const terrain = createBackground(width, height, scale, 7, {
    fieldMist: 0.2,
    hillHeight: (x) => coastline(x, width, height),
    hillShade: { top: '#353a39', bottom: stage.field[0] },
    mountains(g) {
      // Headlands only at the edge: the broad empty horizon is the defining silhouette.
      stamp(g, atlases.mountains!, 2, width * 0.91, horizonY + height * 0.025, unit * 0.62, {
        alpha: 0.35,
        anchorY: 0.93,
        fadeFrom: 0.67,
      });
      const ocean = g.createLinearGradient(0, horizonY, 0, groundY + height * 0.08);
      ocean.addColorStop(0, '#89908e');
      ocean.addColorStop(0.15, '#687473');
      ocean.addColorStop(0.7, '#3b4b4d');
      ocean.addColorStop(1, '#273639');
      g.fillStyle = ocean;
      g.fillRect(0, horizonY, width, height - horizonY);
      const rows = sceneryCount(lowQuality, sceneryDetail, 18, 26, 34);
      for (let i = 0; i < rows; i++) {
        const u = i / rows,
          y = horizonY + (groundY - horizonY + height * 0.09) * u * u;
        g.strokeStyle = i % 3 ? 'rgba(180,190,180,.16)' : 'rgba(12,25,28,.24)';
        g.lineWidth = 0.6 + u * 1.7;
        for (let j = 0; j < 5; j++) {
          const x = width * (j / 5 + 0.06 * Math.sin(i * 2.1 + j));
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x + width * (0.055 + 0.025 * Math.sin(i + j)), y + height * 0.0015);
          g.stroke();
        }
      }
    },
  }).canvas;
  drawCachedImage(base, terrain, [0, 0, terrain.width, terrain.height], 0, 0, width, height);
  clearCachedMaterial(terrain);
  terrain.width = terrain.height = 0;
  // Stacks sit offshore; their footing is dissolved into independent foam, never stretched.
  const contacts = [0.923, 0.916, 0.805, 0.812];
  for (const [cell, x, depth, size, alpha] of [
    [0, 0.12, 0.36, 0.155, 0.68],
    [1, 0.42, 0.2, 0.11, 0.42],
    [3, 0.57, 0.52, 0.145, 0.64],
  ] as const) {
    const y = horizonY + (coastline(x * width, width, height) - horizonY) * depth;
    stamp(far, atlases.seaStacks!, cell, x * width, y, unit * size, {
      alpha,
      anchorY: contacts[cell]!,
      fadeFrom: contacts[cell]! - 0.1,
      fadeTo: contacts[cell]!,
    });
    stamp(far, atlases.foam!, 3, x * width, y + height * 0.004, unit * size * 0.84, {
      alpha: 0.22,
      translucent: true,
      anchorY: 0.67,
    });
  }
  // Diagonal shore foam follows the local coast tangent, below readable enemy silhouettes.
  const count = sceneryCount(lowQuality, sceneryDetail, 5, 6, 8);
  for (let i = 0; i < count; i++) {
    const x = ((i - 0.2) * width) / (count - 1),
      y = coastline(x, width, height);
    const angle = Math.atan2(
      coastline(x + 10, width, height) - coastline(x - 10, width, height),
      20,
    );
    stamp(
      far,
      atlases.foam!,
      i % 2 ? 0 : 3,
      x,
      y - height * 0.004,
      unit * (0.21 + (i % 3) * 0.035),
      { alpha: 0.3, translucent: true, anchorY: i % 2 ? 0.795 : 0.669, angle },
    );
    if (i % 2 === 0)
      stamp(far, atlases.rocks!, i % 4, x + width * 0.025, y + height * 0.015, unit * 0.12, {
        alpha: 0.68,
        anchorY: 0.94,
        fadeFrom: 0.76,
        angle,
      });
  }
  stamp(
    far,
    atlases.banks!,
    3,
    width * 0.93,
    coastline(width * 0.93, width, height) + height * 0.026,
    unit * 0.68,
    { alpha: 0.68, anchorY: 0.94, fadeFrom: 0.73 },
  );
  stamp(
    far,
    atlases.pines!,
    3,
    width * 0.975,
    coastline(width * 0.975, width, height),
    unit * 0.32,
    { alpha: 0.87, anchorY: 0.94, fadeFrom: 0.78, flip: true },
  );
  // This preserved atlas has unequal row heights; use its explicit frame contract.
  const rockFrame = FOREGROUND_BOULDER_FRAMES[1];
  const rockScale = (unit * 0.48) / rockFrame.width;
  stamp(near, atlases.boulders!, 0, width * 1.01, height * 0.98, rockFrame.width * rockScale, {
    frame: rockFrame,
    anchorX: rockFrame.anchorX / rockFrame.width,
    anchorY: rockFrame.anchorY / rockFrame.height,
    alpha: 0.9,
  });
  stamp(near, atlases.rocks!, 2, -width * 0.04, height * 0.92, unit * 0.2, {
    alpha: 0.75,
    anchorY: 0.94,
    fadeFrom: 0.77,
  });
}
/** Subtle advancing wave lines; no simulation, image processing or random rolls. */
export function drawShoreMotion(ctx: SceneDrawing, frame: WaterFrame) {
  const { width: w, height: h } = frame,
    { horizonY, groundY } = createLayout(w, h);
  const t = frame.reducedMotion || frame.reducedFlashes ? 0 : frame.time;
  ctx.save();
  seaClip(ctx, w, h);
  ctx.clip();
  const count = frame.lowQuality ? 5 : 10;
  for (let i = 0; i < count; i++) {
    const u = (i / count + t * 0.012) % 1,
      y = horizonY + (groundY - horizonY + h * 0.085) * u * u;
    ctx.strokeStyle = `rgba(217,224,211,${0.035 + 0.1 * u})`;
    ctx.lineWidth = 0.55 + u * 0.9;
    for (let j = 0; j < 4; j++) {
      const x = w * (j * 0.28 - 0.04 + 0.03 * Math.sin(i * 2.13 + t * 0.14));
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(
        x + w * 0.035,
        y - h * 0.002,
        x + w * 0.075,
        y + h * 0.001,
        x + w * 0.115,
        y,
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}
