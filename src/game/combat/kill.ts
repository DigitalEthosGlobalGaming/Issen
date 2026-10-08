import { DANG, type Direction } from '../../shared/directions.ts';
import { clamp } from '../../shared/math.ts';
import { swiftSlashPoints } from '../progression/mastery.ts';
import { recordBlessingCut } from '../shrine/triggered.ts';
import { trialFailureAfterCut } from '../progression/trials.ts';
import type { RunState } from '../run-state.ts';
import type { Enemy } from './enemy.ts';
import type { TrialDefinition } from '../content/trials.ts';
import type { EventBus, GameEvents } from '../events.ts';

export interface EnemyKillViews {
  readonly G: RunState;
  readonly events: EventBus<GameEvents>;
  readonly pz: () => number;
  readonly enemyPos: (enemy: Enemy) => Enemy['pos'];
  readonly combatRandom: () => number;
  readonly waveConfiguration: () => NonNullable<RunState['cfg']>;
  readonly earn: (event: 'kill') => void;
  readonly addScore: (points: number, x: number, y: number, label?: string) => number;
  readonly comboMult: () => number;
  readonly swingPlayer: (direction: Direction, perfect: boolean) => void;
  readonly activeTrial: TrialDefinition | null;
  hitStop: number;
  trialFailure: string;
  readonly liveOrdered: () => Enemy[];
  readonly deathAppearance: (
    perfect: boolean,
    bonk: boolean,
    direction: Direction,
  ) => Pick<Enemy, 'deathType' | 'fallDir'>;
}

/** Run mutations and combat RNG complete before synchronous value-only reactions. */
export function createEnemyKill(readViews: () => EnemyKillViews) {
  function killEnemy(
    e: Enemy,
    dir: Direction,
    chained = false,
    preserveStreak = false,
    automatic = false,
  ) {
    const views = readViews(),
      {
        G,
        events,
        pz,
        enemyPos,
        combatRandom,
        waveConfiguration,
        earn,
        addScore,
        comboMult,
        swingPlayer,
        activeTrial,
        liveOrdered,
        deathAppearance,
      } = views;
    function bumpCombo() {
      G.maxCombo = Math.max(G.maxCombo, G.combo);
      events.emit('comboChanged', { combo: G.combo, maximum: G.maxCombo, zen: G.zen });
    }
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
    for (const other of G.enemies)
      if (other !== e && (other.state === 'idle' || other.state === 'attack'))
        other.flinch = 0.6 + 0.4 * combatRandom();
    if (wasAtk) {
      G.attacker = null;
      G.gapT = waveConfiguration().gap;
    }
    const comboGrew = perfect || !G.bless.has('oath');
    if (comboGrew) G.combo++;
    G.kills++;
    earn('kill');
    let coin = false,
      restored = false,
      knife = false,
      precisionWard = false,
      stormCharged = false,
      rekindled = 0;
    if (G.m.maneki) {
      G.manekiN = (G.manekiN || 0) + 1;
      if (G.manekiN % 7 === 0) {
        coin = true;
        addScore(Math.round(500 * comboMult()), 0, 0, '招き猫');
      }
    }
    bumpCombo();
    const P0 = e.pos;
    if (!automatic) swingPlayer(dir, perfect);
    if (G.m.restore && !G.zen && !G.hard) {
      G.clean = (G.clean || 0) + 1;
      if (G.clean >= G.m.restore) {
        G.clean = 0;
        if (G.lives < G.maxLives) {
          G.lives++;
          restored = true;
        }
      }
    }
    if (perfect) {
      G.perfects++;
      if (G.bless.has('echo')) {
        G.combo += 2;
        bumpCombo();
      }
      G.pStreak++;
      if (!chained) {
        const reward = recordBlessingCut(G, true);
        knife = reward.knife;
        precisionWard = reward.precisionWard;
        stormCharged = reward.stormCharged;
        rekindled = reward.rekindled;
        if (knife) G.knives++;
        if (rekindled) bumpCombo();
      }
      G.petT = 0.7;
      if (G.m.freeze) G.freezeT = 0.8 * G.m.freeze;
      addScore(
        Math.round(
          (swiftPoints ?? 400 + Math.min(500, (G.pStreak - 1) * 100)) *
            comboMult() *
            (swiftPoints === null ? G.m.perfect : 1),
        ),
        P0.x,
        P0.y - P0.h * 1.05,
      );
      views.hitStop = 0.15;
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
      views.hitStop = 0.055;
    }
    if (
      !chained &&
      perfect &&
      G.bless.has('finalflourish') &&
      G.toSpawn <= 0 &&
      !G.pendingSpawns.length &&
      !G.enemies.some((other) => ['idle', 'attack', 'enter'].includes(other.state))
    )
      G.blessingTriggers.flourishPending = true;
    if (activeTrial) views.trialFailure ||= trialFailureAfterCut(activeTrial, G) || '';
    const comboMilestone = comboGrew && G.combo > 0 && G.combo % 10 === 0;
    if (comboMilestone && G.m.comboBonus) addScore((G.m.comboBonus * G.combo) / 10, 0, 0, '歌舞伎');
    const furin = comboMilestone && !!G.m.furin;
    if (furin) G.slowT = Math.max(G.slowT, 2);
    if (waveConfiguration().refill && G.toSpawn > 0)
      G.pendingSpawns.push({ slot: e.slot, t: 0.45 });
    events.emit('kill', {
      order: e.order,
      direction: dir,
      perfect,
      automatic,
      score: G.score,
      combo: G.combo,
      x: P0.x,
      y: P0.y,
      height: P0.h,
      fog: P0.fog,
      alpha: P0.alpha,
      disarmed: e.deathType === 'disarm',
      bonk: !!G.m.bonk,
      feint: !!e.fake,
      trial: !!activeTrial,
      pStreak: G.pStreak,
      runPerfects: G.perfects,
      coin,
      restored,
      knife,
      precisionWard,
      stormCharged,
      rekindled,
      frozen: perfect && !!G.m.freeze,
      furin,
      comboMilestone,
    });
    if (!chained && G.m.serpent && combatRandom() < G.m.serpent) {
      const next = waveConfiguration().ordered
        ? liveOrdered()[0]
        : G.enemies.find(
            (other) => (other.state === 'idle' || other.state === 'attack') && other.dir === dir,
          );
      if (next && (next.state === 'idle' || next.state === 'attack') && next.dir === dir) {
        killEnemy(next, dir, true);
        events.emit('cutChain', { kind: 'serpent', x: 0, y: 0, height: 0 });
        return;
      }
    }
    if (!chained && G.bless.has('tempest')) {
      G.tempN = (G.tempN || 0) + 1;
      if (G.tempN % 5 === 0) {
        const candidates = G.enemies.filter(
          (other) => other.state === 'idle' || other.state === 'attack',
        );
        const next = waveConfiguration().ordered
          ? liveOrdered()[0]
          : candidates[(combatRandom() * candidates.length) | 0];
        if (next && (next.state === 'idle' || next.state === 'attack')) {
          killEnemy(next, next.dir, true);
          events.emit('cutChain', { kind: 'tempest', x: 0, y: 0, height: 0 });
        }
      }
    }
    if (perfect && !chained && G.bless.has('swallow')) {
      const next = waveConfiguration().ordered
        ? liveOrdered()[0]
        : G.enemies.find(
            (other) => (other.state === 'idle' || other.state === 'attack') && other.dir === dir,
          );
      if (next && (next.state === 'idle' || next.state === 'attack') && next.dir === dir) {
        killEnemy(next, dir, true);
        events.emit('cutChain', {
          kind: 'swallow',
          x: next.pos.x,
          y: next.pos.y,
          height: next.pos.h,
        });
      }
    }
  }
  return { killEnemy };
}
