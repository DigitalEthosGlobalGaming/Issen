import type { SceneDrawing } from './scene-drawing.ts';
import { drawCachedBrushRing, drawCachedGlyphArrow } from './scene-brush-ring.ts';
import { drawSeal } from './ui-art.ts';
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
  /** Combat status is independent of the direction arrow and timing-ring visibility. */
  emphasis?: 'attacking' | 'next' | 'waiting';
  alpha?: number;
  quiver?: boolean;
  prog?: number | null;
  noArc?: boolean | number;
  frozen?: boolean;
  arrowA?: number | null;
  ghost?: Direction | null;
  rank?: number;
}

/** Entry fades multiply status brightness so arriving enemies never look like the attacker. */
export function enemyGlyphCue(attacking: boolean, rank: number, entryAlpha = 1) {
  const emphasis = attacking ? 'attacking' : rank === 1 ? 'next' : 'waiting';
  return {
    emphasis,
    alpha: clamp(entryAlpha) * (attacking ? 1 : rank === 1 ? 0.75 : 0.45),
  } as const;
}
const hexA = (h: string, a: number) => {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
function brushRing(g: SceneDrawing, r: number, a0: number, frac: number, w: number, col: string) {
  // The outer direction-marker ring has fixed shape and two paint variants.
  // Retain the original overlapping strokes; native renderers then only
  // transform cached geometry. Progress rings keep their procedural geometry.
  if (
    frac === 0.93 &&
    a0 === -2.2 &&
    w === r * 0.1 &&
    g.shadowBlur === 0 &&
    g.shadowOffsetX === 0 &&
    g.shadowOffsetY === 0 &&
    drawCachedBrushRing(g, r, col)
  )
    return;
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
  g: SceneDrawing,
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
  const waiting = o.emphasis === 'waiting';
  // Square corners identify the live threat without suggesting a swipe direction.
  // Keep them even when a challenge hides arrows or the timing ring.
  if (o.emphasis === 'attacking') {
    const edge = r * 1.32,
      corner = r * 0.3;
    g.strokeStyle = '#f4ede1';
    g.lineWidth = Math.max(1.5, r * 0.065);
    g.lineCap = 'square';
    g.shadowColor = '#121110';
    g.shadowBlur = 3;
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        g.beginPath();
        g.moveTo(sx * (edge - corner), sy * edge);
        g.lineTo(sx * edge, sy * edge);
        g.lineTo(sx * edge, sy * (edge - corner));
        g.stroke();
      }
    }
    g.shadowBlur = 0;
  }
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
  g.fillStyle = waiting
    ? 'rgba(22,21,19,.8)'
    : o.frozen
      ? 'rgba(208,226,242,.96)'
      : inZ
        ? 'rgba(246,236,226,.95)'
        : 'rgba(234,229,217,.9)';
  g.beginPath();
  g.arc(0, 0, r * 0.9, 0, TAU);
  g.fill();
  brushRing(g, r, -2.2, 0.93, r * 0.1, waiting ? 'rgba(234,229,217,.65)' : 'rgba(18,17,15,.3)');
  if (o.prog != null) brushRing(g, r, a0, clamp(o.prog), r * 0.22, '#121110');
  g.save();
  g.rotate(DANG[dir]);
  if (o.arrowA != null) g.globalAlpha *= o.arrowA;
  g.strokeStyle = waiting ? '#eae5d9' : '#121110';
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.lineWidth = r * 0.2;
  g.beginPath();
  g.moveTo(-r * 0.46, 0);
  g.lineTo(r * 0.36, 0);
  g.stroke();
  g.lineWidth = r * 0.23;
  if (!drawCachedGlyphArrow(g, r)) {
    g.beginPath();
    g.moveTo(r * 0.02, -r * 0.36);
    g.lineTo(r * 0.44, 0);
    g.lineTo(r * 0.02, r * 0.36);
    g.stroke();
  }
  g.restore();
  if (o.ghost) {
    g.save();
    g.rotate(DANG[o.ghost]);
    g.globalAlpha *= 0.5;
    g.strokeStyle = SEALARC;
    g.lineWidth = r * 0.12;
    g.lineCap = 'round';
    if (!drawCachedGlyphArrow(g, r, true)) {
      g.beginPath();
      g.moveTo(r * 0.12, -r * 0.28);
      g.lineTo(r * 0.46, 0);
      g.lineTo(r * 0.12, r * 0.28);
      g.stroke();
    }
    g.restore();
  }
  if (o.rank) {
    const s = Math.max(13, r * 0.66);
    g.save();
    g.translate(r * 0.78, -r * 0.78);
    g.rotate(-0.08);
    drawSeal(g, 'paper', SEAL, -s / 2, -s / 2, s, s);
    g.fillStyle = '#f4ede1';
    g.font = `800 ${s * 0.7}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(kanji(o.rank), 0, s * 0.04);
    g.restore();
  }
  g.restore();
}
