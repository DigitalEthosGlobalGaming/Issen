import type { Direction } from '../../shared/directions.ts';
import type { DeathStyle } from '../../shared/character-death.ts';
import type { FigureSeed, Pose } from '../../shared/character.ts';
export interface EnemyPosition {
  x: number;
  y: number;
  h: number;
  fog: number;
  alpha: number;
}
export interface Enemy {
  slot: number;
  dir: Direction;
  fake: Direction | null;
  feintAt: number;
  switched: boolean;
  order: number;
  state: 'enter' | 'idle' | 'attack' | 'dying' | 'strike' | 'fade';
  t: number;
  life: number;
  p: number;
  T: number;
  k: number;
  d: FigureSeed;
  pose: Pose;
  snap: number;
  lean: number;
  look: string | null;
  glint: number;
  pos: EnemyPosition;
  fixed?: Omit<EnemyPosition, 'alpha'>;
  flinch?: number;
  challenger?: boolean;
  rang?: boolean;
  still?: boolean;
  zen?: boolean;
  deathType?: DeathStyle;
  /** Unpaused real time, separate from slowed combat/death animation time. */
  shadowTime?: number;
  deathGround?: EnemyPosition;
  cutAng?: number;
  fallDir?: number;
}
