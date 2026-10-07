import type { RuleEvents } from '../events.ts';
import { createCompanionRevival } from '../player/companions.ts';
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
  readonly events: RuleEvents;
  readonly G: RunState;
  timeScale: number;
  hitStop: number;
  readonly breakCombo: () => void;
  readonly startBoss: () => void;
  readonly startWave: (n: number, skipEvent?: boolean) => void;
  readonly captureCheckpoint: (status?: 'active' | 'ended' | 'lost') => void;
  readonly L: { player: { x: number; y: number; h: number } };
  readonly waveConfiguration: () => { pack: number; refill: boolean; total: number;
    ordered: boolean; feint: number; atk: number; gap: number };
  readonly activeTrial: TrialDefinition | null;
  trialFailure: string;
  readonly bossSwipe: (dir: 'down' | 'left' | 'right' | 'up', automatic?: boolean) => void;
  readonly killEnemy: (e: Enemy, dir: 'down' | 'left' | 'right' | 'up',
    chained?: boolean, preserveStreak?: boolean, automatic?: boolean) => void;
  readonly ST: Statistics;
  readonly saveStats: () => void;
  readonly checkUnlocks: () => void;
  readonly reasonMessage: (reason: string) => string;
  readonly rewardFlowBusy: boolean;
  readonly fallPlayer: (fall: number) => void;
  readonly showOver: () => void;
}

/** Damage, death timing and revival retain checkpoint-compatible plain records. */
export function createDeathPhase<Context>(readViews: () => DeathViews) {
  const reviveDaruma = createCompanionRevival(readViews);
  function struck(
    killer: Enemy | Boss | null,
    keep: boolean,
    label?: string | null,
    reason = 'struck',
    lifeLost = false,
  ) {
    const views = readViews();
    const { G, L, breakCombo, waveConfiguration } = views;
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
    views.hitStop = 0.08;
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
    const p = L.player;
    views.events.emit('struck', {
      reason, lives: G.lives, fatal: false, lifeLost,
      x: p.x, y: p.y, height: p.h,
      label: label || (lost >= 3 && G.combo < lost ? `${lost} 連 broken` : 'Struck'),
    });
  }
  function playerDie(killer: Enemy | Boss | null, reason: string) {
    const views = readViews();
    const { G, L, ST, activeTrial, bossSwipe, captureCheckpoint,
      checkUnlocks, killEnemy, saveStats, reasonMessage } = views;
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
      views.events.emit('companionSaved', {
        kind: 'tanto', x: killer.pos.x, y: killer.pos.y - killer.pos.h * 1.15,
      });
      captureCheckpoint();
      return;
    }
    if (reason === 'feint') {
      recordSecretEvent(ST, { kind: 'feintMistake' });
      saveStats();
      checkUnlocks();
    }
    const outcome = resolveDamage(G, reason);
    if (outcome.kind === 'hurt') {
      struck(killer, outcome.keepCombo, outcome.label, reason, outcome.lifeLost);
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
    views.events.emit('struck', {
      reason, lives: G.lives, fatal: true, lifeLost: true,
      x: p.x, y: p.y, height: p.h, label: '',
    });
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
