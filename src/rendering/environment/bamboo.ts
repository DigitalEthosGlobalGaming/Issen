import { STAGES } from '../../game/content/stages.ts';
import { createLayout } from '../layout.ts';
import { createBackground } from '../scene/background.ts';
import { drawAtlasSprite } from './scene-kit.ts';

/** Hollow Bamboo Road: sparse depths converge on an empty, mist-lit passage. */
export function drawHollowBambooRoad(
  base: CanvasRenderingContext2D,
  far: CanvasRenderingContext2D,
  near: CanvasRenderingContext2D,
  atlases: Record<string, HTMLImageElement>,
  width: number,
  height: number,
  scale: number,
  lowQuality: boolean,
) {
  const stage = STAGES[4]!;
  const { horizonY, groundY, eH } = createLayout(width, height);
  const unit = Math.min(height, width * 1.3);
  const foot = groundY - eH * 0.27;
  const terrain = createBackground(width, height, scale, 4, {
    fieldMist: 0.4,
    mountains(g) {
      drawAtlasSprite(
        g,
        atlases.mountains!,
        2,
        width * 0.56,
        horizonY + height * 0.07,
        unit * 0.9,
        { alpha: 0.1, fadeFrom: 0.58 },
      );
    },
  }).canvas;
  base.drawImage(terrain, 0, 0, width, height);
  terrain.width = terrain.height = 0;
  // Soft light in the gap contrasts with layered stalks, rather than a solid bamboo wall.
  const opening = base.createRadialGradient(
    width * 0.52,
    horizonY,
    0,
    width * 0.52,
    horizonY,
    unit * 0.55,
  );
  opening.addColorStop(0, 'rgba(' + stage.mist + ',0.18)');
  opening.addColorStop(1, 'rgba(' + stage.mist + ',0)');
  base.fillStyle = opening;
  base.fillRect(0, 0, width, groundY);
  for (const side of [0, 1]) {
    const sign = side === 0 ? 1 : -1;
    for (let i = (lowQuality ? 3 : 5) - 1; i >= 0; i--) {
      const x = side === 0 ? width * (0.06 + i * 0.055) : width * (0.94 - i * 0.05);
      drawAtlasSprite(
        far,
        atlases.bamboo!,
        (i + side) % 4,
        x,
        foot - height * (0.012 + i * 0.003),
        unit * (0.46 - i * 0.045),
        { alpha: 0.34 - i * 0.036, anchorY: 0.98, fadeFrom: 0.76 },
      );
    }
    drawAtlasSprite(far, atlases.banks!, side * 2, width * (side ? 0.9 : 0.09), foot, unit * 0.39, {
      alpha: 0.3,
      angle: sign * 0.04,
      fadeFrom: 0.64,
    });
    drawAtlasSprite(
      near,
      atlases.bamboo!,
      side ? 1 : 3,
      width *
        (side ? (height >= width * 0.9 ? 1.23 : 1.14) : height >= width * 0.9 ? -0.23 : -0.14),
      groundY + unit * 0.16,
      Math.min(unit * 1.02, width * 0.96),
      { alpha: 0.92, anchorY: 0.98, fadeFrom: 0.87 },
    );
    drawAtlasSprite(
      near,
      atlases.rocks!,
      side,
      width * (side ? 1.03 : -0.03),
      height * 0.93,
      unit * 0.27,
      { alpha: 0.6, angle: sign * 0.045, fadeFrom: 0.72 },
    );
    drawAtlasSprite(
      base,
      atlases.fallenBamboo!,
      side,
      width * (side ? 0.86 : 0.12),
      groundY + height * (side ? 0.23 : 0.12),
      unit * 0.36,
      { alpha: 0.66, anchorY: 0.9, angle: sign * 0.085, fadeFrom: 0.72 },
    );
  }
  // The road is a subdued tapered ribbon underneath the preserved grass.
  base.save();
  const road = base.createLinearGradient(0, foot, 0, height);
  road.addColorStop(0, 'rgba(213,213,191,0.08)');
  road.addColorStop(0.5, 'rgba(213,213,191,0.12)');
  road.addColorStop(1, 'rgba(213,213,191,0)');
  base.fillStyle = road;
  base.beginPath();
  base.moveTo(width * 0.51, foot);
  base.bezierCurveTo(width * 0.4, height * 0.66, width * 0.36, height * 0.8, width * 0.45, height);
  base.lineTo(width * 0.72, height);
  base.bezierCurveTo(width * 0.53, height * 0.76, width * 0.47, height * 0.68, width * 0.55, foot);
  base.closePath();
  base.fill();
  base.restore();
}
