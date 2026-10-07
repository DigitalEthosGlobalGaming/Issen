import type { RuleEvents } from '../events.ts';
import { STAGES } from '../content/stages.ts';
import { startBlessingWave, nextBlessingAttacker } from '../shrine/triggered.ts';
import { recoverAfterWave } from '../progression/run-powers.ts';
import { initialSpawns, updateWave as simulateWave } from '../encounters/waves.ts';
import { definePhase } from '../session/phase-router.ts';
import { targetSwipe } from '../combat/targeting.ts';
import { throwKnife } from '../combat/knife.ts';
import { OPP, type Direction } from '../../shared/directions.ts';
import type { Random } from '../../shared/random.ts';
import type { RunState } from '../run-state.ts';
import type { Enemy } from '../combat/enemy.ts';
import type { Boss } from '../encounters/boss.ts';
import type { TrialDefinition } from '../content/trials.ts';

export interface WavesViews {
  readonly events: RuleEvents;
  readonly G: RunState;
  readonly W: number;
  readonly L: { player: { x: number; y: number; h: number } };
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
}

/** Wave inputs and update dispatch share the owning lifecycle. */
export function createWavesPhase<Context>(
  readViews: (context: Context) => WavesViews,
  lifecycle: ReturnType<typeof createWaveLifecycle>,
) {
  return definePhase<Context>({
    update(_context, dt) {
      lifecycle.updateWave(dt);
    },
    onSwipe(context, dir) {
      const {
        G,
        W,
        activeTrial,
        waveConfiguration,
        killEnemy,
        orderSucceeded,
        events,
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
          events.emit('swipeCue', { kind: 'mirror' });
        }
      } else if (outcome.kind === 'miss') {
        swingPlayer(dir);
        events.emit('swipeCue', { kind: 'miss' });
        playerDie(outcome.killer, outcome.reason);
      }
    },
    onTap(context) {
      const {
        G,
        combatRandom,
        enemyPos,
        waveConfiguration,
        events,
        L,
        earn,
        addScore,
        comboMult,
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
      earn('kill');
      addScore(
        Math.round((wasAttacker ? 140 : 120) * comboMult() * G.m.normal),
        pos.x,
        pos.y - pos.h,
        'Knife',
      );
      events.emit('knifeHit', {
        x0: L.player.x, y0: L.player.y - L.player.h * 0.55,
        x: pos.x, y: pos.y, height: pos.h,
      });
      return;
    },
  });
}

export interface WaveLifecycleViews extends Pick<
  WavesViews,
  | 'events'
  | 'G'
  | 'W'
  | 'combatRandom'
  | 'waveConfiguration'
  | 'killEnemy'
  | 'earn'
  | 'addScore'
> {
  readonly H: number;
  readonly S: number;
  readonly setStage: (stage: number, transition: boolean) => void;
  readonly startStandoff: (wave: number, changed: boolean) => void;
  readonly waveCfg: (wave: number) => NonNullable<RunState['cfg']>;
  readonly captureCheckpoint: () => void;
  readonly deferUntilSceneReady: (begin: () => void) => boolean;
  readonly spawnEnemy: (slot: number) => void;
}

/** Wave preparation and simulation retain deferred scene entry and clear timing. */
export function createWaveLifecycle(readViews: () => WaveLifecycleViews) {
  function startWave(n: number, skipEvent = false) {
    const {
      G,
      W,
      H,
      S,
      combatRandom,
      setStage,
      startStandoff,
      waveCfg,
      waveConfiguration,
      captureCheckpoint,
      deferUntilSceneReady,
      spawnEnemy,
      killEnemy,
      earn,
      addScore,
    } = readViews();
    G.wave = n;
    startBlessingWave(G);
    G.event = null;
    G.wardUsed = false;
    readViews().events.emit('livesChanged', { cause: 'refresh', lives: G.lives });
    G.kikuUsed = 0;
    G.foxUsed = false;
    G.kagamiUsed = false;
    G.so = null;
    if (
      G.m.regen &&
      n > 1 &&
      (n - 1) % G.m.regen === 0 &&
      !G.zen &&
      !G.hard &&
      G.lives < G.maxLives
    ) {
      G.lives++;
      readViews().events.emit('livesChanged', { cause: 'regen', lives: G.lives, x: W / 2, y: H * 0.5 });
    }
    readViews().events.emit('wavePrepared', { wave: n, zen: G.zen, lostLife: G.lostLife });
    const si = Math.floor((n - 1) / 3) % STAGES.length,
      lap = Math.floor((n - 1) / (3 * STAGES.length)),
      changed = si !== G.stage || lap !== G.lap;
    G.lap = lap;
    if (si !== G.stage) setStage(si, true);
    const begin = () => {
      const {
        G,
        W,
        H,
        S,
        combatRandom,
        setStage,
        startStandoff,
        waveCfg,
        waveConfiguration,
        captureCheckpoint,
        deferUntilSceneReady,
        spawnEnemy,
        killEnemy,
        earn,
        addScore,
      } = readViews();
      const st = STAGES[si]!;
      readViews().events.emit('waveReached', {
        wave: n, mode: G.mode, zen: G.zen, blade: G.blade, lostLife: G.lostLife,
      });
      let ev: 'standoff' | 'blood' | 'fog' | null = null;
      if (
        !skipEvent &&
        n >= 4 &&
        n - G.lastEv >= 2 &&
        combatRandom() < 0.3 * (G.m.standoff > 1 ? 1.4 : 1)
      ) {
        const q = combatRandom();
        ev = q < (G.m.standoff > 1 ? 0.7 : 0.4) ? 'standoff' : q < 0.7 ? 'blood' : 'fog';
        G.lastEv = n;
      }
      if (ev === 'standoff') {
        if (st.hint) readViews().events.emit('stageHint', { stage: si });
        startStandoff(n, changed);
        return;
      }
      G.event = ev;
      G.cfg = waveCfg(n);
      if (ev === 'blood') waveConfiguration().atk *= 0.82;
      G.state = 'playing';
      G.enemies = G.enemies.filter((e) => e.state === 'dying');
      G.attacker = null;
      G.toSpawn = waveConfiguration().total;
      G.gapT = 1.2;
      G.pendingSpawns = [];
      G.pendingSpawns = initialSpawns(
        waveConfiguration().pack,
        !!((changed && n > 1) || ev),
        combatRandom,
      );
      if ((changed && n > 1) || ev) G.gapT = 1.9;
      readViews().events.emit('waveStarted', {
        wave: G.wave, stage: G.stage, lap, changed,
        event: ev, ronin: G.mode === 'ronin',
        refill: waveConfiguration().refill, feint: !!waveConfiguration().feint,
      });
      captureCheckpoint();
    };
    if (!deferUntilSceneReady(begin)) begin();
  }
  function updateWave(dt: number) {
    const {
      G,
      W,
      H,
      S,
      combatRandom,
      setStage,
      startStandoff,
      waveCfg,
      waveConfiguration,
      captureCheckpoint,
      deferUntilSceneReady,
      spawnEnemy,
      killEnemy,
      earn,
      addScore,
    } = readViews();
    simulateWave(
      G,
      dt,
      {
        spawn: (slot) => spawnEnemy(slot),
        attack: (c) => {
          const blessing = nextBlessingAttacker(G);
          if (blessing === 'lightning') {
            const p = c.pos;
            readViews().events.emit('waveAttack', { kind: 'lightning', x: p.x, y: p.y, height: p.h });
            killEnemy(c, c.dir, true, true);
            readViews().events.emit('waveAttack', { kind: 'lightningCut', x: p.x, y: p.y, height: p.h });
            return;
          }
          if (blessing === 'hesitate') {
            c.T += 0.75;
            readViews().events.emit('waveAttack', { kind: 'hesitate', x: c.pos.x, y: c.pos.y, height: c.pos.h });
          }
          readViews().events.emit('waveAttack', { kind: 'step', x: c.pos.x, y: c.pos.y, height: c.pos.h });
        },
        cleared: (bonus) => {
          earn('wave');
          if (recoverAfterWave(G)) {
            readViews().events.emit('livesChanged', { cause: 'recovery', lives: G.lives, x: W / 2, y: H * 0.4 });
          }
          addScore(bonus, W / 2, H * 0.42, '陣破', Math.max(20, 26 * S));
          readViews().events.emit('waveCleared', { wave: G.wave, stage: G.stage, score: G.score });
        },
      },
      combatRandom,
    );
  }
  return { startWave, updateWave };
}
