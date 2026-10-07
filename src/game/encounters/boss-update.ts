import type { Random } from '../../shared/random.ts';
import type { Boss } from './boss.ts';
import { resetBossIdle, type BossEnvironment } from './boss-states.ts';
import { advanceBoss } from './boss-simulation.ts';
export type { BossEnvironment } from './boss-states.ts';
/** Compatibility adapters retained until consumer migration is verified. */
export function bossToIdle(boss: Boss, base: number, random: Random = Math.random) {
  resetBossIdle(boss, base, random);
}
export function updateBoss(
  state: { boss: Boss | null; state: string },
  dt: number,
  env: BossEnvironment,
) {
  advanceBoss(state, dt, env);
}
