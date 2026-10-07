import type { Random } from '../../shared/random.ts';
import type { Enemy } from './enemy.ts';
export { pickEnemyLook } from './grunt-spawn.ts';
export type { EnemySpawnState } from './grunt-spawn.ts';
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
