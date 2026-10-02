import { clamp, easeInOut, easeOut } from '../../shared/math.ts';
import { EPOSE, mixPose, approachPose } from '../../rendering/figures/model.ts';
import type { Random } from '../../shared/random.ts';
import type { Boss } from './boss.ts';
import { bossShownDirection } from './boss-openings.ts';
import type { EnemyPosition } from '../combat/enemy.ts';
export interface BossEnvironment {
  rawDelta?: number;
  random: Random;
  sounds: { glint: () => void; feint: () => void };
  flash: (amount: number) => void;
  playerDie: (boss: Boss, reason: 'lateBoss') => void;
  recovered: (boss: Boss) => void;
  position: (boss: Boss) => EnemyPosition;
}
export function bossToIdle(b: Boss, base: number, R: Random = Math.random) {
  b.fromStrike = false;
  b.twinDone = false;
  b.state = 'idle';
  b.t = 0;
  b.idleT = base + R() * (b.bp.idleMax - b.bp.idleMin);
}
export function updateBoss(
  G: { boss: Boss | null; state: string },
  dt: number,
  env: BossEnvironment,
) {
  const { random: R, sounds: sfx, flash, playerDie, recovered, position: bossPos } = env;
  const b = G.boss;
  if (!b) return;
  if (b.state === 'dying') b.shadowTime = (b.shadowTime ?? 0) + (env.rawDelta ?? dt);
  const bp = b.bp;
  b.t += dt;
  b.life += dt;
  const active = G.state === 'boss';
  let tgt = EPOSE.guard,
    rate = 10;
  switch (b.state) {
    case 'enter':
      if (b.t >= 1.4) bossToIdle(b, 0.9, R);
      break;
    case 'idle':
      if (active && b.t >= b.idleT) {
        if (!b.def.mirror && !b.lastFeint && R() < bp.feint) {
          b.state = 'feint';
          b.dur = bp.wind * (0.9 + R() * 0.3);
          b.lastFeint = true;
        } else {
          b.state = 'windup';
          b.dur = bp.wind * (0.8 + R() * 0.45);
          b.lastFeint = false;
        }
        b.t = 0;
      }
      break;
    case 'windup':
      {
        const k = clamp(b.t / b.dur);
        tgt = mixPose(EPOSE.guard, EPOSE.raise, easeInOut(k));
        rate = 30;
        b.lean = -0.035 * k;
        if (k >= 1 && active) {
          b.state = 'flash';
          b.t = 0;
          b.glint = 1;
          sfx.glint();
          flash(0.14);
        }
      }
      break;
    case 'flash':
      tgt = EPOSE.raise;
      rate = 30;
      b.glint = 1;
      if (b.t >= bp.flash && active) playerDie(b, 'lateBoss');
      break;
    case 'feint':
      {
        const k = clamp(b.t / b.dur);
        const up = k < 0.7 ? easeInOut(k / 0.7) * 0.75 : 0.75 * (1 - easeOut((k - 0.7) / 0.3));
        tgt = mixPose(EPOSE.guard, EPOSE.raise, up);
        rate = 30;
        b.lean = -0.03 * up;
        if (k >= 1) bossToIdle(b, 0.2 + R() * 0.3, R);
      }
      break;
    case 'stagger':
      {
        tgt = EPOSE[bossShownDirection(b)];
        rate = b.blockT > 0 ? 42 : 22;
        if (b.blockT > 0) b.blockT -= dt;
        b.lean = 0.03;
        if (b.t >= b.window && active) {
          b.state = 'recover';
          b.t = 0;
          b.failed = true;
          recovered(b);
        }
      }
      break;
    case 'recover':
      if (b.t >= 0.35) bossToIdle(b, bp.idleMin, R);
      break;
    case 'hurt':
      tgt = EPOSE[bossShownDirection(b)];
      b.lean = 0.05 * (1 - clamp(b.t / 0.5));
      if (b.t >= 0.5) bossToIdle(b, bp.idleMin * 0.8, R);
      break;
    case 'strike':
      tgt = EPOSE.down;
      rate = 28;
      if (b.zenBack && b.t > 0.4) {
        b.state = 'recover';
        b.t = 0;
        b.fromStrike = true;
        b.zenBack = false;
      }
      break;
    case 'dying':
      if (b.t >= 1.8) {
        G.boss = null;
        return;
      }
      break;
  }
  if (!['windup', 'feint', 'hurt', 'stagger'].includes(b.state)) b.lean *= Math.exp(-dt * 6);
  approachPose(b.pose, tgt, 1 - Math.exp(-dt * rate));
  if (b.state !== 'flash') b.glint = Math.max(0, b.glint - dt * 4);
  b.pos = bossPos(b);
}
