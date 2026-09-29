import type { Direction } from '../../shared/directions.ts';
import { directionMatches } from '../../shared/directions.ts';
import type { Enemy } from './enemy.ts';
import { orderedEnemies } from './enemy-spawn.ts';

export type SwipeOutcome =
  | { kind: 'ignore' }
  | { kind: 'cut'; target: Enemy; mirror: boolean }
  | { kind: 'miss'; killer: Enemy; reason: 'wrong' | 'feint' };
export function targetSwipe(
  enemies: readonly Enemy[],
  attacker: Enemy | null,
  direction: Direction,
  options: { ordered: boolean; centerX: number; mirrorAvailable: boolean; axisOnly?: boolean },
): SwipeOutcome {
  const alive = enemies.filter((enemy) => enemy.state === 'idle' || enemy.state === 'attack');
  if (!alive.length) return { kind: 'ignore' };
  if (options.ordered) {
    const target = orderedEnemies(enemies)[0];
    if (!target || target.state === 'enter') return { kind: 'ignore' };
    if (directionMatches(direction, target.dir, options.axisOnly))
      return { kind: 'cut', target, mirror: false };
    if (options.mirrorAvailable) return { kind: 'cut', target, mirror: true };
    return {
      kind: 'miss',
      killer: attacker || target,
      reason: target.fake && !target.switched && direction === target.fake ? 'feint' : 'wrong',
    };
  }
  const target =
    attacker && directionMatches(direction, attacker.dir, options.axisOnly)
      ? attacker
      : alive
          .filter((enemy) => directionMatches(direction, enemy.dir, options.axisOnly))
          .sort(
            (a, b) => Math.abs(a.pos.x - options.centerX) - Math.abs(b.pos.x - options.centerX),
          )[0];
  if (target) return { kind: 'cut', target, mirror: false };
  const fallback = attacker || alive[0]!;
  return options.mirrorAvailable
    ? { kind: 'cut', target: fallback, mirror: true }
    : { kind: 'miss', killer: fallback, reason: 'wrong' };
}
