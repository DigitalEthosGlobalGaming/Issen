import { clamp, easeOut, easeInOut } from '../../shared/math.ts';
import type { Random } from '../../shared/random.ts';
import type { Figure } from './types.ts';
export const DEATH_STYLES = {
  split: { duration: 0.9 },
  dissolve: { duration: 0.9 },
  kneel: { duration: 1.1 },
  stagger: { duration: 1.1 },
  disarm: { duration: 1.1 },
  fall: { duration: 1.1 },
  crumple: { duration: 1.1 },
} as const;
export type DeathStyle = keyof typeof DEATH_STYLES;
export const SHADOW_DURATION = 0.4;
export const BOSS_SHADOW_DURATION = 0.7;
export function deathDuration(style: DeathStyle = 'split'): number {
  return DEATH_STYLES[style]?.duration ?? DEATH_STYLES.split.duration;
}
export function deathShadowOpacity(elapsed: number, duration = SHADOW_DURATION): number {
  return 1 - easeOut(clamp(elapsed / duration));
}
/** Presentation randomness only; never pass the combat stream here. */
export function chooseDeathStyle(perfect: boolean, bonk: boolean, random: Random): DeathStyle {
  const roll = random();
  if (bonk) return roll < 0.3 ? 'kneel' : roll < 0.6 ? 'stagger' : roll < 0.85 ? 'fall' : 'crumple';
  if (perfect) return roll < 0.6 ? 'split' : roll < 0.85 ? 'fall' : 'crumple';
  return roll < 0.25
    ? 'split'
    : roll < 0.4
      ? 'kneel'
      : roll < 0.55
        ? 'stagger'
        : roll < 0.7
          ? 'disarm'
          : roll < 0.9
            ? 'fall'
            : 'crumple';
}
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
