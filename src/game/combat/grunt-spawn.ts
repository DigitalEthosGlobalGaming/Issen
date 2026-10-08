import { DIRS } from '../../shared/directions.ts';
import type { Random } from '../../shared/random.ts';
import { EPOSE, makeFig } from '../../shared/figure-model.ts';
import type { Enemy, EnemyPosition } from './enemy.ts';

export function pickEnemyLook(wave: number, random: Random = Math.random): string | null {
  if (wave < 3) return null;
  const value = random();
  return value < 0.45 ? null : value < 0.65 ? 'mask' : value < 0.82 ? 'monk' : 'jingasa';
}
export interface EnemySpawnState {
  cfg: { feint: number } | null;
  toSpawn: number;
  nextOrder: number;
  wave: number;
  enemies: Enemy[];
}
export function createGrunt(
  state: EnemySpawnState,
  slot: number,
  attract: boolean,
  position: (enemy: Enemy) => EnemyPosition,
  random: Random = Math.random,
): Enemy {
  const dir = DIRS[(random() * 4) | 0]!;
  let fake: Enemy['fake'] = null;
  if (!attract && state.cfg?.feint && random() < state.cfg.feint)
    fake = DIRS.filter((d) => d !== dir)[(random() * 3) | 0]!;
  if (!attract) state.toSpawn--;
  const enemy: Enemy = {
    slot,
    dir,
    fake,
    feintAt: 0.3 + random() * 0.2,
    switched: false,
    order: state.nextOrder++,
    state: attract ? 'idle' : 'enter',
    t: 0,
    life: random() * 10,
    p: 0,
    T: 1,
    k: 0,
    d: makeFig((random() * 1e9) | 0),
    pose: { ...EPOSE.guard },
    snap: 0,
    lean: 0,
    look: attract ? null : pickEnemyLook(state.wave, random),
    glint: 0,
    pos: { x: 0, y: 0, h: 0, fog: 0, alpha: 0 },
  };
  enemy.pos = position(enemy);
  state.enemies.push(enemy);
  return enemy;
}
