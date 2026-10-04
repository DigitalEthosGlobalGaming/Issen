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
    kick(direction: Direction | 'block', reduced = false) {
      if (reduced) {
        reset();
        return;
      }
      const force = { left: -1, right: 1, up: -0.65, down: 0.65, block: 0.35 }[direction];
      clothVelocity = Math.max(-0.65, Math.min(0.65, clothVelocity + force * 0.4));
      charmVelocity = Math.max(-4, Math.min(4, charmVelocity + force * 3));
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
        cloth = Math.max(-0.045, Math.min(0.045, cloth + clothVelocity * dt));
        charm = Math.max(-0.28, Math.min(0.28, charm + charmVelocity * dt));
        remaining -= dt;
      }
    },
    sample(): SecondaryMotion {
      return { cloth, charm };
    },
  };
}
