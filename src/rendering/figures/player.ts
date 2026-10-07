import { OPP } from '../../shared/directions.ts';
import type { Direction } from '../../shared/directions.ts';
import { approachPose, makeFig } from '../../shared/figure-model.ts';
import type { FigureSeed, Pose } from './types.ts';

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
export function updatePlayerAnimation(player: PlayerAnimation, dt: number, fallen: boolean): void {
  player.swingT += dt;
  let target = REST_POSE,
    rate = 8;
  if (fallen) {
    target = { gx: 0.12, gy: -0.4, ang: 1.5 };
    rate = 4;
  } else if (player.swingDir === 'block' && player.swingT < 0.45) {
    target = BLOCK_POSE;
    rate = 40;
  } else if (player.swingDir !== 'block' && player.swingT < 0.22) {
    target = SWING_POSES[player.swingDir];
    rate = 45;
  }
  approachPose(player.pose, target, 1 - Math.exp(-dt * rate));
  const lean =
    player.swingT < 0.2 && player.swingDir !== 'block'
      ? 0.04 * (player.swingDir === 'left' ? -1 : 1)
      : 0;
  player.lean += (lean - player.lean) * (1 - Math.exp(-dt * 12));
}
