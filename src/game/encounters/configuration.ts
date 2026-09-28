import { STAGES } from '../content/stages.ts';
import { clamp } from '../../shared/math.ts';
import type { Modifiers } from '../equipment/modifiers.ts';
// [enemy count, base feint chance, attack seconds, gap seconds], waves 7–12.
const NORMAL_TRANSITION = [
  [12, 0.18, 1.55, 0.31],
  [13, 0.2, 1.5, 0.31],
  [13, 0.2, 1.45, 0.31],
  [16, 0.3, 1.32, 0.27],
  [19, 0.4, 1.1, 0.21],
  [22, 0.5, 0.87, 0.1],
] as const;
const RONIN_TRANSITION = [
  [16, 0.28, 1.12, 0.19],
  [16, 0.3, 1.08, 0.18],
  [16, 0.3, 1.04, 0.17],
  [18, 0.36, 0.98, 0.15],
  [20, 0.43, 0.85, 0.12],
  [22, 0.5, 0.72, 0.1],
] as const;

export function waveConfig(w: number, mode: string, m: Modifiers) {
  const r = mode === 'ronin',
    dw = r ? w + 2 : w;
  // Give the third stage room to teach feints before late-wave pressure returns.
  const transition = w >= 7 && w <= 12;
  const tuned = transition ? (r ? RONIN_TRANSITION : NORMAL_TRANSITION)[w - 7]! : null;
  const pack = dw === 1 ? 3 : dw === 2 ? 4 : 5;
  const refill = dw >= 4,
    ordered = dw >= 3;
  const st = STAGES[Math.floor((w - 1) / 3) % STAGES.length]!;
  let feint = tuned ? tuned[1]! : dw >= 6 ? Math.min(0.5, 0.16 + 0.07 * (dw - 6)) : 0;
  if (ordered)
    feint = clamp(
      (feint + m.feint + (st.weather === 'sakura' && !transition ? 0.2 : 0)) * m.feintMul,
      0,
      0.6,
    );
  else feint = 0;
  return {
    pack,
    refill,
    total: tuned ? tuned[0]! : refill ? Math.min(5 + (dw - 3) * 2, 22) : pack,
    ordered,
    feint,
    atk:
      (tuned ? tuned[2]! : Math.max(r ? 0.72 : 0.85, (2.3 - 0.13 * (dw - 1)) * (r ? 0.82 : 1))) *
      m.atk,
    gap: (tuned ? tuned[3]! : Math.max(0.1, (0.55 - 0.04 * dw) * (r ? 0.7 : 1))) * m.gap,
  };
}
export function bossParameters(n: number, mode: string, m: Modifiers) {
  const r = mode === 'ronin';
  if (r) n += 1;
  const k = r ? 0.88 : 1;
  return {
    wind: Math.max(0.45, (0.95 - 0.07 * (n - 1)) * k),
    flash: Math.max(0.26, 0.46 - 0.035 * (n - 1)) * m.parry,
    stag: Math.max(0.75, (1.35 - 0.08 * (n - 1)) * k) * m.stag,
    feint: n >= 2 ? Math.min(0.45, 0.2 + 0.06 * (n - 2)) : 0,
    idleMin: Math.max(0.3, 0.8 - 0.08 * n),
    idleMax: Math.max(0.75, 1.7 - 0.12 * n),
  };
}
