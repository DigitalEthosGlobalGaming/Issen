import { definePhase } from '../session/phase-router.ts';
import { STAGES } from '../content/stages.ts';
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
import type { Statistics, BladeStats } from '../progression/statistics.ts';

export interface StandoffViews {
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
  readonly banner: (glyph: string, label: string) => void;
  readonly letterbox: (d: number) => void;
  readonly sfx: { drum(): void; step(): void; glint(): void; perfect(): void; whoosh(): void };
  readonly hint: (key: string, text: string, dur?: number) => void;
  readonly captureCheckpoint: (status?: 'active' | 'ended' | 'lost') => void;
  readonly startWave: (n: number, skipEvent?: boolean) => void;
  readonly flash: (a: number, col?: string | undefined) => void;
  readonly playerDie: (killer: Boss | Enemy | null, reason: string) => void;
  readonly W: number;
  readonly H: number;
  readonly accessible: (id: string) => boolean;
  readonly EQ: Equipment;
  readonly swingPlayer: (
    dir: 'block' | 'down' | 'left' | 'right' | 'up',
    perfect?: boolean,
  ) => void;
  readonly addSlash: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    w: number,
    life?: number | undefined,
    dark?: boolean | undefined,
  ) => void;
  readonly S: number;
  readonly killFx: (cx: number, cy: number, ang: number, sc: number) => void;
  readonly scraps: (x: number, y: number, n: number, sc: number) => void;
  readonly ring: (x: number, y: number, r0: number, r1: number, life: number, w: number) => void;
  readonly stamp: (
    text: string,
    x: number,
    y: number,
    size: number,
    seal: boolean,
    life?: number | undefined,
  ) => void;
  readonly punch: (z: number, x: number, y: number) => void;
  hitStop: number;
  readonly combatHaptics: { play(event: 'slice'): void };
  readonly bumpCombo: () => void;
  readonly ST: Statistics;
  readonly challenge: (metric: keyof BladeStats, value?: number) => void;
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
  readonly setWaveLabel: (label: string) => void;
  readonly clearLetterbox: () => void;
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
      banner,
      letterbox,
      sfx,
      hint,
      captureCheckpoint,
      startWave,
      flash,
      playerDie,
      W,
      H,
      accessible,
      EQ,
      swingPlayer,
      addSlash,
      S,
      killFx,
      scraps,
      ring,
      stamp,
      punch,
      combatHaptics,
      bumpCombo,
      ST,
      challenge,
      earn,
      addScore,
      comboMult,
      saveStats,
      checkUnlocks,
      makeFigure,
      guardPose,
      setWaveLabel,
      clearLetterbox,
    } = views;
    if (deferUntilSceneReady(() => startStandoff(n, changed))) return;
    const st = STAGES[G.stage]!;
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
    banner(
      '挑',
      changed ? `A challenger in the ${st.n.toLowerCase()}` : 'A challenger blocks the road',
    );
    setWaveLabel('挑');
    letterbox(99);
    sfx.drum();
    hint(
      'standoff',
      'A standoff. Stay still. The instant he draws, cut the way his blade points. Moving early is death.',
      6500,
    );
    captureCheckpoint();
  }
  function updateStandoff(dt: number) {
    const views = current();
    const {
      deferUntilSceneReady,
      G,
      waveCfg,
      L,
      combatRandom,
      pickLook,
      enemyPos,
      banner,
      letterbox,
      sfx,
      hint,
      captureCheckpoint,
      startWave,
      flash,
      playerDie,
      W,
      H,
      accessible,
      EQ,
      swingPlayer,
      addSlash,
      S,
      killFx,
      scraps,
      ring,
      stamp,
      punch,
      combatHaptics,
      bumpCombo,
      ST,
      challenge,
      earn,
      addScore,
      comboMult,
      saveStats,
      checkUnlocks,
      makeFigure,
      guardPose,
      setWaveLabel,
      clearLetterbox,
    } = views;
    simulateStandoff(
      G,
      dt,
      {
        nextWave: (n) => {
          clearLetterbox();
          startWave(n, true);
        },
        step: () => sfx.step(),
        draw: () => {
          sfx.glint();
          flash(0.2);
        },
        late: (e) => playerDie(e, 'late'),
      },
      combatRandom,
    );
  }
  function standoffSwipe(dir: Direction) {
    const views = current();
    const {
      deferUntilSceneReady,
      G,
      waveCfg,
      L,
      combatRandom,
      pickLook,
      enemyPos,
      banner,
      letterbox,
      sfx,
      hint,
      captureCheckpoint,
      startWave,
      flash,
      playerDie,
      W,
      H,
      accessible,
      EQ,
      swingPlayer,
      addSlash,
      S,
      killFx,
      scraps,
      ring,
      stamp,
      punch,
      combatHaptics,
      bumpCombo,
      ST,
      challenge,
      earn,
      addScore,
      comboMult,
      saveStats,
      checkUnlocks,
      makeFigure,
      guardPose,
      setWaveLabel,
      clearLetterbox,
    } = views;
    const so = G.so,
      outcome = resolveStandoffSwipe(so, dir, !!G.m.axisCut);
    if (outcome === 'ignore' || !so) return;
    const e = so.e;
    if (outcome === 'cut') {
      const p = e.pos,
        cx = p.x,
        cy = p.y - p.h * 0.55,
        a = DANG[dir],
        v: [number, number] = [Math.cos(a), Math.sin(a)],
        M = Math.max(W, H) * 1.3,
        sc = p.h / 160;
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
      addSlash(cx - v[0] * M, cy - v[1] * M, cx + v[0] * M, cy + v[1] * M, Math.max(3, 3 * S), 0.6);
      killFx(cx, cy, a + Math.PI / 2, sc);
      scraps(cx, cy, 10, sc);
      ring(cx, cy, p.h * 0.1, p.h * 1.3, 0.5, Math.max(2, 3 * S));
      stamp('一閃', W / 2, H * 0.3, Math.max(56, 80 * S), true, 1.4);
      punch(1.08, cx, cy);
      views.hitStop = 0.22;
      flash(0.4);
      sfx.perfect();
      combatHaptics.play('slice');
      G.combo++;
      bumpCombo();
      G.kills++;
      ST.kills++;
      ST.standoffs++;
      challenge('k');
      earn('kill');
      addScore(
        Math.round(1000 * comboMult() * G.m.standoff),
        cx,
        p.y - p.h * 1.1,
        '挑',
        Math.max(22, 28 * S),
      );
      saveStats();
      checkUnlocks();
    } else {
      swingPlayer(dir);
      sfx.whoosh();
      playerDie(e, outcome);
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
