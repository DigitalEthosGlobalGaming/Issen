import type { Stage } from '../../game/content/stages.ts';
import { createLayout } from '../layout.ts';
import { drawAtlasSprite, setSceneryAtmosphere } from './scene-kit.ts';

/** Overlapping cutouts, rather than edge-matched tiles. Widths preserve atlas aspect. */
const RIDGES = [
  { width: 0.8, base: 0.008, phase: 0.16, fog: 0.66, opacity: 0.75 },
  { width: 0.67, base: 0.045, phase: 0.48, fog: 0.43, opacity: 0.85 },
  { width: 0.56, base: 0.085, phase: 0.02, fog: 0.24, opacity: 0.94 },
] as const;

export function drawMountainTiles(
  context: CanvasRenderingContext2D,
  atlas: HTMLImageElement,
  width: number,
  height: number,
  stage: Stage,
) {
  const { horizonY } = createLayout(width, height);
  const row = context.canvas.ownerDocument.createElement('canvas');
  row.width = context.canvas.width;
  row.height = context.canvas.height;
  const g = row.getContext('2d');
  if (!g) return;
  const fogColour = 'rgb(' + stage.mist + ')';
  setSceneryAtmosphere(g, fogColour);
  const scaleX = row.width / width,
    scaleY = row.height / height;
  context.save();
  try {
    // Close the valley floor below the cutouts; the original foothills cover its base.
    const bank = context.createLinearGradient(
      0,
      horizonY - height * 0.03,
      0,
      horizonY + height * 0.1,
    );
    bank.addColorStop(0, 'rgba(' + stage.mist + ',0)');
    bank.addColorStop(0.65, fogColour);
    bank.addColorStop(1, stage.mtn[2]);
    context.fillStyle = bank;
    context.fillRect(0, horizonY - height * 0.03, width, height - horizonY + height * 0.03);
    for (const [depth, ridge] of RIDGES.entries()) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, row.width, row.height);
      g.setTransform(scaleX, 0, 0, scaleY, 0, 0);
      const tileWidth = height * ridge.width;
      const step = tileWidth * 0.72;
      const base = horizonY + height * ridge.base;
      const count = Math.ceil(width / step) + 3;
      for (let index = 0; index < count; index++) {
        const cell = (index * 3 + depth) % 4;
        const x = (index - 1 + ridge.phase) * step;
        const drift = Math.sin(index * 2.13 + depth) * height * 0.008;
        g.save();
        g.translate(x + tileWidth / 2, base + drift);
        g.scale((index + depth) % 2 ? -1 : 1, 1);
        drawAtlasSprite(g, atlas, cell, 0, 0, tileWidth, { alpha: ridge.opacity, anchorY: 0.92 });
        g.restore();
      }
      // Recolour only the mountain alpha; sky and later grass cannot be washed out.
      g.globalCompositeOperation = 'source-atop';
      g.globalAlpha = ridge.fog;
      g.fillStyle = fogColour;
      g.fillRect(0, 0, width, height);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'destination-in';
      const dissolve = g.createLinearGradient(0, base - height * 0.015, 0, base + height * 0.025);
      dissolve.addColorStop(0, 'rgba(0,0,0,1)');
      dissolve.addColorStop(0.65, 'rgba(0,0,0,.75)');
      dissolve.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = dissolve;
      g.fillRect(0, 0, width, height);
      g.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1;
      context.drawImage(row, 0, 0, width, height);
    }
  } finally {
    context.restore();
    row.width = row.height = 0;
  }
}
