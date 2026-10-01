/** Shared cached-composition helper. Source atlases remain untouched. */
export interface SpritePlacement {
  frame?: { x: number; y: number; width: number; height: number };
  alpha?: number;
  anchorX?: number;
  anchorY?: number;
  angle?: number;
  flip?: boolean;
  columns?: number;
  rows?: number;
  fadeFrom?: number;
  fadeTo?: number;
}

export function drawAtlasSprite(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cell: number,
  x: number,
  foot: number,
  width: number,
  placement: SpritePlacement = {},
) {
  const columns = placement.columns ?? 2,
    rows = placement.rows ?? 2;
  const sw = placement.frame?.width ?? image.naturalWidth / columns,
    sh = placement.frame?.height ?? image.naturalHeight / rows;
  if (!sw || !sh) return;
  const sx = placement.frame?.x ?? (cell % columns) * sw,
    sy = placement.frame?.y ?? Math.floor(cell / columns) * sh;
  const height = (width * sh) / sw;
  const ax = placement.anchorX ?? 0.5,
    ay = placement.anchorY ?? 0.94;
  let cutout: HTMLCanvasElement | null = null;
  if (placement.fadeFrom !== undefined) {
    cutout = ctx.canvas.ownerDocument.createElement('canvas');
    cutout.width = Math.ceil(sw);
    cutout.height = Math.ceil(sh);
    const g = cutout.getContext('2d');
    if (g) {
      g.drawImage(image, sx, sy, sw, sh, 0, 0, cutout.width, cutout.height);
      g.globalCompositeOperation = 'destination-in';
      const fade = g.createLinearGradient(
        0,
        cutout.height * placement.fadeFrom,
        0,
        cutout.height * (placement.fadeTo ?? ay),
      );
      fade.addColorStop(0, 'rgba(0,0,0,1)');
      fade.addColorStop(0.55, 'rgba(0,0,0,.8)');
      fade.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = fade;
      g.fillRect(0, 0, cutout.width, cutout.height);
    } else {
      cutout.width = cutout.height = 0;
      cutout = null;
    }
  }
  ctx.save();
  ctx.globalAlpha *= placement.alpha ?? 1;
  ctx.translate(x, foot);
  ctx.rotate(placement.angle ?? 0);
  ctx.scale(placement.flip ? -1 : 1, 1);
  if (cutout) ctx.drawImage(cutout, -width * ax, -height * ay, width, height);
  else ctx.drawImage(image, sx, sy, sw, sh, -width * ax, -height * ay, width, height);
  ctx.restore();
  if (cutout) cutout.width = cutout.height = 0;
}
