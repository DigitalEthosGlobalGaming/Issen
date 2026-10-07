import { BOSSES, BOSS_IDENTITIES } from '../content/bosses.ts';
import type { Random } from '../../shared/random.ts';
import { EPOSE, makeFig } from '../../shared/figure-model.ts';
import { bossParameters } from './configuration.ts';
import type { Boss } from './boss.ts';
import type { Modifiers } from '../equipment/modifiers.ts';
import type { EnemyPosition } from '../combat/enemy.ts';
export function createBoss(
  count: number,
  mode: string,
  modifiers: Modifiers,
  position: (boss: Boss) => EnemyPosition,
  appearanceRandom?: Random,
): Boss {
  const index = (count - 1) % BOSSES.length;
  const identity = BOSS_IDENTITIES[index]!;
  const variation = appearanceRandom ? Math.min(2, Math.floor(appearanceRandom() * 3)) : 0;
  const def = appearanceRandom
      ? { ...BOSSES[index]!, n: identity.names[variation]!, pal: identity.tones[variation]! }
      : BOSSES[index]!,
    lap = Math.floor((count - 1) / BOSSES.length);
  const hp = Math.max(
    1,
    Math.min(6, 2 + Math.ceil(count * 0.6)) + (mode === 'ronin' ? 1 : 0) + modifiers.bossHp,
  );
  const b: Boss = {
    varied: !!appearanceRandom,
    def,
    lap,
    hp,
    maxHp: hp,
    state: 'enter',
    t: 0,
    life: 0,
    pose: { ...EPOSE.guard },
    d: makeFig(appearanceRandom ? Math.floor(appearanceRandom() * 1_000_000) : 1000 + count * 17),
    lean: 0,
    glint: 0,
    idleT: 1,
    dur: 1,
    sdir: 'up',
    lastFeint: false,
    bp: bossParameters(count, mode, modifiers),
    cutAng: 0,
    chainLen: 1,
    chainLeft: 1,
    window: 1,
    blockT: 0,
    twinDone: false,
    failed: false,
    kageUsed: 0,
    pos: { x: 0, y: 0, h: 0, fog: 0, alpha: 0 },
  };
  if (def.mirror) b.bp.feint = 0;
  if (def.spear) {
    b.bp.flash *= 0.8;
    b.bp.wind *= 1.2;
  }
  b.pos = position(b);
  return b;
}
