import type { Figure } from './types.ts';

/** Idle-only breathing keeps feet and simulation pose fixed. */
export function playerPresence(f: Figure, time: number, reducedMotion = false): Figure {
  if (!f.back || !f.waiting || reducedMotion) return f;
  const breath = Math.sin(time * 1.8);
  return {
    ...f,
    sy: (f.sy ?? 1) * (1 + breath * 0.006),
    pose: { ...f.pose, gy: f.pose.gy + breath * 0.003, ang: f.pose.ang + breath * 0.008 },
  };
}
