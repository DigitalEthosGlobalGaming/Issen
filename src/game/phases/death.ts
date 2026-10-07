import { definePhase } from '../session/phase-router.ts';
import { resolveDamage } from '../combat/damage.ts';
import { interceptWithTanto } from '../combat/tanto.ts';
import { recordSecretEvent } from '../progression/secret-events.ts';
import { recordBlessingCut } from '../shrine/triggered.ts';
import { clamp, lerp } from '../../shared/math.ts';
import type { RunState } from '../run-state.ts';
import type { Enemy } from '../combat/enemy.ts';
import type { Boss } from '../encounters/boss.ts';
import type { Statistics } from '../progression/statistics.ts';
import type { TrialDefinition } from '../content/trials.ts';

export interface DeathViews {
  readonly G: RunState;
  timeScale: number;
  readonly breakCombo: () => void;
  readonly renderLives: () => void;
  readonly setScore: () => void;
  readonly hud: (on: boolean) => void;
  readonly startBoss: () => void;
  readonly startWave: (n: number, skipEvent?: boolean) => void;
  readonly captureCheckpoint: (status?: 'active' | 'ended' | 'lost') => void;
  readonly banner: (glyph: string, label: string) => void;
  readonly stamp: (
    text: string,
    x: number,
    y: number,
    size: number,
    seal: boolean,
    life?: number | undefined,
  ) => void;
  readonly S: number;
  readonly flash: (a: number, col?: string | undefined) => void;
  readonly L: { player: { x: number; y: number; h: number } };
  readonly addSlash: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    w: number,
    life?: number | undefined,
    dark?: boolean | undefined,
  ) => void;
  readonly inkBurst: (x: number, y: number, ang: number, n: number, sc: number) => void;
  hitStop: number;
  readonly sfx: { hurt(): void; death(): void };
  readonly combatHaptics: { play(event: 'damage'): void };
  readonly pop: (x: number, y: number, text: string, size?: number | undefined) => void;
  readonly W: number;
  readonly H: number;
  readonly waveConfiguration: () => {
    pack: number;
    refill: boolean;
    total: number;
    ordered: boolean;
    feint: number;
    atk: number;
    gap: number;
  };
  readonly activeTrial: TrialDefinition | null;
  trialFailure: string;
  readonly bossSwipe: (dir: 'down' | 'left' | 'right' | 'up', automatic?: boolean) => void;
  readonly killEnemy: (
    e: Enemy,
    dir: 'down' | 'left' | 'right' | 'up',
    chained?: boolean,
    preserveStreak?: boolean,
    automatic?: boolean,
  ) => void;
  readonly ST: Statistics;
  readonly saveStats: () => void;
  readonly checkUnlocks: () => void;
  readonly scraps: (x: number, y: number, n: number, sc: number) => void;
  readonly letterbox: (d: number) => void;
  readonly clearHints: () => void;
  readonly clearLetterbox: () => void;
  readonly resetPlayer: () => void;
  readonly inkPulse: (value: number) => void;
  readonly shake: (amount: number) => void;
  readonly hideBossBar: () => void;
  readonly reasonMessage: (reason: string) => string;
  readonly rewardFlowBusy: boolean;
  readonly fallPlayer: (fall: number) => void;
  readonly showOver: () => void;
}

/** Damage, death timing and revival retain checkpoint-compatible plain records. */
export function createDeathPhase<Context>(readViews: () => DeathViews) {
  function reviveDaruma(ph = false, support = false) {
    const views = readViews();
    const {
      G,
      S,
      banner,
      breakCombo,
      captureCheckpoint,
      flash,
      hud,
      renderLives,
      setScore,
      stamp,
      startBoss,
      startWave,
      clearLetterbox,
      resetPlayer,
      inkPulse,
    } = views;
    if (!support) {
      if (ph) G.phoenixUsed = true;
      else G.darumaUsed = true;
    }
    views.timeScale = 1;
    clearLetterbox();
    resetPlayer();
    breakCombo();
    G.pStreak = 0;
    if (!G.zen && !G.hard)
      G.lives = support ? Math.max(1, Math.ceil(G.maxLives / 2)) : ph ? G.maxLives : 1;
    renderLives();
    setScore();
    hud(true);
    inkPulse(0);
    const inBoss = G.diedInBoss;
    G.enemies = [];
    G.attacker = null;
    G.pendingSpawns = [];
    G.so = null;
    if (inBoss) {
      G.boss = null;
      G.bossCount--;
      startBoss();
    } else startWave(G.wave, true);
    if (support) {
      G.lives = Math.max(1, Math.ceil(G.maxLives / 2));
      renderLives();
      captureCheckpoint();
      banner('起', 'Second Wind');
    } else if (ph) banner('鳳凰', 'Rise from the ashes');
    else banner('達磨', 'Seven times down, eight times up');
    stamp(ph ? '鳳' : '起', 0, 0, Math.max(60, 86 * S), true, 1.6);
    flash(0.5, '255,240,220');
  }
  function struck(killer: Enemy | Boss | null, keep: boolean, label?: string | null) {
    const views = readViews();
    const {
      G,
      H,
      L,
      S,
      W,
      addSlash,
      breakCombo,
      combatHaptics,
      flash,
      inkBurst,
      pop,
      setScore,
      sfx,
      waveConfiguration,
      shake,
    } = views;
    G.clean = 0;
    if (!keep && G.bless.has('zanshin')) {
      const sk = Math.floor((G.wave - 1) / 3);
      if (G.zanKey !== sk) {
        G.zanKey = sk;
        keep = true;
        label = label || '残心';
      }
    }
    if (!keep && G.m.kiku && (G.kikuUsed || 0) < G.m.kiku) {
      G.kikuUsed = (G.kikuUsed || 0) + 1;
      keep = true;
      label = label || '菊';
    }
    const lost = G.combo;
    recordBlessingCut(G, false);
    if (!keep) {
      breakCombo();
      G.pStreak = 0;
    }
    G.hits++;
    setScore();
    const p = L.player;
    addSlash(
      p.x + p.h * 0.4,
      p.y - p.h * 0.98,
      p.x - p.h * 0.28,
      p.y - p.h * 0.35,
      Math.max(4, p.h * 0.018),
      0.45,
    );
    inkBurst(p.x + p.h * 0.05, p.y - p.h * 0.7, -2.2, 16, p.h / 420);
    flash(0.35, '150,22,16');
    shake(12 * S);
    views.hitStop = 0.08;
    sfx.hurt();
    combatHaptics.play('damage');
    pop(
      W / 2,
      H * 0.45,
      label || (lost >= 3 && G.combo < lost ? `${lost} 連 broken` : 'Struck'),
      Math.max(20, 24 * S),
    );
    if (killer && 'def' in killer) {
      killer.state = 'strike';
      killer.t = 0;
      killer.zenBack = true;
    } else if (killer) {
      killer.k = killer.state === 'attack' ? Math.pow(clamp(killer.p), 1.6) : killer.k || 0;
      killer.state = 'strike';
      killer.t = 0;
      killer.zen = true;
      if (G.attacker === killer) {
        G.attacker = null;
        G.gapT = waveConfiguration().gap + 0.5;
      }
      if (waveConfiguration().refill && G.toSpawn > 0)
        G.pendingSpawns.push({ slot: killer.slot, t: 1.0 });
    }
  }
  function playerDie(killer: Enemy | Boss | null, reason: string) {
    const views = readViews();
    const {
      G,
      L,
      S,
      ST,
      activeTrial,
      addSlash,
      bossSwipe,
      captureCheckpoint,
      checkUnlocks,
      clearHints,
      combatHaptics,
      flash,
      hud,
      inkBurst,
      killEnemy,
      letterbox,
      pop,
      renderLives,
      saveStats,
      scraps,
      sfx,
      inkPulse,
      shake,
      hideBossBar,
      reasonMessage,
    } = views;
    if (activeTrial) {
      views.trialFailure = reasonMessage(reason) || 'A mistake ended the trial.';
      return;
    }
    if (G.state === 'dead' || G.state === 'over') return;
    if (interceptWithTanto(G, killer) && killer) {
      if ('def' in killer) {
        killer.failed = true;
        killer.state = 'stagger';
        killer.chainLeft = 1;
        bossSwipe(killer.sdir, true);
      } else {
        if (G.so?.e === killer) {
          G.so.done = true;
          G.so.doneT = 0;
          killer.glint = 0;
        }
        killEnemy(killer, killer.dir, true, false, true);
      }
      pop(killer.pos.x, killer.pos.y - killer.pos.h * 1.15, 'Tanto');
      hud(true);
      captureCheckpoint();
      return;
    }
    if (reason === 'feint') {
      recordSecretEvent(ST, { kind: 'feintMistake' });
      saveStats();
      checkUnlocks();
    }
    const outcome = resolveDamage(G, reason);
    renderLives();
    if (outcome.kind === 'hurt') {
      if (outcome.lifeLost) inkPulse(1);
      struck(killer, outcome.keepCombo, outcome.label);
      return;
    }
    G.diedInBoss = !!(G.boss && G.boss.state !== 'dying');
    G.state = 'dead';
    G.deathT = 0;
    G.reviveOfferResolved = false;
    G.reason = reason;
    captureCheckpoint('lost');
    views.timeScale = 0.3;
    if (killer && !('def' in killer)) {
      killer.k = killer.state === 'attack' ? Math.pow(clamp(killer.p), 1.6) : killer.k || 0;
      killer.state = 'strike';
      killer.t = 0;
    } else if (killer) {
      killer.state = 'strike';
      killer.t = 0;
    }
    const p = L.player;
    addSlash(
      p.x + p.h * 0.4,
      p.y - p.h * 0.98,
      p.x - p.h * 0.28,
      p.y - p.h * 0.35,
      Math.max(5, p.h * 0.022),
      0.7,
    );
    inkBurst(p.x + p.h * 0.05, p.y - p.h * 0.7, -2.2, 40, p.h / 420);
    scraps(p.x + p.h * 0.05, p.y - p.h * 0.7, 10, p.h / 300);
    flash(0.45, '150,22,16');
    shake(18 * S);
    letterbox(2.5);
    sfx.death();
    combatHaptics.play('damage');
    clearHints();
    hideBossBar();
  }
  function updateDeath(raw: number) {
    const views = readViews();
    const { G, rewardFlowBusy, fallPlayer, showOver } = views;
    if (G.state !== 'dead' || rewardFlowBusy) return;
    G.deathT += raw;
    fallPlayer(clamp((G.deathT - 0.3) / 0.9));
    views.timeScale = lerp(0.3, 0.6, clamp(G.deathT / 1.5));
    if (G.deathT > 1.8) {
      if (G.bless.has('phoenix') && !G.phoenixUsed) reviveDaruma(true);
      else if (G.m.daruma && !G.darumaUsed) reviveDaruma();
      else showOver();
    }
  }
  return Object.assign(
    definePhase<Context>({
      update(_context, dt, raw = dt) {
        updateDeath(raw);
      },
    }),
    { playerDie, struck, reviveDaruma, updateDeath },
  );
}
