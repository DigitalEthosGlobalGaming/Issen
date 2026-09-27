import { clamp, easeInOut, easeOut, lerp } from '../../shared/math.ts';
import type { Enemy } from '../../game/combat/enemy.ts';
import type { createLayout } from '../layout.ts';
export function enemyPosition(e: Enemy, L: ReturnType<typeof createLayout>, W: number, H: number) {
  const s = e.fixed || L.slots[e.slot];
  if (!s) throw new Error(`Invalid enemy slot ${e.slot}`);
  let x = s.x,
    y = s.y,
    h = s.h,
    fog = s.fog,
    alpha = 1;
  if (e.state === 'enter') {
    const k = easeInOut(clamp(e.t / 0.9)),
      side = s.x < W / 2 ? -1 : 1;
    alpha = clamp(e.t / 0.3);
    x += side * W * 0.16 * (1 - k);
    y -= (1 - k) * h * 0.3 + Math.abs(Math.sin(e.t * 13)) * h * 0.025 * (1 - k);
    h *= 0.72 + 0.28 * k;
    fog += (1 - k) * 0.6;
  }
  let k = 0;
  if (e.state === 'attack') k = Math.pow(clamp(e.p), 1.6);
  else if (e.state === 'dying' || e.state === 'strike' || e.state === 'fade') k = e.k || 0;
  if (k > 0) {
    const T = L.strike;
    x = lerp(x, T.x, k);
    y = lerp(y, T.y, k);
    h = lerp(h, T.h, k);
    fog = lerp(fog, 0.02, k);
  }
  if (e.state === 'fade') {
    alpha = 1 - clamp(e.t / 0.5);
    fog += e.t * 0.8;
  }
  if (e.state === 'strike' || e.state === 'fade') {
    const q = e.state === 'fade' ? 1 : easeOut(clamp(e.t / 0.25));
    x = lerp(x, L.player.x + L.player.h * 0.28, q);
    y = lerp(y, Math.min(H * 0.98, y + h * 0.15), q);
    h *= 1 + 0.25 * q;
  }
  if ((e.flinch ?? 0) > 0) y -= h * 0.03 * (e.flinch ?? 0);
  y += Math.sin(e.life * 1.7 + e.d.seed) * h * 0.004;
  return { x, y, h, fog: Math.max(0, fog), alpha };
}
