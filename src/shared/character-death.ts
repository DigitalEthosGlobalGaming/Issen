import { clamp, easeOut } from './math.ts';
import type { Random } from './random.ts';
export const DEATH_STYLES = {
  split: { duration: 0.9 },
  dissolve: { duration: 0.9 },
  scatter: { duration: 1.1 },
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
