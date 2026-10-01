import type { Enemy } from './enemy.ts';
import type { Random } from '../../shared/random.ts';

/** Refill the run's snapshotted capacity; upgrades never change an active run. */
export function refillDuelKnives(run: { knives: number; maxKnives: number }): void {
  run.knives = run.maxKnives;
}

/** Spend only after selecting a target. Bosses, standoffs and UI never qualify. */
export function throwKnife(
  run: { state: string; panel?: unknown; knives: number; enemies: Enemy[] },
  random: Random = Math.random,
): Enemy | null {
  if (run.state !== 'playing' || run.panel || run.knives <= 0) return null;
  const targets = run.enemies.filter((enemy) => enemy.state === 'idle' || enemy.state === 'attack');
  if (!targets.length) return null;
  const target =
    targets[Math.min(targets.length - 1, Math.max(0, Math.floor(random() * targets.length)))]!;
  run.knives--;
  return target;
}
