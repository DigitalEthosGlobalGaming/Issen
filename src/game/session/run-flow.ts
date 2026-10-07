import { recordSecretEvent } from '../progression/secret-events.ts';
import { BLESS_BY } from '../content/blessings.ts';
import type { BLESS } from '../content/blessings.ts';
import type { RunState, Screen } from '../run-state.ts';
import type { Statistics } from '../progression/statistics.ts';
import type { DailyRun } from '../progression/daily.ts';
import type { Equipment } from '../../platform/saves.ts';
import type { RunCheckpoint } from '../../platform/run-checkpoint.ts';

export interface RunFlowViews<Pose extends object> {
  readonly $: (id: string) => HTMLElement;
  readonly G: RunState;
  readonly playerStats: Statistics;
  readonly playerEquipment: Equipment;
  ST: Statistics;
  EQ: Equipment;
  activeDaily: DailyRun | null;
  timeScale: number;
  readonly shrineOfferIds: readonly string[] | null;
  readonly contextLost: boolean;
  /** Transitional cosmetic record slices; player/event ownership moves later. */
  readonly P: { fall: number; pose: Pose };
  readonly PREST: Pose;
  readonly presentationState: { lbT: number };
  readonly audio: { setPaused: (paused: boolean) => void };
  readonly guided: { readonly frozen: boolean };
  readonly applySeal: () => void;
  readonly clearHints: () => void;
  readonly refreshArmoryNew: () => void;
  readonly showScreen: (id: Screen | null) => void;
  readonly hud: (on: boolean) => void;
  readonly setStage: (stage: number, force: boolean) => void;
  readonly setupAttract: () => void;
  readonly setBestLine: () => void;
  readonly saveStats: () => void;
  readonly checkUnlocks: () => void;
  readonly showPauseScreen: () => void;
  readonly showShrineOffers: (offers: (typeof BLESS)[number][]) => void;
  readonly renderTrialObjective: () => void;
  readonly resetClock: () => void;
  readonly captureCheckpoint: (status?: RunCheckpoint['status']) => void;
  readonly showOver: () => void;
}

/** Run lifetime controls retain plain records and invoke explicit presentation ports. */
export function createRunFlow<Pose extends object>(views: RunFlowViews<Pose>) {
  const {
    $,
    G,
    playerStats,
    playerEquipment,
    applySeal,
    clearHints,
    refreshArmoryNew,
    showScreen,
    hud,
    presentationState,
    setStage,
    setupAttract,
    P,
    PREST,
    saveStats,
    checkUnlocks,
    showPauseScreen,
    audio,
    guided,
    showShrineOffers,
    renderTrialObjective,
    captureCheckpoint,
    showOver,
    setBestLine,
    resetClock,
  } = views;
  function toTitle() {
    views.activeDaily = null;
    views.ST = playerStats;
    views.EQ = playerEquipment;
    applySeal();
    G.panel = null;
    G.state = 'title';
    G.mode = 'normal';
    G.blade = false;
    G.zen = false;
    clearHints();
    refreshArmoryNew();
    showScreen('title');
    hud(false);
    $('bossbar').classList.remove('on');
    views.timeScale = 1;
    presentationState.lbT = 0;
    if (G.stage !== 0) setStage(0, true);
    setupAttract();
    P.fall = 0;
    P.pose = { ...PREST };
    setBestLine();
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
      showPauseScreen();
    }
  }
  function resume() {
    if (views.contextLost) return;
    if (G.state !== 'paused' || !G.pausedFrom) return;
    G.state = G.pausedFrom;
    audio.setPaused(guided.frozen);
    if (G.state === 'shrine' && views.shrineOfferIds)
      showShrineOffers(views.shrineOfferIds.map((id) => BLESS_BY[id]).filter((bl) => !!bl));
    else showScreen(null);
    renderTrialObjective();
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

