import type { RunState } from '../game/run-state.ts';
import { orderedEnemies } from '../game/combat/enemy-spawn.ts';
import { OPP, type Direction } from '../shared/directions.ts';

export type AutoplayAction = { kind: 'swipe'; direction: Direction } | { kind: 'parry' };

/** Read true attacks, then use the same inputs and legal windows as a player. */
export function autoplayAction(
  G: RunState,
  ordered: boolean,
  mirrored = false,
): AutoplayAction | null {
  if (G.state === 'playing') {
    const target = ordered
      ? orderedEnemies(G.enemies)[0]
      : (G.attacker ??
        G.enemies.find((enemy) => enemy.state === 'idle' || enemy.state === 'attack'));
    if (target && (target.state === 'idle' || target.state === 'attack'))
      return { kind: 'swipe', direction: mirrored ? OPP[target.dir] : target.dir };
  } else if (G.state === 'boss' && G.boss) {
    if (G.boss.state === 'flash') return { kind: 'parry' };
    if (G.boss.state === 'stagger') return { kind: 'swipe', direction: G.boss.sdir };
  } else if (G.state === 'standoff' && G.so?.fired && !G.so.done) {
    return { kind: 'swipe', direction: G.so.e.dir };
  }
  return null;
}
