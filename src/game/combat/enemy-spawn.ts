import type { Random } from '../../shared/random.ts';
import type { Enemy, EnemyPosition } from './enemy.ts';
import { createGrunt, type EnemySpawnState } from './grunt-spawn.ts';
export { pickEnemyLook } from './grunt-spawn.ts';
export type { EnemySpawnState } from './grunt-spawn.ts';
/** Temporary compatibility adapter while construction consumers migrate. */
export function spawnEnemy(
  state: EnemySpawnState,
  slot: number,
  attract: boolean,
  position: (enemy: Enemy) => EnemyPosition,
  random: Random = Math.random,
): Enemy {
  return createGrunt(state, slot, attract, position, random);
}
export function orderedEnemies(enemies: readonly Enemy[]): Enemy[] {
  return enemies
    .filter((enemy) => !['dying', 'strike', 'fade'].includes(enemy.state))
    .sort((a, b) => a.order - b.order);
}
export function selectAttacker(
  enemies: readonly Enemy[],
  ordered: boolean,
  random: Random = Math.random,
): Enemy | null {
  if (ordered) {
    const first = orderedEnemies(enemies)[0];
    return first?.state === 'idle' ? first : null;
  }
  const idle = enemies.filter((enemy) => enemy.state === 'idle');
  return idle.length ? idle[(random() * idle.length) | 0]! : null;
}
