import type { Enemy } from '../combat/enemy.ts';
import { selectAttacker } from '../combat/enemy-spawn.ts';
import { shuffle } from '../../shared/random.ts';
import type { Random } from '../../shared/random.ts';

export interface PendingSpawn {
  slot: number;
  t: number;
}
export interface WaveState {
  state: string;
  pendingSpawns: PendingSpawn[];
  attacker: Enemy | null;
  gapT: number;
  cfg: { ordered: boolean; atk: number } | null;
  enemies: Enemy[];
  toSpawn: number;
  nextT: number;
  wave: number;
  m: { waveBonus: number };
}
export function initialSpawns(
  pack: number,
  delayed: boolean,
  random: Random = Math.random,
): PendingSpawn[] {
  const slots = pack === 3 ? [1, 2, 3] : pack === 4 ? [0, 1, 3, 4] : [0, 1, 2, 3, 4];
  return shuffle(slots, random).map((slot, i) => ({ slot, t: (delayed ? 0.9 : 0.3) + i * 0.2 }));
}
export function updateWave(
  state: WaveState,
  dt: number,
  events: {
    spawn: (slot: number) => void;
    attack: (enemy: Enemy) => void;
    cleared: (bonus: number) => void;
  },
  random: Random = Math.random,
): void {
  if (state.state !== 'playing' || !state.cfg) return;
  for (const pending of state.pendingSpawns) pending.t -= dt;
  state.pendingSpawns = state.pendingSpawns.filter((pending) => {
    if (pending.t <= 0) {
      events.spawn(pending.slot);
      return false;
    }
    return true;
  });
  if (!state.attacker) {
    state.gapT -= dt;
    if (state.gapT <= 0) {
      const enemy = selectAttacker(state.enemies, state.cfg.ordered, random);
      if (enemy) {
        enemy.state = 'attack';
        enemy.t = 0;
        enemy.p = 0;
        enemy.T = state.cfg.atk * (0.9 + random() * 0.2);
        state.attacker = enemy;
        events.attack(enemy);
      }
    }
  }
  const alive = state.enemies.some((enemy) => !['dying', 'strike', 'fade'].includes(enemy.state));
  if (!alive && state.toSpawn <= 0 && !state.pendingSpawns.length) {
    state.state = 'between';
    state.nextT = 1.2;
    events.cleared(150 * state.wave * state.m.waveBonus);
  }
}
