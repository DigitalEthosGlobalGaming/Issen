import type { Direction } from '../../shared/directions.ts';
import type { SecondaryMotion } from './types.ts';

/** Small damped springs drive artwork only; they never change hands or hit timing. */
export function createSecondaryMotion() {
  let cloth = 0,
    clothVelocity = 0,
    charm = 0,
    charmVelocity = 0;
  const reset = () => {
    cloth = clothVelocity = charm = charmVelocity = 0;
  };
  return {
    reset,
    kick(direction: Direction | 'block', reduced = false, perfect = false) {
      if (reduced) {
        reset();
        return;
      }
      const force = { left: -1, right: 1, up: -0.65, down: 0.65, block: 0.35 }[direction];
      const strength = perfect ? 2.4 : 1;
      // A chained ordinary cut must not truncate an existing perfect-cut impulse.
      const clothCap = Math.max(0.65 * strength, Math.abs(clothVelocity)),
        charmCap = Math.max(4 * strength, Math.abs(charmVelocity));
      clothVelocity = Math.max(
        -clothCap,
        Math.min(clothCap, clothVelocity + force * 0.4 * strength),
      );
      charmVelocity = Math.max(-charmCap, Math.min(charmCap, charmVelocity + force * 3 * strength));
    },
    update(delta: number, reduced = false) {
      if (reduced) {
        reset();
        return;
      }
      let remaining = Math.max(0, Math.min(0.05, delta));
      while (remaining > 0) {
        const dt = Math.min(1 / 240, remaining);
        clothVelocity += (-70 * cloth - 12 * clothVelocity) * dt;
        charmVelocity += (-110 * charm - 8 * charmVelocity) * dt;
        cloth = Math.max(-0.085, Math.min(0.085, cloth + clothVelocity * dt));
        charm = Math.max(-0.48, Math.min(0.48, charm + charmVelocity * dt));
        remaining -= dt;
      }
    },
    sample(): SecondaryMotion {
      return { cloth, charm };
    },
  };
}
