import type { Figure, Pose, Point } from './types.ts';
import { enemyPresence } from './enemy-presence.ts';
import { playerPresence } from './player-presence.ts';

export function resolveFigurePose(figure: Figure, clock: number, reducedMotion = false): Figure {
  const time = reducedMotion ? 0 : clock;
  if (reducedMotion && figure.secondary) figure = { ...figure, secondary: undefined };
  return playerPresence(enemyPresence(figure, time, reducedMotion), time, reducedMotion);
}

export function bladeTip(pose: Pose, lean: number, length = 0.52): Point {
  length = length || 0.52;
  const ca = Math.cos(pose.ang),
    sa = Math.sin(pose.ang);
  return [
    pose.gx + lean + ca * length + sa * length * 0.05,
    pose.gy + sa * length - ca * length * 0.05,
  ];
}

/** Same resolved figure transform and blade tip used by the native drawing port. */
export function figureBladeTip(figure: Figure): Point {
  const [x, y] = bladeTip(
    figure.pose,
    figure.lean || 0,
    figure.spear ? 0.98 : figure.blade ? figure.blade.len : 0.52,
  );
  const ca = Math.cos(figure.rot || 0),
    sa = Math.sin(figure.rot || 0);
  const sx = x * figure.h,
    sy = y * figure.h * (figure.sy || 1);
  return [figure.x + ca * sx - sa * sy, figure.y + sa * sx + ca * sy];
}
