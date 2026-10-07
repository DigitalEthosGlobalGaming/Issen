import { definePhase } from '../session/phase-router.ts';
import { targetSwipe } from '../combat/targeting.ts';
import { throwKnife } from '../combat/knife.ts';
import { OPP, type Direction } from '../../shared/directions.ts';
import type { Random } from '../../shared/random.ts';
import type { RunState } from '../run-state.ts';
import type { Enemy } from '../combat/enemy.ts';
import type { Boss } from '../encounters/boss.ts';
import type { Statistics } from '../progression/statistics.ts';
import type { TrialDefinition } from '../content/trials.ts';

export interface WavesViews {
  readonly G: RunState;
  readonly W: number;
  readonly ST: Statistics;
  readonly activeTrial: TrialDefinition | null;
  readonly combatRandom: Random;
  readonly waveConfiguration: () => NonNullable<RunState['cfg']>;
  readonly killEnemy: (
    enemy: Enemy,
    direction: Direction,
    chained?: boolean,
    preserveStreak?: boolean,
    automatic?: boolean,
  ) => void;
  readonly orderSucceeded: () => void;
  readonly pop: (x: number, y: number, text: string, size?: number) => void;
  readonly sfx: { glint(): void; whoosh(): void };
  readonly swingPlayer: (direction: Direction | 'block', perfect?: boolean) => void;
  readonly playerDie: (killer: Enemy | Boss | null, reason: string) => void;
  readonly enemyPos: (enemy: Enemy) => Enemy['pos'];
  readonly earn: (event: 'kill' | 'wave' | 'boss') => void;
  readonly addScore: (
    points: number,
    x: number,
    y: number,
    label?: string,
    size?: number,
  ) => number;
  readonly comboMult: () => number;
  readonly knifeTrail: (position: Enemy['pos']) => void;
  readonly sparks: (x: number, y: number, count: number) => void;
  readonly buzz: (duration: number) => void;
  readonly hud: (on: boolean) => void;
  readonly saveStats: () => void;
}

/** Wave inputs own targeting/knife rules; entry/update move in subsequent steps. */
export function createWavesPhase<Context>(readViews: (context: Context) => WavesViews) {
  return definePhase<Context>({
    onSwipe(context, dir) {
      const {
        G,
        W,
        activeTrial,
        waveConfiguration,
        killEnemy,
        orderSucceeded,
        pop,
        sfx,
        swingPlayer,
        playerDie,
      } = readViews(context);
      const outcome = targetSwipe(G.enemies, G.attacker, activeTrial?.mirrored ? OPP[dir] : dir, {
        ordered: waveConfiguration().ordered,
        centerX: W / 2,
        mirrorAvailable: !!(G.m.kagami && !G.kagamiUsed),
        axisOnly: !!G.m.axisCut,
      });
      if (outcome.kind === 'cut') {
        if (outcome.mirror) G.kagamiUsed = true;
        killEnemy(outcome.target, dir, outcome.mirror);
        if (waveConfiguration().ordered) orderSucceeded();
        if (outcome.mirror) {
          pop(0, 0, '鏡');
          sfx.glint();
        }
      } else if (outcome.kind === 'miss') {
        swingPlayer(dir);
        sfx.whoosh();
        playerDie(outcome.killer, outcome.reason);
      }
    },
    onTap(context) {
      const {
        G,
        combatRandom,
        enemyPos,
        waveConfiguration,
        ST,
        earn,
        addScore,
        comboMult,
        knifeTrail,
        sparks,
        sfx,
        buzz,
        hud,
        saveStats,
      } = readViews(context);
      const target = throwKnife(G, combatRandom);
      if (!target) return;
      const pos = enemyPos(target);
      const wasAttacker = G.attacker === target;
      target.pos = pos;
      target.state = 'dying';
      target.t = 0;
      target.shadowTime = 0;
      target.deathGround = { ...pos };
      target.k = 0;
      target.deathType = 'stagger';
      target.fallDir = 1;
      target.cutAng = -Math.PI / 4;
      if (wasAttacker) {
        G.attacker = null;
        G.gapT = waveConfiguration().gap;
      }
      G.kills++;
      ST.kills++;
      earn('kill');
      addScore(
        Math.round((wasAttacker ? 140 : 120) * comboMult() * G.m.normal),
        pos.x,
        pos.y - pos.h,
        'Knife',
      );
      knifeTrail(pos);
      sparks(pos.x, pos.y - pos.h * 0.55, 10);
      sfx.whoosh();
      buzz(8);
      hud(true);
      saveStats();
      return;
    },
  });
}
