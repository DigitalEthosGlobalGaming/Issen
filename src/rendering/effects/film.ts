export function applyFilm(
  g: CanvasRenderingContext2D,
  W: number,
  H: number,
  source: CanvasImageSource,
  f: string,
  time = 0,
) {
  if (f === 'mono') return;
  g.save();
  if (f === 'trial-gold') {
    const gold = g.createLinearGradient(0, 0, 0, H);
    gold.addColorStop(0, '#ffe58a');
    gold.addColorStop(0.45, '#e8b923');
    gold.addColorStop(1, '#a66b08');
    g.globalCompositeOperation = 'color';
    g.fillStyle = gold;
    g.fillRect(0, 0, W, H);
    const glow = g.createRadialGradient(W / 2, H * 0.2, 0, W / 2, H * 0.2, H * 0.85);
    glow.addColorStop(0, 'rgba(255,232,151,.32)');
    glow.addColorStop(0.6, 'rgba(215,159,31,.08)');
    glow.addColorStop(1, 'rgba(65,35,0,.3)');
    g.globalCompositeOperation = 'soft-light';
    g.fillStyle = glow;
    g.fillRect(0, 0, W, H);
  } else if (f === 'trial-glitch') {
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
      const shift =
        W * 0.005 * Math.sin(strip * 0.24 + time * 1.7) +
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
      const shift =
        W * (band % 3 === 0 ? -0.035 : 0.025) * (0.7 + 0.3 * Math.sin(time * 1.9 + band));
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
  } else if (f === 'trial-dusk' || f === 'trial-dawn') {
    const gradient = g.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, f === 'trial-dusk' ? 'rgba(92,65,138,.42)' : 'rgba(123,176,158,.32)');
    gradient.addColorStop(1, f === 'trial-dusk' ? 'rgba(167,116,64,.3)' : 'rgba(173,119,132,.28)');
    g.globalCompositeOperation = 'color';
    g.fillStyle = gradient;
    g.fillRect(0, 0, W, H);
  } else if (f === 'sepia') {
    g.globalCompositeOperation = 'color';
    g.fillStyle = 'rgba(122,80,38,.55)';
    g.fillRect(0, 0, W, H);
  } else if (f === 'silver') {
    g.globalCompositeOperation = 'color';
    g.fillStyle = 'rgba(70,94,124,.45)';
    g.fillRect(0, 0, W, H);
  } else if (f === 'noir') {
    g.globalCompositeOperation = 'overlay';
    g.globalAlpha = 0.55;
    g.drawImage(source, 0, 0, W, H);
  } else if (f === 'cyan') {
    g.globalCompositeOperation = 'color';
    g.fillStyle = 'rgba(38,86,140,.6)';
    g.fillRect(0, 0, W, H);
  } else if (f === 'nitrate') {
    g.globalCompositeOperation = 'color';
    g.fillStyle = 'rgba(150,108,58,.35)';
    g.fillRect(0, 0, W, H);
  } else if (f === 'ukiyo') {
    g.globalCompositeOperation = 'color';
    const gu = g.createLinearGradient(0, 0, 0, H);
    gu.addColorStop(0, 'rgba(34,58,112,.6)');
    gu.addColorStop(0.42, 'rgba(60,80,112,.32)');
    gu.addColorStop(0.58, 'rgba(150,112,58,.42)');
    gu.addColorStop(1, 'rgba(120,80,40,.48)');
    g.fillStyle = gu;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = 'rgba(236,222,190,.35)';
    g.fillRect(0, 0, W, H);
  } else if (f === 'koda') {
    g.globalCompositeOperation = 'color';
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, 'rgba(214,150,86,.42)');
    gr.addColorStop(0.55, 'rgba(160,140,110,.22)');
    gr.addColorStop(1, 'rgba(40,112,122,.45)');
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  }
  g.restore();
}
