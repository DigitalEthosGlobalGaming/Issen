import type { Enemy } from '../combat/enemy.ts';
import type { Direction } from '../../shared/directions.ts';
import { directionMatches } from '../../shared/directions.ts';
import type { Random } from '../../shared/random.ts';
export interface Standoff {
  e: Enemy;
  n: number;
  t: number;
  fireAt: number;
  win: number;
  twitch: number;
  fired: boolean;
  ft: number;
  done: boolean;
  doneT: number;
}
export function createStandoff(
  e: Enemy,
  n: number,
  mode: string,
  parry: number,
  windowModifier: number,
  random: Random = Math.random,
): Standoff {
  return {
    e,
    n,
    t: 0,
    fireAt: 1.8 + random() * 2.6,
    win: Math.max(0.34, (mode === 'ronin' ? 0.42 : 0.5) * parry * windowModifier),
    twitch: 0.9 + random() * 0.8,
    fired: false,
    ft: 0,
    done: false,
    doneT: 0,
  };
}
export function updateStandoff(
  run: { so: Standoff | null; state: string },
  dt: number,
  events: {
    nextWave: (wave: number) => void;
    step: () => void;
    draw: () => void;
    late: (enemy: Enemy) => void;
  },
  random: Random = Math.random,
): void {
  const so = run.so;
  if (!so) return;
  so.t += dt;
  const enemy = so.e;
  if (so.done) {
    so.doneT += dt;
    if (so.doneT > 1.4 && run.state === 'standoff') {
      run.so = null;
      events.nextWave(so.n);
    }
    return;
  }
  if (!so.fired) {
    if (so.t >= so.twitch && so.t < so.fireAt - 0.4) {
      so.twitch = so.t + 0.7 + random() * 1.1;
      enemy.lean = 0.035 * (random() < 0.5 ? -1 : 1);
      events.step();
    }
    if (so.t >= so.fireAt) {
      so.fired = true;
      so.ft = so.t;
      enemy.glint = 1;
      enemy.snap = 0.08;
      events.draw();
    }
  } else {
    enemy.glint = 1;
    if (so.t - so.ft > so.win) {
      so.done = true;
      enemy.glint = 0;
      events.late(enemy);
    }
  }
}
export function resolveStandoffSwipe(
  so: Standoff | null,
  direction: Direction,
  axisOnly = false,
): 'ignore' | 'cut' | 'early' | 'wrong' {
  if (!so || so.done) return 'ignore';
  so.done = true;
  so.e.glint = 0;
  return !so.fired ? 'early' : directionMatches(direction, so.e.dir, axisOnly) ? 'cut' : 'wrong';
}
