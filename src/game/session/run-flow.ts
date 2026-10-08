import type { RuleEvents } from '../events.ts';
import { recordSecretEvent } from '../progression/secret-events.ts';
import { BLESS_BY } from '../content/blessings.ts';
import type { RunState } from '../run-state.ts';
import type { Statistics } from '../progression/statistics.ts';
import type { DailyRun } from '../progression/daily.ts';
import type { Equipment } from '../../platform/saves.ts';
import type { RunCheckpoint } from '../../platform/run-checkpoint.ts';

export interface RunFlowViews<Pose extends object> {
  readonly events: RuleEvents;
  readonly G: RunState;
  readonly playerStats: Statistics;
  readonly playerEquipment: Equipment;
  ST: Statistics;
  EQ: Equipment;
  activeDaily: DailyRun | null;
  timeScale: number;
  readonly shrineOfferIds: readonly string[] | null;
  readonly contextLost: boolean;
  /** Player animation reset is part of the run transition. */
  readonly P: { fall: number; pose: Pose };
  readonly PREST: Pose;
  readonly audio: { setPaused: (paused: boolean) => void };
  readonly guided: { readonly frozen: boolean };
  readonly setStage: (stage: number, force: boolean) => void;
  readonly setupAttract: () => void;
  readonly saveStats: () => void;
  readonly checkUnlocks: () => void;
  readonly resetClock: () => void;
  readonly captureCheckpoint: (status?: RunCheckpoint['status']) => void;
  readonly showOver: () => void;
}

/** Run lifetime controls retain plain records and emit immutable display cues. */
export function createRunFlow<Pose extends object>(views: RunFlowViews<Pose>) {
  const {
    G,
    playerStats,
    playerEquipment,
    setStage,
    setupAttract,
    P,
    PREST,
    saveStats,
    checkUnlocks,
    audio,
    guided,
    captureCheckpoint,
    showOver,
    resetClock,
  } = views;
  function toTitle() {
    views.activeDaily = null;
    views.ST = playerStats;
    views.EQ = playerEquipment;
    views.events.emit('runFlowCue', { kind: 'seal' });
    G.panel = null;
    G.state = 'title';
    G.mode = 'normal';
    G.blade = false;
    G.zen = false;
    views.events.emit('runFlowCue', { kind: 'title' });
    views.timeScale = 1;
    views.events.emit('runFlowCue', { kind: 'letterboxReset' });
    if (G.stage !== 0) setStage(0, true);
    setupAttract();
    P.fall = 0;
    P.pose = { ...PREST };
    views.events.emit('runFlowCue', { kind: 'best' });
  }
  function pause() {
    if (['playing', 'boss', 'between', 'standoff'].includes(G.state)) {
      G.pauseN = (G.pauseN || 0) + 1;
      if (recordSecretEvent(views.ST, { kind: 'pauses', count: G.pauseN })) {
        saveStats();
        checkUnlocks();
      }
      G.pausedFrom = G.state;
      G.state = 'paused';
      views.events.emit('runFlowCue', { kind: 'pause' });
    }
  }
  function resume() {
    if (views.contextLost) return;
    if (G.state !== 'paused' || !G.pausedFrom) return;
    G.state = G.pausedFrom;
    audio.setPaused(guided.frozen);
    if (G.state === 'shrine' && views.shrineOfferIds)
      views.events.emit('shrineOffers', {
        ids: Object.freeze(views.shrineOfferIds.filter((id) => !!BLESS_BY[id])),
      });
    else views.events.emit('sessionScreen', { screen: null });
    views.events.emit('runFlowCue', { kind: 'trialObjective' });
    resetClock();
  }
  function endRun() {
    if (G.state !== 'paused' || !G.pausedFrom) return;
    G.state = G.pausedFrom;
    G.reason = 'quit';
    captureCheckpoint('ended');
    showOver();
  }

  return { toTitle, pause, resume, endRun };
}
