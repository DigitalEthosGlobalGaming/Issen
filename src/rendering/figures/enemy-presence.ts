import type { Figure } from './types.ts';

const weapons = [
  ['steel', 0.52],
  ['tsuki', 0.6],
  ['kodachi', 0.43],
  ['kiku', 0.53],
  ['doji', 0.56],
  ['kuro', 0.5],
] as const;
export const ENEMY_WEAPON_IDS: readonly string[] = weapons.map(([id]) => id);

/** Visual-only choices remain stable through checkpoint recovery and consume no RNG. */
export function enemyPresence(f: Figure, time: number, reducedMotion = false): Figure {
  if (!f.varied || f.back || f.spear || f.twin) return f;
  const seed = Math.abs(Math.floor(f.d.seed * 10007));
  const [bladeId, len] = weapons[Math.floor(seed / 17) % weapons.length]!;
  const angle = ((seed % 13) - 6) * 0.012;
  const phase = f.d.seed * 2.399;
  const breath =
    f.waiting && !reducedMotion ? Math.sin(time * (1.7 + (seed % 5) * 0.11) + phase) : 0;
  return {
    ...f,
    bladeId: f.bladeId ?? bladeId,
    blade: f.blade ?? { len },
    pose: { ...f.pose, ang: f.pose.ang + angle + breath * 0.012 },
    sy: (f.sy ?? 1) * (1 + breath * 0.007),
  };
}
