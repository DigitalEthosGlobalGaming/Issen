import type { SceneDrawing } from '../scene-drawing.ts';
import { applySceneFilm } from '../scene-drawing.ts';
export function applyFilm(
  g: SceneDrawing,
  W: number,
  H: number,
  _source: CanvasImageSource,
  f: string,
  time = 0,
  preferences: { reducedMotion?: boolean; reducedFlashes?: boolean } = {},
) {
  if (applySceneFilm(g, f, W, H, time, preferences)) return;
  if (preferences.reducedMotion || preferences.reducedFlashes) time = 0;
  if (f === 'mono') return;
  g.save();
  if (f === 'trial-inferno') {
    const heat = g.createLinearGradient(0, 0, 0, H);
    heat.addColorStop(0, '#4b1620');
    heat.addColorStop(0.5, '#d34b15');
    heat.addColorStop(1, '#ffca57');
    g.globalCompositeOperation = 'color';
    g.globalAlpha = 0.56;
    g.fillStyle = heat;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'screen';
    g.globalAlpha = 1;
    for (let i = 0; i < 22; i++) {
      const x = (i / 21) * W;
      const rise = H * (0.12 + (i % 5) * 0.021 + Math.sin(time * 2.1 + i) * 0.014);
      const sway = Math.sin(time * 1.6 + i * 2.3) * W * 0.012;
      const flame = g.createLinearGradient(x, H, x, H - rise);
      flame.addColorStop(0, 'rgba(255,123,20,.34)');
      flame.addColorStop(0.65, 'rgba(255,193,57,.14)');
      flame.addColorStop(1, 'rgba(255,222,135,0)');
      g.fillStyle = flame;
      g.beginPath();
      g.moveTo(x - W * 0.038, H);
      g.quadraticCurveTo(x - W * 0.02, H - rise * 0.6, x + sway, H - rise);
      g.quadraticCurveTo(x + W * 0.018, H - rise * 0.45, x + W * 0.038, H);
      g.fill();
    }
    for (let i = 0; i < 36; i++) {
      const progress = (time * 0.1 + i / 36) % 1;
      const x = (((i * 137) % 997) / 997) * W + Math.sin(time + i) * 3;
      const y = H * (1 - progress);
      g.fillStyle = `rgba(255,${150 + (i % 75)},55,${(1 - progress) * 0.6})`;
      g.fillRect(x, y, Math.max(1, W / 350), Math.max(2, H / 220));
    }
  } else if (f === 'supporter-print') {
    // Soft-light preserves coloured attack cues rather than replacing their hue.
    const print = g.createLinearGradient(0, 0, 0, H);
    print.addColorStop(0, 'rgba(255,235,199,.26)');
    print.addColorStop(0.5, 'rgba(218,196,158,.08)');
    print.addColorStop(1, 'rgba(12,20,29,.28)');
    g.globalCompositeOperation = 'soft-light';
    g.fillStyle = print;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
    // Sparse deterministic grain: no gameplay RNG and no preview/live state sharing.
    for (let i = 0; i < 180; i++) {
      const x = (((i * 137 + Math.floor(time * 8) * 17) % 997) / 997) * W;
      const y = (((i * 251) % 991) / 991) * H;
      g.fillStyle = i % 2 ? 'rgba(255,242,215,.045)' : 'rgba(8,12,20,.045)';
      g.fillRect(x, y, 1, 1);
    }
  } else if (f === 'trial-gold') {
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
