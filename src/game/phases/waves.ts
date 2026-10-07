import { STAGES } from '../content/stages.ts';
import { startBlessingWave, nextBlessingAttacker } from '../shrine/triggered.ts';
import { recoverAfterWave } from '../progression/run-powers.ts';
import { initialSpawns, updateWave as simulateWave } from '../encounters/waves.ts';
import { kanji, roman } from '../../shared/format.ts';
import type { BladeStats } from '../progression/statistics.ts';
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

export interface WaveLifecycleViews extends Pick<
  WavesViews,
  | 'G'
  | 'ST'
  | 'W'
  | 'combatRandom'
  | 'pop'
  | 'waveConfiguration'
  | 'killEnemy'
  | 'earn'
  | 'addScore'
> {
  readonly H: number;
  readonly S: number;
  readonly renderLives: () => void;
  readonly setStage: (stage: number, transition: boolean) => void;
  readonly bst: () => BladeStats | null;
  readonly challenge: (metric: keyof BladeStats, value?: number) => void;
  readonly saveStats: () => void;
  readonly checkUnlocks: () => void;
  readonly startStandoff: (wave: number, changed: boolean) => void;
  readonly waveCfg: (wave: number) => NonNullable<RunState['cfg']>;
  readonly banner: (title: string, subtitle: string) => void;
  readonly setWaveLabel: (label: string) => void;
  readonly sfx: { drum(): void; step(): void };
  readonly hint: (key: string, message: string, duration?: number) => void;
  readonly captureCheckpoint: () => void;
  readonly deferUntilSceneReady: (begin: () => void) => boolean;
  readonly spawnEnemy: (slot: number) => void;
  readonly lightningFx: (position: Enemy['pos']) => void;
  readonly dust: (x: number, y: number, height: number) => void;
}

/** Wave preparation and simulation retain deferred scene entry and clear timing. */
export function createWaveLifecycle(readViews: () => WaveLifecycleViews) {
  function startWave(n: number, skipEvent = false) {
    const {
      G,
      ST,
      W,
      H,
      S,
      combatRandom,
      renderLives,
      pop,
      setStage,
      bst,
      challenge,
      saveStats,
      checkUnlocks,
      startStandoff,
      waveCfg,
      waveConfiguration,
      banner,
      setWaveLabel,
      sfx,
      hint,
      captureCheckpoint,
      deferUntilSceneReady,
      spawnEnemy,
      lightningFx,
      killEnemy,
      dust,
      earn,
      addScore,
    } = readViews();
    G.wave = n;
    startBlessingWave(G);
    G.event = null;
    G.wardUsed = false;
    renderLives();
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
      renderLives();
      pop(W / 2, H * 0.5, '延命 +1 life', Math.max(20, 24 * S));
    }
    if (n >= 9 && !G.zen && !G.lostLife && !ST.flawless) ST.flawless = 1;
    const si = Math.floor((n - 1) / 3) % STAGES.length,
      lap = Math.floor((n - 1) / (3 * STAGES.length)),
      changed = si !== G.stage || lap !== G.lap;
    G.lap = lap;
    if (si !== G.stage) setStage(si, true);
    const begin = () => {
      const {
        G,
        ST,
        W,
        H,
        S,
        combatRandom,
        renderLives,
        pop,
        setStage,
        bst,
        challenge,
        saveStats,
        checkUnlocks,
        startStandoff,
        waveCfg,
        waveConfiguration,
        banner,
        setWaveLabel,
        sfx,
        hint,
        captureCheckpoint,
        deferUntilSceneReady,
        spawnEnemy,
        lightningFx,
        killEnemy,
        dust,
        earn,
        addScore,
      } = readViews();
      const st = STAGES[si]!;
      if (!G.zen) {
        if (G.blade) ST.bladeWave = Math.max(ST.bladeWave || 0, n);
        if (!G.lostLife) ST.flawlessWave = Math.max(ST.flawlessWave || 0, n);
        {
          const q = bst();
          if (q) {
            q.w = Math.max(q.w, n);
            if (G.mode === 'ronin') q.rw = Math.max(q.rw, n);
          }
          challenge('w', n);
          if (G.mode === 'ronin') challenge('rw', n);
        }
        ST.bestWave = Math.max(ST.bestWave, n);
        if (G.mode === 'ronin') ST.roninWave = Math.max(ST.roninWave, n);
        ST.furthestStage = Math.max(ST.furthestStage, Math.floor((n - 1) / 3));
      }
      saveStats();
      checkUnlocks();
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
        if (st.hint) hint('stage' + si, st.hint, 5000);
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
      if (changed && n > 1) {
        banner(st.k, `${st.n}${lap ? ' ' + roman(lap + 1) : ''}, wave ${n}`);
        G.gapT = 1.9;
      } else if (ev === 'blood') {
        banner('赤月', 'Blood moon. Faster blades, double score.');
        G.gapT = 1.9;
      } else if (ev === 'fog') {
        banner('霧', 'Fog. Only the attacker shows himself.');
        G.gapT = 1.9;
      } else banner(`第${kanji(n)}陣`, `Wave ${n}`);
      setWaveLabel(ev === 'blood' ? '赤月' : ev === 'fog' ? '霧' : `第${kanji(n)}陣`);
      sfx.drum();
      if (n === 1) hint('swipe', 'Swipe the way his blade points.', 7000);
      if (n === 2 || G.mode === 'ronin')
        hint(
          'perfect',
          'Wait until his ring reaches the red arc, then cut, for a perfect cut.',
          5000,
        );
      if (waveConfiguration().refill)
        hint('refill', 'The pack no longer thins. Keep cutting.', 4000);
      if (waveConfiguration().feint)
        hint('feint', 'A trembling seal may feint. Watch the blade turn.', 5000);
      if (st.hint) hint('stage' + si, st.hint, 5000);
      if (ev === 'blood')
        hint('blood', 'Blood moon. They strike faster, but every cut scores double.', 4500);
      if (ev === 'fog')
        hint('fog', 'Fog. The rest of the pack is hidden. Cut whoever steps out.', 4500);
      captureCheckpoint();
    };
    if (!deferUntilSceneReady(begin)) begin();
  }
  function updateWave(dt: number) {
    const {
      G,
      ST,
      W,
      H,
      S,
      combatRandom,
      renderLives,
      pop,
      setStage,
      bst,
      challenge,
      saveStats,
      checkUnlocks,
      startStandoff,
      waveCfg,
      waveConfiguration,
      banner,
      setWaveLabel,
      sfx,
      hint,
      captureCheckpoint,
      deferUntilSceneReady,
      spawnEnemy,
      lightningFx,
      killEnemy,
      dust,
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
            lightningFx(p);
            killEnemy(c, c.dir, true, true);
            pop(p.x, p.y - p.h, '雷', Math.max(20, 26 * S));
            return;
          }
          if (blessing === 'hesitate') {
            c.T += 0.75;
            pop(c.pos.x, c.pos.y - c.pos.h, '間', Math.max(18, 22 * S));
          }
          sfx.step();
          dust(c.pos.x, c.pos.y, c.pos.h * 0.4);
        },
        cleared: (bonus) => {
          earn('wave');
          if (recoverAfterWave(G)) {
            renderLives();
            pop(W / 2, H * 0.4, 'Recovery +1 life');
          }
          addScore(bonus, W / 2, H * 0.42, '陣破', Math.max(20, 26 * S));
        },
      },
      combatRandom,
    );
  }
  return { startWave, updateWave };
}
