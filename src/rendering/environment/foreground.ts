/** Four independent boulder variants; frame geometry matches the preserved source sheet. */
export const FOREGROUND_BOULDER_FRAMES = [
  { name: 'fractured', x: 0, y: 0, width: 887, height: 443, anchorX: 443.5, anchorY: 423 },
  { name: 'split-slab', x: 887, y: 0, width: 887, height: 443, anchorX: 443.5, anchorY: 423 },
  { name: 'sloped-wedge', x: 0, y: 443, width: 887, height: 444, anchorX: 443.5, anchorY: 363 },
  { name: 'compact-crag', x: 887, y: 443, width: 887, height: 444, anchorX: 443.5, anchorY: 377 },
] as const;

/** Cached in the base layer so grounded rocks never drift independently of the grass. */
export function drawForegroundBoulders(
  ctx: CanvasRenderingContext2D,
  atlas: HTMLImageElement,
  width: number,
  height: number,
) {
  const unit = Math.min(width, height * 1.7);
  const placements = [
    { cell: 1, x: width * 0.95, foot: height * 0.915, width: unit * 0.17 },
    { cell: 0, x: width * 0.84, foot: height * 0.982, width: unit * 0.27 },
  ] as const;
  for (const placement of placements) {
    const frame = FOREGROUND_BOULDER_FRAMES[placement.cell];
    const scale = placement.width / frame.width;
    ctx.drawImage(
      atlas,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      placement.x - frame.anchorX * scale,
      placement.foot - frame.anchorY * scale,
      frame.width * scale,
      frame.height * scale,
    );
  }
}
