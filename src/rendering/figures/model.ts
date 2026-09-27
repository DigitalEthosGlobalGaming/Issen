import { rng } from '../../shared/random.ts';
import { TAU, lerp, angDiff } from '../../shared/math.ts';
import type { FigureSeed, Pose } from './types.ts';
export function makeFig(seed: number): FigureSeed {
  const r = rng(seed);
  const hem = [];
  for (let i = 0; i <= 12; i++) hem.push(r());
  const sl: [number[], number[]] = [[], []];
  for (let s = 0; s < 2; s++) for (let i = 0; i < 5; i++) sl[s]!.push(r());
  const spots: FigureSeed['spots'] = [];
  for (let i = 0; i < 10; i++) {
    const y = -0.05 - r() * 0.72;
    const w = y > -0.5 ? 0.115 + 0.185 * ((y + 0.5) / 0.5) : 0.13;
    spots.push([(r() * 2 - 1) * w * 0.75, y, 0.01 + r() * 0.03, r() < 0.45]);
  }
  const grass: FigureSeed['grass'] = [];
  for (let i = 0; i < 14; i++)
    grass.push([(r() - 0.5) * 0.8, 0.04 + r() * 0.1, r() * TAU, r() * 0.02]);
  const hair: FigureSeed['hair'] = [];
  for (let i = 0; i < 4; i++) hair.push([r(), r()]);
  return { hem, sl, spots, grass, hair, seed: r() * 100 };
}
export const EPOSE = {
  guard: { gx: 0.06, gy: -0.56, ang: -0.5 },
  up: { gx: 0.02, gy: -0.95, ang: -Math.PI / 2 - 0.1 },
  down: { gx: 0.03, gy: -0.52, ang: Math.PI / 2 + 0.15 },
  left: { gx: -0.1, gy: -0.62, ang: Math.PI + 0.05 },
  right: { gx: 0.12, gy: -0.62, ang: -0.05 },
  raise: { gx: -0.03, gy: -1.0, ang: -Math.PI / 2 - 0.55 },
};
export const mixPose = (a: Pose, b: Pose, k: number) => ({
  gx: lerp(a.gx, b.gx, k),
  gy: lerp(a.gy, b.gy, k),
  ang: a.ang + angDiff(a.ang, b.ang) * k,
});
export function approachPose(p: Pose, t: Pose, k: number) {
  p.gx += (t.gx - p.gx) * k;
  p.gy += (t.gy - p.gy) * k;
  p.ang += angDiff(p.ang, t.ang) * k;
}
