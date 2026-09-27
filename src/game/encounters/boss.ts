import type { Direction } from '../../shared/directions.ts';
import type { FigureSeed, Pose } from '../../rendering/figures/types.ts';
import type { EnemyPosition } from '../combat/enemy.ts';
import type { bossParameters } from './configuration.ts';
export interface BossDefinition {
  v: string;
  k: string;
  n: string;
  twin?: number;
  spear?: number;
  mirror?: number;
  pal?: string;
}
export interface Boss {
  def: BossDefinition;
  lap: number;
  hp: number;
  maxHp: number;
  state:
    | 'enter'
    | 'idle'
    | 'windup'
    | 'flash'
    | 'feint'
    | 'stagger'
    | 'recover'
    | 'hurt'
    | 'strike'
    | 'dying';
  t: number;
  life: number;
  pose: Pose;
  d: FigureSeed;
  lean: number;
  glint: number;
  idleT: number;
  dur: number;
  sdir: Direction;
  lastFeint: boolean;
  bp: ReturnType<typeof bossParameters>;
  cutAng: number;
  chainLen: number;
  chainLeft: number;
  window: number;
  blockT: number;
  twinDone: boolean;
  sfake: Direction | null;
  sflip: number;
  flipped: boolean;
  failed: boolean;
  kageUsed: number;
  pos: EnemyPosition;
  fromStrike?: boolean;
  zenBack?: boolean;
}
