import { STAGES } from '../../game/content/stages.ts';
import { createLayout } from '../layout.ts';
import { createBackground } from '../scene/background.ts';

interface RidgeAtlases {
  mountains: HTMLImageElement;
  pines: HTMLImageElement;
  banks: HTMLImageElement;
  shrubs: HTMLImageElement;
  rocks: HTMLImageElement;
}

/** Last Light Ridge: one left-hand slope above a broad, empty valley. */
export function drawLastLightRidge(
  base: CanvasRenderingContext2D,
  distant: CanvasRenderingContext2D,
  nearby: CanvasRenderingContext2D,
  atlases: RidgeAtlases,
  width: number,
  height: number,
  scale: number,
  lowQuality: boolean,
) {
  const stage = STAGES[1]!;
  const { horizonY, groundY, eH, sunX } = createLayout(width, height);
  const unit = Math.min(height, width * 1.3);
  function sprite(
    g: CanvasRenderingContext2D,
    atlas: HTMLImageElement,
    cell: number,
    x: number,
    foot: number,
    size: number,
    alpha: number,
    mirror = false,
    anchor = 0.94,
    groundBlend = atlas !== atlases.mountains,
  ) {
    const sw = atlas.naturalWidth / 2,
      sh = atlas.naturalHeight / 2;
    const h = (size * sh) / sw;
    // Prepare the contact fade while building the cached layer, never per frame.
    const cutout = groundBlend ? g.canvas.ownerDocument.createElement('canvas') : null;
    if (cutout) {
      cutout.width = Math.ceil(sw);
      cutout.height = Math.ceil(sh);
      const mask = cutout.getContext('2d');
      if (mask) {
        mask.drawImage(
          atlas,
          (cell % 2) * sw,
          Math.floor(cell / 2) * sh,
          sw,
          sh,
          0,
          0,
          cutout.width,
          cutout.height,
        );
        mask.globalCompositeOperation = 'destination-in';
        const fade = mask.createLinearGradient(0, cutout.height * 0.64, 0, cutout.height * anchor);
        fade.addColorStop(0, 'rgba(0,0,0,1)');
        fade.addColorStop(0.45, 'rgba(0,0,0,0.85)');
        fade.addColorStop(1, 'rgba(0,0,0,0)');
        mask.fillStyle = fade;
        mask.fillRect(0, 0, cutout.width, cutout.height);
      }
    }
    g.save();
    g.globalAlpha *= alpha;
    g.translate(x, foot);
    if (groundBlend && foot < groundY) {
      const sample = Math.max(1, size * 0.08);
      const angle = Math.atan2(slope(x + sample) - slope(x - sample), sample * 2);
      // Rotate around ground contact, before mirroring, so both facings follow the hill.
      g.rotate(Math.max(-0.18, Math.min(0.18, angle)));
    }
    g.scale(mirror ? -1 : 1, 1);
    if (cutout) g.drawImage(cutout, -size / 2, -h * anchor, size, h);
    else
      g.drawImage(
        atlas,
        (cell % 2) * sw,
        Math.floor(cell / 2) * sh,
        sw,
        sh,
        -size / 2,
        -h * anchor,
        size,
        h,
      );
    g.restore();
    if (cutout) cutout.width = cutout.height = 0;
  }
  const hillBase = groundY - eH * 0.3;
  const slope = (x: number) =>
    hillBase - height * 0.13 * Math.max(0, 1 - x / (width * 0.48)) ** 1.3;
  const terrain = createBackground(width, height, scale, 1, {
    fieldMist: 0.23,
    hillHeight: slope,
    hillShade: { top: stage.hill, bottom: stage.field[0] },
    mountains(g) {
      // The low disc shares the existing sky glow; the descending ridge eclipses its foot.
      g.save();
      g.fillStyle = 'rgba(240,230,205,0.76)';
      g.beginPath();
      g.arc(sunX, horizonY * stage.sunF, unit * 0.036, 0, Math.PI * 2);
      g.fill();
      const points = [
        [0, horizonY - height * 0.12],
        [width * 0.09, horizonY - height * 0.14],
        [width * 0.19, horizonY - height * 0.082],
        [width * 0.3, horizonY - height * 0.092],
        [width * 0.4, horizonY - height * 0.036],
        [width * 0.49, horizonY - height * 0.052],
        [width * 0.59, horizonY - height * 0.006],
        [width * 0.68, horizonY - height * 0.013],
        [width * 0.84, horizonY + height * 0.012],
        [width, horizonY + height * 0.035],
      ];
      g.beginPath();
      g.moveTo(0, height);
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i]!,
          b = points[i + 1]!;
        const steps = Math.max(3, Math.ceil((b[0]! - a[0]!) / 14));
        for (let k = 0; k < steps; k++) {
          const t = k / steps,
            x = a[0]! + (b[0]! - a[0]!) * t;
          const roughness =
            height *
            (0.0028 * Math.sin((x / unit) * 47) + 0.0014 * Math.sin((x / unit) * 131 + 0.7));
          g.lineTo(x, a[1]! + (b[1]! - a[1]!) * t + roughness);
        }
      }
      g.lineTo(width, horizonY + height * 0.035);
      g.lineTo(width, height);
      g.closePath();
      const fade = g.createLinearGradient(0, horizonY - height * 0.14, 0, groundY);
      fade.addColorStop(0, stage.mtn[0]);
      fade.addColorStop(0.75, 'rgb(' + stage.mist + ')');
      fade.addColorStop(1, stage.field[0]);
      g.fillStyle = fade;
      g.fill();
      g.clip();
      // One subdued native-aspect cutout adds facet/ink texture to the diagonal silhouette.
      sprite(
        g,
        atlases.mountains,
        2,
        width * 0.28,
        horizonY + height * 0.1,
        Math.max(width * 1.15, height * 1.25),
        0.53,
      );
      g.restore();
      const valley = g.createLinearGradient(0, horizonY + height * 0.025, 0, hillBase);
      valley.addColorStop(0, 'rgba(' + stage.mist + ',0)');
      valley.addColorStop(0.6, 'rgba(' + stage.mist + ',0.45)');
      valley.addColorStop(1, 'rgba(' + stage.mist + ',0.18)');
      g.fillStyle = valley;
      g.fillRect(0, horizonY + height * 0.025, width, hillBase - horizonY);
    },
  }).canvas;
  base.drawImage(terrain, 0, 0, width, height);
  terrain.width = terrain.height = 0;

  // Native bank silhouette slopes down towards the valley. Its base stays behind combat feet.
  sprite(
    distant,
    atlases.banks,
    3,
    width * 0.065,
    hillBase + height * 0.008,
    Math.min(width * 0.89, height * 1.24),
    0.5,
    true,
  );
  sprite(
    distant,
    atlases.pines,
    3,
    width * 0.07,
    slope(width * 0.07) + height * 0.009,
    unit * 0.24,
    0.87,
  );
  sprite(
    distant,
    atlases.pines,
    2,
    width * 0.22,
    slope(width * 0.22) + height * 0.005,
    unit * 0.13,
    0.62,
  );
  sprite(
    distant,
    atlases.shrubs,
    2,
    width * 0.3,
    slope(width * 0.3) + height * 0.014,
    unit * 0.09,
    0.55,
  );
  if (!lowQuality) {
    sprite(
      distant,
      atlases.rocks,
      1,
      width * 0.37,
      slope(width * 0.37) + height * 0.008,
      unit * 0.075,
      0.42,
    );
    sprite(distant, atlases.shrubs, 0, width * 0.14, hillBase + height * 0.01, unit * 0.055, 0.45);
  }
  // A small, static edge anchor; no right-hand vegetation closes the exposed valley.
  sprite(nearby, atlases.rocks, 2, -width * 0.008, height * 0.94, unit * 0.3, 0.73);
}
