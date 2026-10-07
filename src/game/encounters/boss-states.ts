import { clamp, easeInOut, easeOut } from '../../shared/math.ts';
import { EPOSE, mixPose, approachPose } from '../../shared/figure-model.ts';
import type { Pose } from '../../shared/character.ts';
import type { Random } from '../../shared/random.ts';
import type { Boss } from './boss.ts';
import type { EnemyPosition } from '../combat/enemy.ts';
import { createStateMachine, type StateTable } from '../state-machine.ts';
import type { BossBehaviour } from './boss-behaviours.ts';
export interface BossEnvironment {
  rawDelta?: number;
  random: Random;
  sounds: { glint: () => void; feint: () => void };
  flash: (amount: number) => void;
  playerDie: (boss: Boss, reason: 'lateBoss') => void;
  recovered: (boss: Boss) => void;
  position: (boss: Boss) => EnemyPosition;
}
export interface BossContext {
  G: { boss: Boss | null; state: string };
  env: BossEnvironment;
  active: boolean;
  behaviour: BossBehaviour;
  target: Pose;
  rate: number;
  retired: boolean;
}
function toIdle(b: Boss, c: BossContext, base: number, random: Random) {
  b.fromStrike = false;
  b.twinDone = false;
  machine.transition(b, 'idle', c);
  b.t = 0;
  b.idleT = base + random() * (b.bp.idleMax - b.bp.idleMin);
}
export const bossStateTable: StateTable<Boss['state'], Boss, BossContext> = {
  enter: {
    update(b, c, dt) {
      const { env } = c;
      const { random: R } = env;
      if (b.t >= 1.4) toIdle(b, c, 0.9, R);
    },
  },
  idle: {
    update(b, c, dt) {
      const { active, env } = c;
      const bp = b.bp;
      const { random: R } = env;
      if (active && b.t >= b.idleT) {
        if (c.behaviour.allowFeint && !b.lastFeint && R() < bp.feint) {
          machine.transition(b, 'feint', c);
          b.dur = bp.wind * (0.9 + R() * 0.3);
          b.lastFeint = true;
        } else {
          machine.transition(b, 'windup', c);
          b.dur = bp.wind * (0.8 + R() * 0.45);
          b.lastFeint = false;
        }
        b.t = 0;
      }
    },
  },
  windup: {
    update(b, c, dt) {
      const { active, env } = c;
      const { sounds: sfx, flash } = env;
      {
        const k = clamp(b.t / b.dur);
        c.target = mixPose(EPOSE.guard, EPOSE.raise, easeInOut(k));
        c.rate = 30;
        b.lean = -0.035 * k;
        if (k >= 1 && active) {
          machine.transition(b, 'flash', c);
          b.glint = 1;
          sfx.glint();
          flash(0.14);
        }
      }
    },
  },
  flash: {
    update(b, c, dt) {
      const { active, env } = c;
      const bp = b.bp;
      const { playerDie } = env;
      c.target = EPOSE.raise;
      c.rate = 30;
      b.glint = 1;
      if (b.t >= bp.flash && active) playerDie(b, 'lateBoss');
    },
  },
  feint: {
    update(b, c, dt) {
      const { env } = c;
      const { random: R } = env;
      {
        const k = clamp(b.t / b.dur);
        const up = k < 0.7 ? easeInOut(k / 0.7) * 0.75 : 0.75 * (1 - easeOut((k - 0.7) / 0.3));
        c.target = mixPose(EPOSE.guard, EPOSE.raise, up);
        c.rate = 30;
        b.lean = -0.03 * up;
        if (k >= 1) toIdle(b, c, 0.2 + R() * 0.3, R);
      }
    },
  },
  stagger: {
    update(b, c, dt) {
      const { active, env } = c;
      const { recovered } = env;
      {
        c.target = EPOSE[c.behaviour.shownDirection(b)];
        c.rate = b.blockT > 0 ? 42 : 22;
        if (b.blockT > 0) b.blockT -= dt;
        b.lean = 0.03;
        if (b.t >= b.window && active) {
          machine.transition(b, 'recover', c);
          b.failed = true;
          recovered(b);
        }
      }
    },
  },
  recover: {
    update(b, c, dt) {
      const { env } = c;
      const bp = b.bp;
      const { random: R } = env;
      if (b.t >= 0.35) toIdle(b, c, bp.idleMin, R);
    },
  },
  hurt: {
    update(b, c, dt) {
      const { env } = c;
      const bp = b.bp;
      const { random: R } = env;
      c.target = EPOSE[c.behaviour.shownDirection(b)];
      b.lean = 0.05 * (1 - clamp(b.t / 0.5));
      if (b.t >= 0.5) toIdle(b, c, bp.idleMin * 0.8, R);
    },
  },
  strike: {
    update(b, c, dt) {
      c.target = EPOSE.down;
      c.rate = 28;
      if (b.zenBack && b.t > 0.4) {
        machine.transition(b, 'recover', c);
        b.fromStrike = true;
        b.zenBack = false;
      }
    },
  },
  dying: {
    update(b, c, dt) {
      const { G } = c;
      if (b.t >= 1.8) {
        G.boss = null;
        c.retired = true;
        return;
      }
    },
  },
};
const machine = createStateMachine(bossStateTable);
