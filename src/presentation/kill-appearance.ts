import type { Enemy } from '../game/combat/enemy.ts';
import type { EnemyKillViews } from '../game/combat/kill.ts';
import type { Direction } from '../shared/directions.ts';
import type { Random } from '../shared/random.ts';
import type { PresentationState } from './state.ts';
import type { KillFeedbackViews } from './kill.ts';
import { TAU } from '../shared/math.ts';
import { chooseDeathStyle, SHADOW_DURATION } from '../shared/character-death.ts';
export interface KillAppearanceViews {
  readonly bonk: boolean;
  readonly fxId: string;
  readonly accessible: (id: string) => boolean;
  readonly R: Random;
  readonly presentationState: Pick<PresentationState, 'fx' | 'shake'>;
}
type KillAppearance = Pick<EnemyKillViews, 'deathAppearance'> & Pick<KillFeedbackViews, 'disarm' | 'coin' | 'stain' | 'shake'>;
/** Cosmetic death selection/debris capabilities use current values and visual randomness. */
export function createKillAppearance(readViews: () => KillAppearanceViews): KillAppearance {
  return {
    deathAppearance(perfect: boolean, bonk: boolean, dir: Direction) {
      const { bonk: currentBonk, fxId, accessible, R } = readViews();
      const deathType =
        !currentBonk && accessible(fxId) && fxId === 'scattered-armour'
          ? 'scatter'
          : !currentBonk &&
              accessible(fxId) &&
              ['falling-leaves', 'ember-ash', 'ink-wash'].includes(fxId)
            ? 'dissolve'
            : chooseDeathStyle(perfect, !!currentBonk, R);
      const fallDir = dir === 'left' ? -1 : dir === 'right' ? 1 : R() < 0.5 ? -1 : 1;
      return { deathType, fallDir };
    },
    disarm(pos: Enemy['pos']) {
      const { R, presentationState } = readViews();
      const q = pos,
        s2 = q.h / 160;
      presentationState.fx.swords.push({
        x: q.x + q.h * 0.1,
        y: q.y - q.h * 0.6,
        vx: (R() - 0.5) * 260 * s2,
        vy: -(380 + R() * 200) * s2,
        ang: R() * TAU,
        vr: (R() < 0.5 ? -1 : 1) * (10 + R() * 6),
        len: q.h * 0.5,
        ground: q.y + q.h * 0.01,
        t: 0,
        stuck: false,
        life: 2.4,
      });
    },
    coin(pos: Enemy['pos']) {
      const { presentationState } = readViews();
      presentationState.fx.coins.push({
        x0: pos.x,
        y0: pos.y - pos.h * 0.6,
        t: 0,
        life: 0.8,
      });
    },
    stain(P0: Enemy['pos']) {
      const { R, presentationState } = readViews();
      presentationState.fx.stains.push({
        x: P0.x + (R() - 0.5) * P0.h * 0.2,
        y: P0.y + P0.h * 0.01,
        rx: P0.h * (0.12 + R() * 0.1),
        t: 0,
        life: SHADOW_DURATION,
      });
    },
    shake: (amount: number) => {
      const { presentationState } = readViews();
      presentationState.shake = Math.max(presentationState.shake, amount);
    },
  };
}
