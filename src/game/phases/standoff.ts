import type { RuleEvents } from '../events.ts';
import { definePhase } from '../session/phase-router.ts';
import { DIRS, DANG, type Direction } from '../../shared/directions.ts';
import {
  createStandoff,
  updateStandoff as simulateStandoff,
  resolveStandoffSwipe,
} from '../encounters/standoff.ts';
import type { RunState } from '../run-state.ts';
import type { Enemy } from '../combat/enemy.ts';
import type { Boss } from '../encounters/boss.ts';
import type { Equipment } from '../../platform/saves.ts';

export interface StandoffViews {
  readonly events: RuleEvents;
  readonly deferUntilSceneReady: (action: () => void) => boolean;
  readonly G: RunState;
  readonly waveCfg: (w: number) => {
    pack: number;
    refill: boolean;
    total: number;
    ordered: boolean;
    feint: number;
    atk: number;
    gap: number;
  };
  readonly L: { boss: { x: number; y: number; h: number } };
  readonly combatRandom: () => number;
  readonly pickLook: (n: number) => string | null;
  readonly enemyPos: (e: Enemy) => { x: number; y: number; h: number; fog: number; alpha: number };
  readonly captureCheckpoint: (status?: 'active' | 'ended' | 'lost') => void;
  readonly startWave: (n: number, skipEvent?: boolean) => void;
  readonly playerDie: (killer: Boss | Enemy | null, reason: string) => void;
  readonly accessible: (id: string) => boolean;
  readonly EQ: Equipment;
  readonly swingPlayer: (
    dir: 'block' | 'down' | 'left' | 'right' | 'up',
    perfect?: boolean,
  ) => void;
  readonly S: number;
  hitStop: number;
  readonly bumpCombo: () => void;
  readonly earn: (event: 'boss' | 'kill' | 'wave') => void;
  readonly addScore: (
    pts: number,
    x: number,
    y: number,
    label?: string | undefined,
    size?: number | undefined,
  ) => number;
  readonly comboMult: () => number;
  readonly saveStats: () => void;
  readonly checkUnlocks: () => void;
  readonly makeFigure: (seed: number) => Enemy['d'];
  readonly guardPose: Enemy['pose'];
}

/** Challenger setup and cut timing own plain records, with explicit feedback ports. */
export function createStandoffPhase<Context>(
  readViews: (context: Context) => StandoffViews,
  context: Context,
) {
  const read = readViews;
  const current = () => read(context);
  function startStandoff(n: number, changed: boolean) {
    const views = current();
    const {
      deferUntilSceneReady,
      G,
      waveCfg,
      L,
      combatRandom,
      pickLook,
      enemyPos,
      captureCheckpoint,
      makeFigure,
      guardPose,
    } = views;
    if (deferUntilSceneReady(() => startStandoff(n, changed))) return;
    G.state = 'standoff';
    G.cfg = waveCfg(n);
    G.enemies = G.enemies.filter((e) => e.state === 'dying');
    G.attacker = null;
    G.pendingSpawns = [];
    G.toSpawn = 0;
    const B = L.boss;
    const e: Enemy = {
      feintAt: 0,
      pos: { x: 0, y: 0, h: 0, fog: 0, alpha: 1 },
      slot: 2,
      fixed: { x: B.x, y: B.y, h: B.h * 0.82, fog: 0.05 },
      dir: DIRS[(combatRandom() * 4) | 0]!,
      fake: null,
      switched: false,
      order: 0,
      state: 'idle',
      t: 0,
      life: 0,
      p: 0,
      T: 1,
      k: 0,
      d: makeFigure((combatRandom() * 1e9) | 0),
      pose: { ...guardPose },
      snap: 0,
      lean: 0,
      look: pickLook(9),
      glint: 0,
      challenger: true,
    };
    e.pos = enemyPos(e);
    G.enemies.push(e);
    G.so = createStandoff(e, n, G.mode, G.m.parry, G.m.soWin, combatRandom);
    views.events.emit('standoffStarted', { stage: G.stage, changed });
    captureCheckpoint();
  }
  function updateStandoff(dt: number) {
    const views = current();
    const { G, combatRandom, startWave, playerDie } = views;
    simulateStandoff(
      G,
      dt,
      {
        nextWave: (n) => {
          views.events.emit('standoffCue', { kind: 'exit' });
          startWave(n, true);
        },
        step: () => views.events.emit('standoffCue', { kind: 'step' }),
        draw: () => views.events.emit('standoffCue', { kind: 'draw' }),
        late: (e) => {
          playerDie(e, 'late');
          views.events.emit('standoffResolved', { won: false, perfect: false });
        },
      },
      combatRandom,
    );
  }
  function standoffSwipe(dir: Direction) {
    const views = current();
    const {
      G,
      playerDie,
      accessible,
      EQ,
      swingPlayer,
      S,
      bumpCombo,
      earn,
      addScore,
      comboMult,
      saveStats,
      checkUnlocks,
    } = views;
    const so = G.so,
      outcome = resolveStandoffSwipe(so, dir, !!G.m.axisCut);
    if (outcome === 'ignore' || !so) return;
    const e = so.e;
    if (outcome === 'cut') {
      const p = e.pos,
        cx = p.x,
        cy = p.y - p.h * 0.55,
        a = DANG[dir];
      e.state = 'dying';
      e.t = 0;
      e.cutAng = a;
      e.shadowTime = 0;
      e.deathGround = { ...p };
      if (!G.m.bonk && accessible(EQ.fx) && EQ.fx === 'scattered-armour') e.deathType = 'scatter';
      else if (
        !G.m.bonk &&
        accessible(EQ.fx) &&
        ['falling-leaves', 'ember-ash', 'ink-wash'].includes(EQ.fx)
      )
        e.deathType = 'dissolve';
      e.k = 0;
      swingPlayer(dir, true);
      views.hitStop = 0.22;
      G.combo++;
      bumpCombo();
      G.kills++;
      earn('kill');
      addScore(
        Math.round(1000 * comboMult() * G.m.standoff),
        cx,
        p.y - p.h * 1.1,
        '挑',
        Math.max(22, 28 * S),
      );
      views.events.emit('standoffResolved', {
        won: true,
        perfect: true,
        direction: dir,
        x: cx,
        y: cy,
        height: p.h,
      });
      saveStats();
      checkUnlocks();
    } else {
      swingPlayer(dir);
      views.events.emit('swipeCue', { kind: 'miss' });
      playerDie(e, outcome);
      views.events.emit('standoffResolved', { won: false, perfect: false });
    }
  }
  return Object.assign(
    definePhase<Context>({
      update(_context, dt) {
        updateStandoff(dt);
      },
      onSwipe(_context, dir) {
        standoffSwipe(dir);
      },
      onTap() {
        const { G, swingPlayer, playerDie } = current();
        const so = G.so;
        if (so && !so.done && !so.fired) {
          so.done = true;
          swingPlayer('block');
          playerDie(so.e, 'early');
        }
      },
    }),
    { startStandoff },
  );
}
