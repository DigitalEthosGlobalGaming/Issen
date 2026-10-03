export function roomWindow(
  width: number,
  height: number,
  sourceWidth: number,
  sourceHeight: number,
) {
  if (width / height < 1.35)
    return { x: width * 0.65, y: height * 0.15, w: width * 0.35, h: height * 0.46 };
  const zoom = Math.max(width / sourceWidth, height / sourceHeight);
  return {
    x: (width - sourceWidth * zoom) / 2 + sourceWidth * 0.72 * zoom,
    y: (height - sourceHeight * zoom) / 2 + sourceHeight * 0.15 * zoom,
    w: sourceWidth * 0.23 * zoom,
    h: sourceHeight * 0.46 * zoom,
  };
}

/** Reuse wall, floor and window regions as independently cropped room sprites. */
export function drawArmoryRoom(
  g: CanvasRenderingContext2D,
  room: HTMLImageElement,
  width: number,
  height: number,
) {
  if (width / height >= 1.35) {
    const zoom = Math.max(width / room.naturalWidth, height / room.naturalHeight);
    const dw = room.naturalWidth * zoom,
      dh = room.naturalHeight * zoom;
    g.drawImage(room, (width - dw) / 2, (height - dh) / 2, dw, dh);
    return;
  }
  const strips = [
    [0, 0.27, 0, 0.2],
    [0.27, 0.4, 0.2, 0.45],
    [0.67, 0.33, 0.65, 0.35],
  ] as const;
  for (const [sourceX, sourceW, targetX, targetW] of strips) {
    const sw = room.naturalWidth * sourceW,
      sh = room.naturalHeight;
    const dw = width * targetW,
      scale = Math.max(dw / sw, height / sh);
    const cropW = dw / scale,
      cropH = height / scale;
    g.drawImage(
      room,
      room.naturalWidth * sourceX + (sw - cropW) / 2,
      (sh - cropH) / 2,
      cropW,
      cropH,
      width * targetX,
      0,
      dw,
      height,
    );
  }
  // Joins sit under the room's dark timber, never stretched artwork.
  g.fillStyle = '#211b16';
  for (const x of [0.2, 0.65])
    g.fillRect(width * x - 1, 0, Math.max(2, width * 0.005), height * 0.61);
  // The floor remains one perspective plane below the movable wall sections.
  const floorY = room.naturalHeight * 0.61,
    floorH = room.naturalHeight - floorY;
  const scale = Math.max(width / room.naturalWidth, (height * 0.39) / floorH);
  const cropW = width / scale;
  g.drawImage(
    room,
    (room.naturalWidth - cropW) / 2,
    floorY,
    cropW,
    floorH,
    0,
    height * 0.61,
    width,
    height * 0.39,
  );
}

/** Sparse airborne brush marks and a soft window light; no particles accumulate. */
export function drawRoomWind(
  g: CanvasRenderingContext2D,
  window: ReturnType<typeof roomWindow>,
  time: number,
  reduced: boolean,
) {
  const t = reduced ? 0 : time;
  g.save();
  g.beginPath();
  g.rect(window.x, window.y, window.w, window.h);
  g.clip();
  g.fillStyle = `rgba(222,185,110,${0.025 + (Math.sin(t * 0.7) + 1) * 0.012})`;
  g.fillRect(window.x, window.y, window.w, window.h);
  if (!reduced)
    for (let i = 0; i < 6; i++) {
      const p = (((t * 0.07 + i * 0.173) % 1) + 1) % 1;
      const x = window.x + window.w * (1 - p),
        y = window.y + window.h * (0.2 + i * 0.11 + Math.sin(t * 1.2 + i) * 0.025);
      g.save();
      g.translate(x, y);
      g.rotate(Math.sin(t + i) * 0.6);
      g.fillStyle = `rgba(205,168,95,${Math.sin(p * Math.PI) * 0.32})`;
      g.fillRect(-window.w * 0.01, -1, window.w * 0.02, Math.max(1, window.w * 0.004));
      g.restore();
    }
  g.restore();
}
