import { clamp, easeOut, lerp } from '../../shared/math.ts';
import type { Boss } from '../../game/encounters/boss.ts';
import type { createLayout } from '../layout.ts';
export function bossPosition(b: Boss, L: ReturnType<typeof createLayout>) {
  const B = L.boss;
  let x = B.x,
    y = B.y,
    h = B.h,
    fog = 0.05,
    alpha = 1;
  if (b.state === 'enter') {
    const k = easeOut(clamp(b.t / 1.3));
    alpha = clamp(b.t / 0.7);
    fog += (1 - k) * 0.5;
    y -= (1 - k) * h * 0.08;
    h *= 0.82 + 0.18 * k;
  }
  if (b.state === 'stagger') {
    const q = 1 - clamp(b.t / b.window);
    x += h * 0.04 + Math.sin(b.life * 70) * h * 0.005 * q + h * 0.035 * clamp(b.blockT / 0.12);
  }
  if (b.state === 'recover' && b.fromStrike) {
    const q = easeOut(clamp(b.t / 0.35));
    x = lerp(L.player.x + L.player.h * 0.32, x, q);
  }
  if (b.state === 'hurt') x += h * 0.07 * (1 - clamp(b.t / 0.5));
  if (b.state === 'strike') {
    const q = easeOut(clamp(b.t / 0.22));
    x = lerp(x, L.player.x + L.player.h * 0.32, q);
    h *= 1 + 0.12 * q;
  }
  y += Math.sin(b.life * 1.3) * h * 0.003;
  return { x, y, h, fog, alpha };
}
