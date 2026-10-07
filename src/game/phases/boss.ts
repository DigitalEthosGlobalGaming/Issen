import { definePhase } from '../session/phase-router.ts';
import { createBoss } from '../encounters/boss-create.ts';
import { advanceBoss as simulateBoss } from '../encounters/boss-simulation.ts';
import { parryOpening } from '../encounters/boss-openings.ts';
import { refillDuelKnives } from '../combat/knife.ts';
import { swiftSlashPoints, duelMasterTimings } from '../progression/mastery.ts';
import { recordSecretEvent } from '../progression/secret-events.ts';
import { restorableRng } from '../../shared/random.ts';
import { kanji, roman } from '../../shared/format.ts';
import { DIRS, DANG, directionMatches, type Direction } from '../../shared/directions.ts';
import type { RunState } from '../run-state.ts';
import type { Enemy } from '../combat/enemy.ts';
import type { Boss } from '../encounters/boss.ts';
import type { Equipment } from '../../platform/saves.ts';
import type { Statistics, BladeStats } from '../progression/statistics.ts';
import type { TrialDefinition } from '../content/trials.ts';
import type { DailyRun } from '../progression/daily.ts';

export interface BossViews {
  readonly deferUntilSceneReady: (action: () => void) => boolean;
  readonly G: RunState;
  readonly renderLives: () => void;
  readonly bossPos: (b: Boss) => { x: number; y: number; h: number; fog: number; alpha: number };
  readonly banner: (glyph: string, label: string) => void;
  readonly renderHp: () => void;
  readonly sfx: {
    drum(): void;
    glint(): void;
    feint(): void;
    clang(): void;
    block(): void;
    slice(): void;
    bossDie(): void;
    caw(): void;
    deflect(): void;
  };
  readonly activeTrial: TrialDefinition | null;
  readonly activeDaily: DailyRun | null;
  readonly guided: { startBoss(): boolean; bossFlash(): void; bossParried(): void };
  readonly hint: (key: string, text: string, dur?: number) => void;
  readonly captureCheckpoint: (status?: 'active' | 'ended' | 'lost') => void;
  readonly combatRandom: () => number;
  readonly flash: (a: number, col?: string | undefined) => void;
  readonly playerDie: (killer: Boss | Enemy | null, reason: string) => void;
  readonly breakCombo: () => void;
  readonly setScore: () => void;
  readonly pop: (x: number, y: number, text: string, size?: number | undefined) => void;
  readonly bossTipWorld: (b: Boss) => [number, number];
  readonly S: number;
  readonly swingPlayer: (
    dir: 'block' | 'down' | 'left' | 'right' | 'up',
    perfect?: boolean,
  ) => void;
  readonly sparks: (x: number, y: number, n: number) => void;
  readonly ring: (x: number, y: number, r0: number, r1: number, life: number, w: number) => void;
  hitStop: number;
  readonly combatHaptics: { play(event: 'slice' | 'parry'): void };
  readonly letterbox: (d: number) => void;
  readonly ST: Statistics;
  readonly bumpCombo: () => void;
  readonly addScore: (
    pts: number,
    x: number,
    y: number,
    label?: string | undefined,
    size?: number | undefined,
  ) => number;
  readonly comboMult: () => number;
  readonly buzz: (pattern: number | number[]) => void;
  readonly notifications: { readonly activeHint: string | null };
  readonly hideHint: () => void;
  readonly addSlash: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    w: number,
    life?: number | undefined,
    dark?: boolean | undefined,
  ) => void;
  readonly killFx: (cx: number, cy: number, ang: number, sc: number) => void;
  readonly scraps: (x: number, y: number, n: number, sc: number) => void;
  readonly stamp: (
    text: string,
    x: number,
    y: number,
    size: number,
    seal: boolean,
    life?: number | undefined,
  ) => void;
  readonly W: number;
  readonly H: number;
  readonly punch: (z: number, x: number, y: number) => void;
  readonly EQ: Equipment;
  readonly earn: (event: 'boss' | 'kill' | 'wave') => void;
  runBossMilestone: number;
  readonly bst: () => BladeStats | null;
  readonly challenge: (metric: keyof BladeStats, value?: number) => void;
  readonly inkBurst: (x: number, y: number, ang: number, n: number, sc: number) => void;
  readonly saveStats: () => void;
  readonly checkUnlocks: () => void;
  readonly shake: (amount: number) => void;
  readonly setBossLabels: (wave: string, glyph: string, name: string) => void;
  readonly showBossBar: (shown: boolean) => void;
  readonly bossStain: (position: Boss['pos']) => void;
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
      banner,
      bossPos,
      captureCheckpoint,
      deferUntilSceneReady,
      guided,
      hint,
      renderHp,
      renderLives,
      sfx,
      setBossLabels,
      showBossBar,
    } = views;
    if (deferUntilSceneReady(startBoss)) return;
    refillDuelKnives(G);
    G.blessingTriggers.flourishWard = false;
    renderLives();
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
    const nm = def.n + (lap ? ' ' + roman(lap + 1) : '');
    banner(def.k, nm);
    setBossLabels(G.rush ? `決闘 ${kanji(G.wave)}` : '決闘', def.k, nm);
    renderHp();
    showBossBar(true);
    sfx.drum();
    if (!activeTrial && !activeDaily) guided.startBoss();
    if (def.twin) hint('twin', 'The Twin Fang strikes twice. Parry both glints.', 4500);
    if (def.spear) hint('spear', 'The spear gives less warning. Watch the tip.', 4500);
    if (def.mirror)
      hint('mirror', 'The Mirror never feints. Cut opposite to his arrow and blade.', 5000);
    captureCheckpoint();
  }
  function updateBoss(dt: number, raw = dt) {
    const views = current();
    const { G, bossPos, breakCombo, combatRandom, flash, guided, playerDie, pop, setScore, sfx } =
      views;
    simulateBoss(G, dt, {
      rawDelta: raw,
      random: combatRandom,
      sounds: sfx,
      flash,
      playerDie,
      position: bossPos,
      recovered: (b) => {
        breakCombo();
        setScore();
        pop(b.pos.x, b.pos.y - b.pos.h * 1.05, 'Recovered');
      },
    });
    if (G.boss?.state === 'flash') guided.bossFlash();
  }
  function parry() {
    const views = current();
    const {
      G,
      S,
      ST,
      activeTrial,
      addScore,
      bossTipWorld,
      bumpCombo,
      combatHaptics,
      combatRandom,
      comboMult,
      flash,
      guided,
      hint,
      letterbox,
      pop,
      renderHp,
      ring,
      sfx,
      sparks,
      swingPlayer,
      shake,
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
      renderHp();
      pop(b.pos.x, b.pos.y - b.pos.h * 1.25, '返し', Math.max(20, 26 * S));
    }
    swingPlayer('block');
    sparks(tw[0], tw[1], 24);
    ring(tw[0], tw[1], 4 * S, 90 * S, 0.35, Math.max(2, 2.5 * S));
    shake(11 * S);
    views.hitStop = 0.09;
    flash(0.3);
    sfx.clang();
    combatHaptics.play('parry');
    letterbox(0.3);
    G.combo++;
    G.parries++;
    ST.parries++;
    guided.bossParried();
    bumpCombo();
    addScore(Math.round(60 * comboMult()), b.pos.x, b.pos.y - b.pos.h * 1.05);
    if (!second)
      hint(
        'parry',
        b.def.mirror
          ? 'An opening. Swipe opposite to his arrow and blade.'
          : 'An opening. Swipe the way his blade points.',
        3000,
      );
  }
  function blockHit(dir: Direction) {
    const views = current();
    const {
      G,
      S,
      addScore,
      bossTipWorld,
      bumpCombo,
      buzz,
      combatRandom,
      comboMult,
      flash,
      hideHint,
      hint,
      notifications,
      ring,
      sfx,
      sparks,
      swingPlayer,
      shake,
    } = views;
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
    sparks(tw[0], tw[1], 16);
    ring(tw[0], tw[1], 3 * S, 70 * S, 0.28, Math.max(1.5, 2 * S));
    shake(7 * S);
    views.hitStop = 0.05;
    flash(0.12);
    sfx.block();
    buzz(12);
    G.combo++;
    bumpCombo();
    addScore(Math.round(40 * comboMult()), b.pos.x, b.pos.y - b.pos.h * 1.05, 'Blocked');
    if (notifications.activeHint === 'parry') hideHint();
    hint(
      'chain',
      b.def.mirror
        ? 'He blocked. Keep swiping opposite to his arrow and blade.'
        : 'He blocked. Keep swiping the way his blade points.',
      3500,
    );
  }
  function bossSwipe(dir: Direction, automatic = false) {
    const views = current();
    const {
      EQ,
      G,
      H,
      S,
      ST,
      W,
      activeTrial,
      addScore,
      addSlash,
      breakCombo,
      bst,
      bumpCombo,
      challenge,
      checkUnlocks,
      combatHaptics,
      comboMult,
      earn,
      flash,
      hideHint,
      inkBurst,
      killFx,
      letterbox,
      notifications,
      playerDie,
      pop,
      punch,
      renderHp,
      renderLives,
      ring,
      saveStats,
      scraps,
      setScore,
      sfx,
      stamp,
      swingPlayer,
      shake,
      showBossBar,
      bossStain,
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
      renderHp();
      if (!automatic) swingPlayer(dir);
      const a = DANG[dir],
        v: [number, number] = [Math.cos(a), Math.sin(a)],
        len = p.h * (automatic ? 0.55 : 0.9),
        sc = p.h / 170;
      addSlash(
        cx - (v[0] * len) / 2,
        cy - (v[1] * len) / 2,
        cx + (v[0] * len) / 2,
        cy + (v[1] * len) / 2,
        Math.max(4, p.h * 0.03),
        0.35,
      );
      killFx(cx, cy, a + Math.PI / 2, sc);
      scraps(cx, cy, 8, sc);
      ring(cx, cy, p.h * 0.1, p.h * 0.7, 0.35, Math.max(2, 2.5 * S));
      shake(12 * S);
      views.hitStop = 0.08;
      flash(0.15);
      sfx.slice();
      combatHaptics.play('slice');
      G.combo++;
      bumpCombo();
      if (notifications.activeHint === 'parry') hideHint();
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
        stamp('討取', W / 2, H * 0.3, Math.max(56, 80 * S), true, 1.6);
        letterbox(1.3);
        punch(1.08, cx, cy);
        views.hitStop = 0.25;
        flash(0.45);
        addSlash(
          cx - v[0] * Math.max(W, H) * 1.3,
          cy - v[1] * Math.max(W, H) * 1.3,
          cx + v[0] * Math.max(W, H) * 1.3,
          cy + v[1] * Math.max(W, H) * 1.3,
          Math.max(3, 3 * S),
          0.7,
        );
        sfx.bossDie();
        G.petT = 1;
        if (EQ.pet === 'crow') sfx.caw();
        G.bossesSlain++;
        earn('boss');
        views.runBossMilestone = Math.max(views.runBossMilestone, G.bossCount);
        ST.duels++;
        if (G.rush) {
          ST.rushBest = Math.max(ST.rushBest || 0, G.bossesSlain);
          if (G.blade) ST.rushBlade = (ST.rushBlade || 0) + 1;
        }
        {
          const q = bst();
          if (q) q.d++;
          challenge('d');
        }
        if (G.mode === 'ronin') ST.roninDuels++;
        if (b.def.mirror) recordSecretEvent(ST, { kind: 'mirrorVictory', clean: !b.failed });
        if (G.bless.has('breath') && !G.zen && !G.hard && G.lives < G.maxLives) {
          G.lives++;
          renderLives();
          pop(W / 2, H * 0.5, '息 +1 life', Math.max(20, 24 * S));
        }
        if (!b.failed) ST.cleanDuels++;
        if (G.blade) ST.bladeDuels++;
        G.state = 'between';
        G.afterBoss = true;
        G.nextT = 2.2;
        showBossBar(false);
        inkBurst(cx, cy, a + Math.PI / 2, 30, p.h / 150);
        bossStain(p);
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
      }
    } else {
      if (G.m.kage && (b.kageUsed || 0) < G.m.kage) {
        b.kageUsed = (b.kageUsed || 0) + 1;
        swingPlayer(dir);
        sfx.deflect();
        pop(cx, p.y - p.h * 1.05, 'Afterimage');
        return;
      }
      swingPlayer(dir);
      b.state = 'recover';
      b.t = 0;
      b.failed = true;
      breakCombo();
      setScore();
      sfx.deflect();
      pop(cx, p.y - p.h * 1.05, 'Deflected');
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
