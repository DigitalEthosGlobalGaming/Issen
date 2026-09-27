import { TAU, clamp } from '../shared/math.ts';
import { DANG } from '../shared/directions.ts';
import type { Direction } from '../shared/directions.ts';
import { kanji } from '../shared/format.ts';
interface GlyphEnvironment {
  time: number;
  seal: string;
  sealArc: string;
  font: string;
  perfectZone: number;
  noArc: boolean;
}
interface GlyphOptions {
  alpha?: number;
  quiver?: boolean;
  prog?: number | null;
  noArc?: boolean | number;
  frozen?: boolean;
  arrowA?: number | null;
  ghost?: Direction | null;
  rank?: number;
}
const hexA = (h: string, a: number) => {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
function brushRing(
  g: CanvasRenderingContext2D,
  r: number,
  a0: number,
  frac: number,
  w: number,
  col: string,
) {
  const n = Math.max(2, Math.ceil(44 * frac));
  g.strokeStyle = col;
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const t0 = i / n,
      t1 = (i + 1) / n;
    g.lineWidth = w * (1 - 0.6 * t0);
    g.beginPath();
    g.arc(0, 0, r, a0 + frac * TAU * t0, a0 + frac * TAU * t1 + 0.01);
    g.stroke();
  }
}
export function drawEnso(
  g: CanvasRenderingContext2D,
  env: GlyphEnvironment,
  x: number,
  y: number,
  r: number,
  dir: Direction,
  o: GlyphOptions,
) {
  const { time, seal: SEAL, sealArc: SEALARC, font: FONT } = env;
  g.save();
  g.translate(x, y);
  g.globalAlpha = o.alpha == null ? 1 : o.alpha;
  if (o.quiver) g.translate(Math.sin(time * 57) * 1.3, Math.cos(time * 49) * 1.3);
  const a0 = -Math.PI / 2;
  const Z = env.perfectZone,
    arc = o.prog != null && !o.noArc && !env.noArc,
    inZ = arc && o.prog != null && o.prog >= Z;
  if (arc) {
    if (inZ) {
      g.strokeStyle = hexA(SEALARC, 0.55 + 0.35 * Math.sin(time * 30));
      g.lineWidth = Math.max(2, r * 0.08);
      g.beginPath();
      g.arc(0, 0, r * 1.26, 0, TAU);
      g.stroke();
    }
    g.strokeStyle = hexA(SEALARC, inZ ? 1 : 0.8);
    g.lineWidth = Math.max(3, r * (inZ ? 0.2 : 0.14));
    g.lineCap = 'butt';
    g.beginPath();
    g.arc(0, 0, r * 1.13, a0 + Z * TAU, a0 + TAU);
    g.stroke();
  }
  g.fillStyle = o.frozen
    ? 'rgba(208,226,242,.96)'
    : inZ
      ? 'rgba(246,236,226,.95)'
      : 'rgba(234,229,217,.9)';
  g.beginPath();
  g.arc(0, 0, r * 0.9, 0, TAU);
  g.fill();
  brushRing(g, r, -2.2, 0.93, r * 0.1, 'rgba(18,17,15,.3)');
  if (o.prog != null) brushRing(g, r, a0, clamp(o.prog), r * 0.22, '#121110');
  g.save();
  g.rotate(DANG[dir]);
  if (o.arrowA != null) g.globalAlpha *= o.arrowA;
  g.strokeStyle = '#121110';
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.lineWidth = r * 0.2;
  g.beginPath();
  g.moveTo(-r * 0.46, 0);
  g.lineTo(r * 0.36, 0);
  g.stroke();
  g.lineWidth = r * 0.23;
  g.beginPath();
  g.moveTo(r * 0.02, -r * 0.36);
  g.lineTo(r * 0.44, 0);
  g.lineTo(r * 0.02, r * 0.36);
  g.stroke();
  g.restore();
  if (o.ghost) {
    g.save();
    g.rotate(DANG[o.ghost]);
    g.globalAlpha *= 0.5;
    g.strokeStyle = SEALARC;
    g.lineWidth = r * 0.12;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(r * 0.12, -r * 0.28);
    g.lineTo(r * 0.46, 0);
    g.lineTo(r * 0.12, r * 0.28);
    g.stroke();
    g.restore();
  }
  if (o.rank) {
    const s = Math.max(13, r * 0.66);
    g.save();
    g.translate(r * 0.78, -r * 0.78);
    g.rotate(-0.08);
    g.fillStyle = SEAL;
    g.fillRect(-s / 2, -s / 2, s, s);
    g.strokeStyle = 'rgba(244,237,225,.4)';
    g.lineWidth = 1;
    g.strokeRect(-s / 2 + 2, -s / 2 + 2, s - 4, s - 4);
    g.fillStyle = '#f4ede1';
    g.font = `800 ${s * 0.7}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(kanji(o.rank), 0, s * 0.04);
    g.restore();
  }
  g.restore();
}
