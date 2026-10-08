import type { RuleEvents } from '../events.ts';
import { definePhase } from '../session/phase-router.ts';
import { createBoss } from '../encounters/boss-create.ts';
import { advanceBoss as simulateBoss } from '../encounters/boss-simulation.ts';
import { parryOpening } from '../encounters/boss-openings.ts';
import { refillDuelKnives } from '../combat/knife.ts';
import { swiftSlashPoints, duelMasterTimings } from '../progression/mastery.ts';

import { restorableRng } from '../../shared/random.ts';

import { DIRS, DANG, directionMatches, type Direction } from '../../shared/directions.ts';
import type { RunState } from '../run-state.ts';
import type { Enemy } from '../combat/enemy.ts';
import type { Boss } from '../encounters/boss.ts';
import type { Equipment } from '../../platform/saves.ts';

import type { TrialDefinition } from '../content/trials.ts';
import type { DailyRun } from '../progression/daily.ts';

export interface BossViews {
  readonly events: RuleEvents;
  readonly deferUntilSceneReady: (action: () => void) => boolean;
  readonly G: RunState;
  readonly bossPos: (b: Boss) => { x: number; y: number; h: number; fog: number; alpha: number };
  readonly activeTrial: TrialDefinition | null;
  readonly activeDaily: DailyRun | null;
  readonly guided: { startBoss(): boolean; bossFlash(): void; bossParried(): void };
  readonly captureCheckpoint: (status?: 'active' | 'ended' | 'lost') => void;
  readonly combatRandom: () => number;
  readonly playerDie: (killer: Boss | Enemy | null, reason: string) => void;
  readonly breakCombo: () => void;
  readonly bossTipWorld: (b: Boss) => [number, number];
  readonly S: number;
  readonly swingPlayer: (
    dir: 'block' | 'down' | 'left' | 'right' | 'up',
    perfect?: boolean,
  ) => void;
  hitStop: number;
  readonly bumpCombo: () => void;
  readonly addScore: (
    pts: number,
    x: number,
    y: number,
    label?: string | undefined,
    size?: number | undefined,
  ) => number;
  readonly comboMult: () => number;
  readonly W: number;
  readonly H: number;
  readonly EQ: Equipment;
  readonly earn: (event: 'boss' | 'kill' | 'wave') => void;
  runBossMilestone: number;
  readonly saveStats: () => void;
  readonly checkUnlocks: () => void;
}

/** Duel rules retain plain boss records and explicit feedback ports. */
export function createBossPhase<Context>(
  readViews: (context: Context) => BossViews,
  context: Context,
) {
  const current = () => readViews(context);
  function startBoss() {
    const views = current();
    const {
      G,
      activeDaily,
      activeTrial,
      bossPos,
      captureCheckpoint,
      deferUntilSceneReady,
      guided,
    } = views;
    if (deferUntilSceneReady(startBoss)) return;
    refillDuelKnives(G);
    G.blessingTriggers.flourishWard = false;
    views.events.emit('livesChanged', { cause: 'refresh', lives: G.lives });
    G.bossCount++;
    const b = createBoss(
        G.bossCount,
        G.mode,
        G.m,
        bossPos,
        restorableRng((G.seed ^ Math.imul(G.bossCount, 0x9e3779b9)) >>> 0).next,
      ),
      { def, lap } = b;
    G.boss = b;
    G.state = 'boss';
    G.attacker = null;
    G.event = null;
    views.events.emit('bossEntered', {
      glyph: def.k,
      name: def.n,
      lap,
      wave: G.wave,
      rush: G.rush,
    });
    views.events.emit('bossHealth', { hp: b.hp, maximum: b.maxHp });
    views.events.emit('bossReady', { count: G.bossCount });
    if (!activeTrial && !activeDaily) guided.startBoss();
    views.events.emit('bossTraits', { twin: !!def.twin, spear: !!def.spear, mirror: !!def.mirror });
    views.events.emit('bossStarted', { boss: def.v, count: G.bossCount });
    captureCheckpoint();
  }
  function updateBoss(dt: number, raw = dt) {
    const views = current();
    const { G, bossPos, breakCombo, combatRandom, guided, playerDie } = views;
    simulateBoss(G, dt, {
      rawDelta: raw,
      random: combatRandom,
      events: views.events,
      playerDie,
      position: bossPos,
      recovered: (b) => {
        breakCombo();
        views.events.emit('bossCue', {
          kind: 'recovered',
          x: b.pos.x,
          y: b.pos.y,
          height: b.pos.h,
        });
      },
    });
    if (G.boss?.state === 'flash') guided.bossFlash();
  }
  function parry() {
    const views = current();
    const {
      G,
      activeTrial,
      addScore,
      bossTipWorld,
      bumpCombo,
      combatRandom,
      comboMult,
      guided,
      swingPlayer,
    } = views;
    const b = G.boss;
    if (!b) return;
    const tw = bossTipWorld(b);
    const { second, counterDamage } = parryOpening(
      b,
      {
        count: G.bossCount,
        mode: G.mode,
        chainModifier: G.m.chain,
        counter: G.bless.has('counter'),
      },
      combatRandom,
    );
    if (activeTrial?.duelMaster) b.chainLeft = b.chainLen = 1;
    if (!second && G.bless.has('timestop')) G.slowT = Math.max(G.slowT, 1.4);
    if (counterDamage) {
      views.events.emit('bossHealth', { hp: b.hp, maximum: b.maxHp });
      views.events.emit('bossCue', { kind: 'return', x: b.pos.x, y: b.pos.y, height: b.pos.h });
    }
    swingPlayer('block');
    views.hitStop = 0.09;
    G.combo++;
    G.parries++;
    guided.bossParried();
    bumpCombo();
    addScore(Math.round(60 * comboMult()), b.pos.x, b.pos.y - b.pos.h * 1.05);
    views.events.emit('parry', {
      boss: b.def.v,
      perfect: true,
      second,
      x: tw[0],
      y: tw[1],
      height: b.pos.h,
    });
    if (!second) views.events.emit('bossOpening', { kind: 'parry', mirror: !!b.def.mirror });
  }
  function blockHit(dir: Direction) {
    const views = current();
    const { G, addScore, bossTipWorld, bumpCombo, combatRandom, comboMult, swingPlayer } = views;
    const b = G.boss;
    if (!b) return;
    const tw = bossTipWorld(b);
    b.chainLeft--;
    let nd;
    do {
      nd = DIRS[(combatRandom() * 4) | 0]!;
    } while (nd === b.sdir);
    b.sdir = nd;
    b.t = 0;
    b.window = Math.max(0.5, b.bp.stag * 0.72);
    b.blockT = 0.12;
    swingPlayer(dir);
    views.hitStop = 0.05;
    G.combo++;
    bumpCombo();
    addScore(Math.round(40 * comboMult()), b.pos.x, b.pos.y - b.pos.h * 1.05, 'Blocked');
    views.events.emit('block', {
      boss: b.def.v,
      perfect: false,
      x: tw[0],
      y: tw[1],
      height: b.pos.h,
    });
    views.events.emit('bossOpening', { kind: 'chain', mirror: !!b.def.mirror });
  }
  function bossSwipe(dir: Direction, automatic = false) {
    const views = current();
    const {
      EQ,
      G,
      H,
      S,
      W,
      activeTrial,
      addScore,
      breakCombo,
      bumpCombo,
      checkUnlocks,
      comboMult,
      earn,
      playerDie,
      saveStats,
      swingPlayer,
    } = views;
    const b = G.boss;
    if (!b) return;
    if (b.state !== 'stagger') {
      if (activeTrial?.duelMaster && b.state !== 'enter' && b.state !== 'dying')
        playerDie(b, 'early');
      return;
    }
    const p = b.pos,
      cx = p.x,
      cy = p.y - p.h * 0.55;
    if (directionMatches(dir, b.sdir, !!G.m.axisCut) && b.chainLeft > 1) {
      blockHit(dir);
      return;
    }
    if (directionMatches(dir, b.sdir, !!G.m.axisCut)) {
      const swiftPoints = !automatic && G.m.swift ? swiftSlashPoints(b.t, b.window) : null;
      b.hp = Math.max(0, b.hp - (automatic ? 1 : G.m.bossDmg));
      if (activeTrial?.duelMaster) b.bp = duelMasterTimings(20 - b.hp);
      views.events.emit('bossHealth', { hp: b.hp, maximum: b.maxHp });
      if (!automatic) swingPlayer(dir);
      const a = DANG[dir];
      const cutEvent = { boss: b.def.v, direction: dir, automatic, x: cx, y: cy, height: p.h };
      views.hitStop = 0.08;
      G.combo++;
      bumpCombo();
      views.events.emit('bossOpening', { kind: 'cut', mirror: !!b.def.mirror });
      if (b.hp <= 0) {
        b.state = 'dying';
        b.t = 0;
        b.cutAng = a;
        b.shadowTime = 0;
        b.deathGround = { ...b.pos };
        addScore(
          Math.round((swiftPoints ?? 1500 * G.bossCount) * G.m.bossScore),
          cx,
          p.y - p.h * 1.1,
          '討取',
          Math.max(22, 28 * S),
        );
        views.hitStop = 0.25;
        G.petT = 1;
        G.bossesSlain++;
        earn('boss');
        views.runBossMilestone = Math.max(views.runBossMilestone, G.bossCount);
        if (G.bless.has('breath') && !G.zen && !G.hard && G.lives < G.maxLives) {
          G.lives++;
          views.events.emit('livesChanged', {
            cause: 'breath',
            lives: G.lives,
            x: W / 2,
            y: H * 0.5,
          });
        }
        G.state = 'between';
        G.afterBoss = true;
        G.nextT = 2.2;
        views.events.emit('bossCut', cutEvent);
        views.events.emit('bossDefeated', {
          boss: b.def.v,
          count: G.bossCount,
          clean: !b.failed,
          mirror: !!b.def.mirror,
          mode: G.mode,
          rush: G.rush,
          blade: G.blade,
          bossesSlain: G.bossesSlain,
          direction: dir,
          x: cx,
          y: cy,
          groundY: p.y,
          height: p.h,
          fog: p.fog,
          alpha: p.alpha,
          crow: EQ.pet === 'crow',
        });
        saveStats();
        checkUnlocks();
      } else {
        b.state = 'hurt';
        b.t = 0;
        addScore(
          Math.round((swiftPoints ?? 300) * comboMult() * G.m.bossScore),
          cx,
          p.y - p.h * 1.05,
        );
        views.events.emit('bossCut', cutEvent);
      }
    } else {
      if (G.m.kage && (b.kageUsed || 0) < G.m.kage) {
        b.kageUsed = (b.kageUsed || 0) + 1;
        swingPlayer(dir);
        views.events.emit('bossCue', { kind: 'afterimage', x: cx, y: p.y, height: p.h });
        return;
      }
      swingPlayer(dir);
      b.state = 'recover';
      b.t = 0;
      b.failed = true;
      breakCombo();
      views.events.emit('bossCue', { kind: 'deflected', x: cx, y: p.y, height: p.h });
    }
  }
  return Object.assign(
    definePhase<Context>({
      update(_context, dt, raw = dt) {
        updateBoss(dt, raw);
      },
      onSwipe(_context, dir) {
        bossSwipe(dir);
      },
      onTapDown() {
        const { G } = current();
        if (G.boss?.state !== 'flash') return false;
        parry();
        return true;
      },
      onTap() {
        const { G, swingPlayer, playerDie } = current();
        if (!G.boss) return;
        if (G.boss.state === 'flash') {
          parry();
          return;
        }
        if (['idle', 'windup', 'feint'].includes(G.boss.state)) {
          swingPlayer('block');
          playerDie(G.boss, 'early');
        }
      },
    }),
    {
      startBoss,
      updateBoss,
      bossSwipe,
      updateBackground(dt: number, raw = dt) {
        const { G } = current();
        if (G.boss && G.state !== 'boss') updateBoss(dt, raw);
      },
    },
  );
}
