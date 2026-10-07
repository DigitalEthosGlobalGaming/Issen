import { EPOSE, approachPose } from '../../shared/figure-model.ts';
import type { Boss } from './boss.ts';
import { bossBehaviours } from './boss-behaviours.ts';
import type { BossContext, BossEnvironment } from './boss-states.ts';
export function advanceBoss(
  G: { boss: Boss | null; state: string },
  dt: number,
  env: BossEnvironment,
) {
  const b = G.boss;
  if (!b) return;
  if (b.state === 'dying') b.shadowTime = (b.shadowTime ?? 0) + (env.rawDelta ?? dt);
  b.t += dt;
  b.life += dt;
  const c: BossContext = {
    G,
    env,
    active: G.state === 'boss',
    behaviour: bossBehaviours.resolve(b).behaviour,
    target: EPOSE.guard,
    rate: 10,
    retired: false,
  };
  c.behaviour.machine.update(b, c, dt);
  if (c.retired) return;
  if (!['windup', 'feint', 'hurt', 'stagger'].includes(b.state)) b.lean *= Math.exp(-dt * 6);
  approachPose(b.pose, c.target, 1 - Math.exp(-dt * c.rate));
  if (b.state !== 'flash') b.glint = Math.max(0, b.glint - dt * 4);
  b.pos = env.position(b);
}
