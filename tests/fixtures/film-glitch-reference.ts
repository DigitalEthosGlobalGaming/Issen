// Frozen pre-optimization Glitch algorithm from 992c39d. Pixel parity reference.
export function applyFilm(
  g: CanvasRenderingContext2D,
  W: number,
  H: number,
  source: CanvasImageSource,
  _film: string,
  time = 0,
  preferences: { reducedMotion?: boolean; reducedFlashes?: boolean } = {},
) {
  if (preferences.reducedMotion || preferences.reducedFlashes) time = 0;
  g.save();
  // Source rectangles use backing pixels; destinations use logical scene coordinates.
  const sx = 'width' in source && typeof source.width === 'number' ? source.width / W : 1;
  const sy = 'height' in source && typeof source.height === 'number' ? source.height / H : 1;
  // Disjoint strips can sample the canvas in place without feeding back into each other.
  // A small inset keeps the moving edges filled, even at the widest displacement.
  const inset = W * 0.008;
  for (let strip = 0; strip < 64; strip++) {
    const y = Math.floor((strip * H) / 64);
    const h = Math.floor(((strip + 1) * H) / 64) - y;
    if (!h) continue;
    const shift = preferences.reducedMotion
      ? 0
      : W * 0.005 * Math.sin(strip * 0.24 + time * 1.7) +
        W * 0.002 * Math.sin(strip * 0.71 - time * 2.3);
    g.drawImage(source, (inset + shift) * sx, y * sy, (W - inset * 2) * sx, h * sy, 0, y, W, h);
  }
  const colours = ['#00ffd5', '#ff19d9', '#3822ff', '#d8ff00'];
  g.globalCompositeOperation = 'color';
  g.globalAlpha = 0.32;
  for (let band = 0; band < 18; band++) {
    const y = Math.floor((band * H) / 18);
    g.fillStyle = colours[(band * 7) % colours.length]!;
    g.fillRect(0, y, W, Math.ceil(H / 18));
  }
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 0.35;
  for (let band = 1; band < 12; band += 2) {
    const y = Math.floor((band * H) / 12);
    const h = Math.max(1, Math.floor(H / 90));
    const shift = preferences.reducedMotion
      ? 0
      : W * (band % 3 === 0 ? -0.035 : 0.025) * (0.7 + 0.3 * Math.sin(time * 1.9 + band));
    g.drawImage(source, 0, y * sy, W * sx, h * sy, shift, y, W, h);
  }
  g.globalCompositeOperation = 'overlay';
  g.globalAlpha = 0.09;
  g.fillStyle = '#070015';
  for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
  g.globalCompositeOperation = 'screen';
  g.globalAlpha = 0.3;
  for (let block = 0; block < 24; block++) {
    g.fillStyle = colours[block % colours.length]!;
    g.fillRect(
      (((block * 137) % 997) / 997) * W,
      (((block * 263) % 991) / 991) * H,
      W * (0.012 + (block % 4) * 0.008),
      Math.max(1, H * 0.003),
    );
  }

  g.restore();
}
