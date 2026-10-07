import { DANG, type Direction } from '../../shared/directions.ts';
import { clamp } from '../../shared/math.ts';
import { kanji } from '../../shared/format.ts';
import { swiftSlashPoints } from '../progression/mastery.ts';
import { recordBlessingCut } from '../shrine/triggered.ts';
import { trialFailureAfterCut } from '../progression/trials.ts';
import type { RunState } from '../run-state.ts';
import type { Enemy } from './enemy.ts';
import type { Statistics, BladeStats } from '../progression/statistics.ts';
import type { TrialDefinition } from '../content/trials.ts';

export interface EnemyKillViews {
  readonly G: RunState;
  readonly pz: () => number;
  readonly enemyPos: (e: Enemy) => { x: number; y: number; h: number; fog: number; alpha: number };
  readonly combatRandom: () => number;
  readonly waveConfiguration: () => {
    pack: number;
    refill: boolean;
    total: number;
    ordered: boolean;
    feint: number;
    atk: number;
    gap: number;
  };
  readonly ST: Statistics;
  readonly earn: (event: 'boss' | 'kill' | 'wave') => void;
  readonly sfx: {
    coin(): void;
    bonk(): void;
    slice(): void;
    perfect(): void;
    chime(): void;
    drum(): void;
  };
  readonly addScore: (
    pts: number,
    x: number,
    y: number,
    label?: string | undefined,
    size?: number | undefined,
  ) => number;
  readonly comboMult: () => number;
  readonly bst: () => BladeStats | null;
  readonly challenge: (metric: keyof BladeStats, value?: number) => void;
  readonly bumpCombo: () => void;
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
  readonly ring: (x: number, y: number, r0: number, r1: number, life: number, w: number) => void;
  readonly S: number;
  readonly swingPlayer: (
    dir: 'block' | 'down' | 'left' | 'right' | 'up',
    perfect?: boolean,
  ) => void;
  readonly combatHaptics: { play(event: 'slice'): void };
  readonly renderLives: () => void;
  readonly pop: (x: number, y: number, text: string, size?: number | undefined) => void;
  readonly activeTrial: TrialDefinition | null;
  readonly hud: (on: boolean) => void;
  readonly setScore: () => void;
  readonly W: number;
  readonly H: number;
  readonly stamp: (
    text: string,
    x: number,
    y: number,
    size: number,
    seal: boolean,
    life?: number | undefined,
  ) => void;
  readonly letterbox: (d: number) => void;
  readonly punch: (z: number, x: number, y: number) => void;
  hitStop: number;
  readonly flash: (a: number, col?: string | undefined) => void;
  trialFailure: string;
  readonly gustLeaves: (n: number) => void;
  readonly notifications: { readonly activeHint: string | null };
  readonly hideHint: () => void;
  readonly liveOrdered: () => Enemy[];
  readonly checkUnlocks: () => void;
  readonly deathAppearance: (
    perfect: boolean,
    bonk: boolean,
    direction: Direction,
  ) => Pick<Enemy, 'deathType' | 'fallDir'>;
  readonly disarm: (position: Enemy['pos']) => void;
  readonly coin: (position: Enemy['pos']) => void;
  readonly stain: (position: Enemy['pos']) => void;
  readonly shake: (amount: number) => void;
}

/** Existing kill rules move before separating synchronous event listeners. */
export function createEnemyKill(readViews: () => EnemyKillViews) {
  function killEnemy(
    e: Enemy,
    dir: Direction,
    chained = false,
    preserveStreak = false,
    automatic = false,
  ) {
    const views = readViews();
    const {
      G,
      pz,
      enemyPos,
      combatRandom,
      waveConfiguration,
      ST,
      earn,
      sfx,
      addScore,
      comboMult,
      bst,
      challenge,
      bumpCombo,
      addSlash,
      killFx,
      scraps,
      ring,
      S,
      swingPlayer,
      combatHaptics,
      renderLives,
      pop,
      activeTrial,
      hud,
      setScore,
      W,
      H,
      stamp,
      letterbox,
      punch,
      flash,
      gustLeaves,
      notifications,
      hideHint,
      liveOrdered,
      checkUnlocks,
      deathAppearance,
      disarm,
      coin,
      stain,
      shake,
    } = views;
    const wasAtk = e === G.attacker,
      p = e.state === 'attack' ? clamp(e.p) : 0,
      swiftPoints = G.m.swift && !chained ? swiftSlashPoints(Math.max(0, e.life - 0.9), e.T) : null,
      perfect =
        !automatic &&
        !G.m.noPerfect &&
        ((wasAtk && p >= pz()) || (!chained && G.bless.has('flurry') && (G.combo + 1) % 10 === 0));
    e.k = e.state === 'attack' ? Math.pow(p, 1.6) : 0;
    e.state = 'dying';
    e.t = 0;
    e.cutAng = DANG[dir];
    e.pos = enemyPos(e);
    e.shadowTime = 0;
    e.deathGround = { ...e.pos };
    Object.assign(e, deathAppearance(perfect, !!G.m.bonk, dir));
    if (e.deathType === 'disarm') disarm(e.pos);
    for (const o of G.enemies)
      if (o !== e && (o.state === 'idle' || o.state === 'attack'))
        o.flinch = 0.6 + 0.4 * combatRandom();
    if (wasAtk) {
      G.attacker = null;
      G.gapT = waveConfiguration().gap;
    }
    const comboGrew = perfect || !G.bless.has('oath');
    if (comboGrew) G.combo++;
    G.kills++;
    ST.kills++;
    earn('kill');
    if (e.fake) ST.feintKills = (ST.feintKills || 0) + 1;
    if (G.m.maneki) {
      G.manekiN = (G.manekiN || 0) + 1;
      if (G.manekiN % 7 === 0) {
        coin(e.pos);
        sfx.coin();
        addScore(Math.round(500 * comboMult()), 0, 0, '招き猫');
      }
    }
    {
      const q = bst();
      if (q) q.k++;
      challenge('k');
    }
    bumpCombo();
    const P0 = e.pos,
      cx = P0.x,
      cy = P0.y - P0.h * 0.55,
      v: [number, number] = [Math.cos(e.cutAng), Math.sin(e.cutAng)],
      len = P0.h * (automatic ? 0.55 : 0.95),
      sc = P0.h / 160;
    addSlash(
      cx - (v[0] * len) / 2,
      cy - (v[1] * len) / 2,
      cx + (v[0] * len) / 2,
      cy + (v[1] * len) / 2,
      Math.max(3, P0.h * 0.03),
      0.3,
    );
    killFx(cx, cy, e.cutAng + Math.PI / 2, sc);
    scraps(cx, cy, 6, sc);
    ring(cx, cy, P0.h * 0.08, P0.h * 0.55, 0.32, Math.max(1.5, 2 * S));
    stain(P0);
    if (!automatic) swingPlayer(dir, perfect);
    if (G.m.bonk) sfx.bonk();
    else sfx.slice();
    combatHaptics.play('slice');
    if (G.m.restore && !G.zen && !G.hard) {
      G.clean = (G.clean || 0) + 1;
      if (G.clean >= G.m.restore) {
        G.clean = 0;
        if (G.lives < G.maxLives) {
          G.lives++;
          renderLives();
          pop(0, 0, '正宗 +1 life');
        }
      }
    }
    if (perfect) {
      G.perfects++;
      ST.perfects++;
      if (!activeTrial) ST.bestRunPerfects = Math.max(ST.bestRunPerfects, G.perfects);
      if (G.bless.has('echo')) {
        G.combo += 2;
        bumpCombo();
      }
      {
        const q = bst();
        if (q) q.p++;
        challenge('p');
      }
      G.pStreak++;
      if (!chained) {
        const reward = recordBlessingCut(G, true);
        if (reward.knife) {
          G.knives++;
          hud(true);
          pop(P0.x, P0.y - P0.h * 1.4, 'Knife +1');
        }
        if (reward.precisionWard) {
          renderLives();
          pop(P0.x, P0.y - P0.h * 1.4, 'Ward ready');
        }
        if (reward.stormCharged) pop(P0.x, P0.y - P0.h * 1.5, 'Lightning charged');
        if (reward.rekindled) {
          bumpCombo();
          setScore();
          pop(P0.x, P0.y - P0.h * 1.5, `Rekindle +${reward.rekindled}`);
        }
      }
      ST.bestPStreak = Math.max(ST.bestPStreak, G.pStreak);
      G.petT = 0.7;
      if (G.m.freeze) {
        G.freezeT = 0.8 * G.m.freeze;
        pop(W / 2, H * 0.4, '凍', Math.max(22, 28 * S));
      }
      const pts = addScore(
        Math.round(
          (swiftPoints ?? 400 + Math.min(500, (G.pStreak - 1) * 100)) *
            comboMult() *
            (swiftPoints === null ? G.m.perfect : 1),
        ),
        P0.x,
        P0.y - P0.h * 1.05,
      );
      stamp('一閃', W / 2, H * 0.3, Math.max(52, 74 * S), true, 1.1);
      addSlash(
        cx - v[0] * Math.max(W, H) * 1.3,
        cy - v[1] * Math.max(W, H) * 1.3,
        cx + v[0] * Math.max(W, H) * 1.3,
        cy + v[1] * Math.max(W, H) * 1.3,
        Math.max(2, 2.5 * S),
        0.5,
      );
      ring(cx, cy, P0.h * 0.1, P0.h * 1.3, 0.5, Math.max(2, 3 * S));
      letterbox(0.5);
      punch(1.07, cx, cy);
      shake(10 * S);
      views.hitStop = 0.15;
      flash(0.32);
      sfx.perfect();

      if (pts) void 0;
    } else {
      if (!preserveStreak) {
        if (wasAtk) G.pStreak = 0;
        if (!chained) recordBlessingCut(G, false);
      }
      addScore(
        Math.round(
          (swiftPoints ?? 100 + (wasAtk ? 40 : 20)) *
            comboMult() *
            (swiftPoints === null ? G.m.normal : 1),
        ),
        P0.x,
        P0.y - P0.h * 1.05,
      );
      shake(7 * S);
      views.hitStop = 0.055;
      flash(0.08);
    }
    if (
      !chained &&
      perfect &&
      G.bless.has('finalflourish') &&
      G.toSpawn <= 0 &&
      !G.pendingSpawns.length &&
      !G.enemies.some(
        (other) => other.state === 'idle' || other.state === 'attack' || other.state === 'enter',
      )
    )
      G.blessingTriggers.flourishPending = true;
    if (activeTrial) views.trialFailure ||= trialFailureAfterCut(activeTrial, G) || '';
    if (comboGrew && G.combo > 0 && G.combo % 10 === 0 && G.m.comboBonus)
      addScore((G.m.comboBonus * G.combo) / 10, 0, 0, '歌舞伎');
    if (comboGrew && G.combo > 0 && G.combo % 10 === 0 && G.m.furin) {
      G.slowT = Math.max(G.slowT, 2);
      pop(0, 0, '風鈴');
      sfx.chime();
    }
    if (comboGrew && G.combo > 0 && G.combo % 10 === 0) {
      stamp(kanji(G.combo) + '連', W / 2, H * 0.2, Math.max(40, 54 * S), false, 1.2);
      gustLeaves(26);
      sfx.drum();
    }
    if (notifications.activeHint === 'swipe') hideHint();
    if (waveConfiguration().refill && G.toSpawn > 0)
      G.pendingSpawns.push({ slot: e.slot, t: 0.45 });
    if (!chained && G.m.serpent && combatRandom() < G.m.serpent) {
      const nx = waveConfiguration().ordered
        ? liveOrdered()[0]
        : G.enemies.find((q) => (q.state === 'idle' || q.state === 'attack') && q.dir === dir);
      if (nx && (nx.state === 'idle' || nx.state === 'attack') && nx.dir === dir) {
        killEnemy(nx, dir, true);
        pop(0, 0, '大蛇', Math.max(20, 26 * S));
        return;
      }
    }
    if (!chained && G.bless.has('tempest')) {
      G.tempN = (G.tempN || 0) + 1;
      if (G.tempN % 5 === 0) {
        const c = G.enemies.filter((q) => q.state === 'idle' || q.state === 'attack');
        const nx = waveConfiguration().ordered
          ? liveOrdered()[0]
          : c[(combatRandom() * c.length) | 0];
        if (nx && (nx.state === 'idle' || nx.state === 'attack')) {
          killEnemy(nx, nx.dir, true);
          pop(0, 0, '颯');
        }
      }
    }
    if (perfect && !chained && G.bless.has('swallow')) {
      const nx = waveConfiguration().ordered
        ? liveOrdered()[0]
        : G.enemies.find((q) => (q.state === 'idle' || q.state === 'attack') && q.dir === dir);
      if (nx && (nx.state === 'idle' || nx.state === 'attack') && nx.dir === dir) {
        killEnemy(nx, dir, true);
        pop(nx.pos.x, nx.pos.y - nx.pos.h * 1.3, '燕', Math.max(20, 26 * S));
      }
    }
    checkUnlocks();
  }
  return { killEnemy };
}
