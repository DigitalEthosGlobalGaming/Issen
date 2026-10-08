import { clamp, easeOut, easeInOut } from '../../shared/math.ts';
import { rng, type Random } from '../../shared/random.ts';
import type { Figure } from './types.ts';
import { deathDuration, type DeathStyle } from '../../shared/character-death.ts';
export {
  DEATH_STYLES,
  SHADOW_DURATION,
  BOSS_SHADOW_DURATION,
  deathDuration,
  deathShadowOpacity,
  chooseDeathStyle,
} from '../../shared/character-death.ts';
export type { DeathStyle } from '../../shared/character-death.ts';
/** Mutates a disposable render figure, never the enemy's combat position. */
export function applyDeathPose(
  f: Figure,
  style: DeathStyle,
  t: number,
  direction: number,
  reducedMotion = false,
): void {
  const duration = deathDuration(style);
  f.noShadow = true;
  f.glint = 0;
  f.alpha = (f.alpha ?? 1) * (1 - clamp((t - duration + 0.5) / 0.5));
  if (style === 'dissolve') {
    f.alpha = (f.alpha ?? 1) * (1 - easeOut(clamp(t / 0.7)));
    f.noSword = true;
    f.sy = reducedMotion ? 1 : 1 - 0.18 * clamp(t / 0.7);
    return;
  }
  if (reducedMotion) {
    f.sy = 1 - 0.15 * easeOut(clamp(t / 0.4));
    f.y += f.h * 0.08 * easeOut(clamp(t / 0.4));
    f.noSword = style === 'disarm';
    return;
  }
  if (style === 'kneel' || style === 'disarm') {
    const k1 = easeOut(clamp(t / 0.3)),
      k2 = easeInOut(clamp((t - 0.3) / 0.5));
    f.y += f.h * 0.16 * k1;
    f.sy = 1 - 0.22 * k1;
    f.rot = direction * 0.9 * k2;
    f.noSword = style === 'disarm';
  } else if (style === 'fall') {
    const k = easeInOut(clamp(t / 0.65));
    f.x += direction * f.h * 0.12 * k;
    f.y += f.h * 0.05 * k;
    f.rot = direction * Math.PI * 0.48 * k;
  } else if (style === 'crumple') {
    const k = easeOut(clamp(t / 0.55));
    f.sy = 1 - 0.68 * k;
    f.y += f.h * 0.03 * k;
    f.rot = direction * 0.18 * k;
    f.lean = -0.13 * k;
  } else {
    const k = easeOut(clamp(t / 0.6));
    f.y -= f.h * 0.05 * k;
    f.x += direction * f.h * 0.08 * k;
    f.rot = direction * 0.5 * easeInOut(clamp((t - 0.2) / 0.6));
  }
}

/** Stateless ballistic motion in figure units. It never consumes a gameplay RNG. */
export function scatteredPartMotion(index: number, elapsed: number, angle: number, seed: number) {
  const t = Math.max(0, elapsed);
  const random = rng(
    (Math.imul(seed | 0, 1664525) ^
      Math.imul(index + 1, 1013904223) ^
      Math.round(angle * 100003)) >>>
      0,
  );
  const launch = random() * Math.PI * 2;
  const speed = 0.38 + random() * 0.65;
  const vx = Math.cos(launch) * speed;
  const vy = Math.sin(launch) * speed - 0.12;
  const spin = (random() < 0.5 ? -1 : 1) * (1.6 + random() * 2.4);
  return {
    x: vx * t,
    y: vy * t + 0.72 * t * t,
    rotation: spin * t,
    alpha: 1 - clamp((t - 0.45) / (deathDuration('scatter') - 0.45)),
  };
}
