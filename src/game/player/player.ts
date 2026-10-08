import { createStateMachine, type StateTable } from '../state-machine.ts';
import { OPP } from '../../shared/directions.ts';
import type { Direction } from '../../shared/directions.ts';
import { approachPose, makeFig } from '../../shared/figure-model.ts';
import type { FigureSeed, Pose } from '../../shared/character.ts';

export const REST_POSE: Pose = { gx: 0.19, gy: -0.5, ang: 0.8 };
const SWING_POSES: Record<Direction, Pose> = {
  up: { gx: 0.1, gy: -0.9, ang: -1.45 },
  down: { gx: 0.17, gy: -0.42, ang: 1.35 },
  left: { gx: -0.08, gy: -0.62, ang: Math.PI - 0.15 },
  right: { gx: 0.27, gy: -0.62, ang: -0.12 },
};
const BLOCK_POSE: Pose = { gx: 0.12, gy: -0.8, ang: -0.55 };
export interface PlayerAnimation {
  pose: Pose;
  swingT: number;
  swingDir: Direction | 'block';
  lean: number;
  fall: number;
  d: FigureSeed;
}
export function createPlayerAnimation(): PlayerAnimation {
  return { pose: { ...REST_POSE }, swingT: 9, swingDir: 'right', lean: 0, fall: 0, d: makeFig(7) };
}
export function startSwing(player: PlayerAnimation, direction: Direction | 'block'): void {
  player.swingDir = direction;
  player.swingT = 0;
  if (direction !== 'block') Object.assign(player.pose, SWING_POSES[OPP[direction]]);
}
export type PlayerAnimationState = 'idle' | 'swing' | 'block' | 'death';
interface AnimationClock {
  state: PlayerAnimationState;
  t: number;
}
interface AnimationContext {
  player: PlayerAnimation;
  target: Pose;
  rate: number;
}
/** State is derived from the original plain animation fields; checkpoints gain
 * no fields. The existing animation has no separate hurt state or hurt timer. */
export function playerAnimationState(
  player: Readonly<PlayerAnimation>,
  fallen: boolean,
): PlayerAnimationState {
  if (fallen) return 'death';
  if (player.swingDir === 'block') return player.swingT < 0.45 ? 'block' : 'idle';
  return player.swingT < 0.22 ? 'swing' : 'idle';
}
export const playerAnimationTable: StateTable<
  PlayerAnimationState,
  AnimationClock,
  AnimationContext
> = {
  idle: {
    update(_clock, c) {
      c.target = REST_POSE;
      c.rate = 8;
    },
  },
  swing: {
    update(_clock, c) {
      const direction = c.player.swingDir;
      if (direction === 'block') throw new Error('Swing animation requires a cut direction');
      c.target = SWING_POSES[direction];
      c.rate = 45;
    },
  },
  block: {
    update(_clock, c) {
      c.target = BLOCK_POSE;
      c.rate = 40;
    },
  },
  death: {
    update(_clock, c) {
      c.target = { gx: 0.12, gy: -0.4, ang: 1.5 };
      c.rate = 4;
    },
  },
};
const animationMachine = createStateMachine(playerAnimationTable);
export function updatePlayerAnimation(player: PlayerAnimation, dt: number, fallen: boolean): void {
  player.swingT += dt;
  const c: AnimationContext = { player, target: REST_POSE, rate: 8 };
  animationMachine.update({ state: playerAnimationState(player, fallen), t: player.swingT }, c, dt);
  approachPose(player.pose, c.target, 1 - Math.exp(-dt * c.rate));
  const lean =
    player.swingT < 0.2 && player.swingDir !== 'block'
      ? 0.04 * (player.swingDir === 'left' ? -1 : 1)
      : 0;
  player.lean += (lean - player.lean) * (1 - Math.exp(-dt * 12));
}
