export function applyFilm(
  g: CanvasRenderingContext2D,
  W: number,
  H: number,
  source: CanvasImageSource,
  f: string,
) {
  if (f === 'mono') return;
  g.save();
  if (f === 'sepia') {
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
