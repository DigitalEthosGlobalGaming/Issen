import type { Leaf } from './ambient.ts';
export interface LeafBirth {
  readonly elapsed: number;
  readonly wind: number;
  readonly time: number;
}
/** Effects-clock integrals and spawn metadata; drawing never advances this owner. */
export function createLeafMotion() {
  const births = new WeakMap<Leaf, LeafBirth>();
  const clock = { elapsed: 0, wind: 0, time: 0 };
  let revision = 0,
    untilCull = 0;
  return {
    clock,
    get revision() {
      return revision;
    },
    invalidate() {
      revision++;
    },
    register(leaf: Leaf, time = clock.time) {
      const birth = Object.freeze({ elapsed: clock.elapsed, wind: clock.wind, time });
      births.set(leaf, birth);
      revision++;
      return birth;
    },
    birth(leaf: Leaf): LeafBirth {
      let birth = births.get(leaf);
      if (!birth) {
        birth = Object.freeze({ ...clock });
        births.set(leaf, birth);
        revision++;
      }
      return birth;
    },
    advance(dt: number, time: number, wind: number): boolean {
      const step = Math.max(0, Number.isFinite(dt) ? dt : 0);
      clock.elapsed += step;
      clock.wind += step * wind;
      clock.time = time;
      untilCull -= step;
      if (untilCull > 0 && step > 0) return false;
      untilCull = 0.125;
      return true;
    },
  };
}
export type LeafMotion = ReturnType<typeof createLeafMotion>;
/** Analytic pose also used by the low-rate lifetime sweep, never uploaded per frame. */
export function leafMotionPose(
  leaf: Readonly<Leaf>,
  birth: LeafBirth,
  clock: Readonly<LeafBirth>,
  scale: number,
  spriteMotion: boolean,
) {
  const age = Math.max(0, clock.elapsed - birth.elapsed),
    speed = leaf.gust ? 3.2 : 1;
  return {
    x: leaf.x + (40 * age + 95 * (clock.wind - birth.wind)) * leaf.z * scale * speed,
    y:
      leaf.y +
      (leaf.vy * age +
        (26 / 1.7) *
          (Math.cos(birth.time * 1.7 + leaf.ph) - Math.cos(clock.time * 1.7 + leaf.ph))) *
        leaf.z *
        0.6 *
        scale -
      (spriteMotion ? (leaf.rise ?? 0) * age * scale : 0),
    rot: leaf.rot + leaf.vr * age * (spriteMotion ? (leaf.spin ?? 1) : 1),
    flatten:
      1 -
      (spriteMotion ? (leaf.flutter ?? 1) : 1) +
      (spriteMotion ? (leaf.flutter ?? 1) : 1) * Math.cos(leaf.fl + leaf.vf * age),
  };
}
