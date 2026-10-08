import {
  bindRunStartFeedback,
  type RunStartFeedbackViews,
} from '../ui/wiring/run-start-feedback.ts';
import type { ShrineFeedbackViews } from '../ui/wiring/shrine-feedback.ts';
import { bindRunFlowFeedback, type RunFlowFeedbackViews } from '../ui/wiring/run-flow-feedback.ts';
import {
  bindCheckpointFeedback,
  type CheckpointFeedbackViews,
} from '../ui/wiring/checkpoint-feedback.ts';
import { bindTrialProgression } from '../game/progression/trial-listeners.ts';
import { bindTrialFeedback, type TrialFeedbackViews } from '../ui/wiring/trial-feedback.ts';
import {
  createSessionBindings,
  type SessionBindingViews,
} from '../game/session/session-bindings.ts';
import { stateView } from '../game/session/state-view.ts';
import type { createRuntimeFoundation } from './foundation.ts';
import type { createRuntimePresentation } from './presentation.ts';
import type { GameContext } from '../game/session/context.ts';
import type { PresentationContext } from '../presentation/context.ts';
import { REST_POSE as PREST } from '../game/player/player.ts';
import type { ResultReveal } from '../ui/screens/run-results.ts';
import {
  readRunCheckpoint,
  writeRunCheckpoint,
  clearRunCheckpoint,
} from '../platform/run-checkpoint.ts';
import { store } from '../platform/storage.ts';
import { newRunSeed } from '../shared/random.ts';
import { createWeatherState } from '../rendering/scene/weather-state.ts';
import { renderGameOver } from '../ui/screens/game-over.ts';
import type { createPhaseRouter } from '../game/session/phase-router.ts';
import type { createFrameLoop } from '../platform/frame-loop.ts';
type ActionPorts = Pick<
  SessionBindingViews<typeof PREST, ResultReveal>,
  | 'bossPos'
  | 'computeMods'
  | 'enemyPos'
  | 'hud'
  | 'setStage'
  | 'toast'
  | 'updateSavedRunButtons'
  | 'showScreen'
  | 'showOver'
  | 'checkUnlocks'
  | 'clearHints'
  | 'prepareScene'
  | 'startTrialEncounter'
  | 'startWave'
  | 'startBoss'
  | 'waveCfg'
  | 'deferUntilSceneReady'
  | 'toTitle'
  | 'rewardScreen'
  | 'supportPremium'
  | 'rewardSupport'
  | 'captureCheckpoint'
  | 'reviveDaruma'
  | 'finishTrial'
  | 'challenge'
  | 'runResults'
  | 'setBestLine'
  | 'modeKey'
  | 'setupAttract'
> &
  Pick<RunFlowFeedbackViews, 'showPauseScreen' | 'refreshArmoryNew' | 'renderTrialObjective'> &
  Pick<ShrineFeedbackViews, 'showShrineOffers'> &
  Pick<RunStartFeedbackViews, 'hint' | 'setScore'> &
  Pick<TrialFeedbackViews, 'banner' | 'openPanel'> &
  Pick<CheckpointFeedbackViews, 'renderHp' | 'renderLives'> & {
    readonly phaseRouter: Pick<ReturnType<typeof createPhaseRouter>, 'adoptCheckpoint'>;
    readonly frameLoop: Pick<ReturnType<typeof createFrameLoop>, 'resetClock'>;
  };

/** Compose session controllers with explicit base records, presentation and deferred actions. */
export function createRuntimeSession(
  foundation: ReturnType<typeof createRuntimeFoundation>,
  presentation: ReturnType<typeof createRuntimePresentation>,
  context: GameContext<PresentationContext>,
  readActions: () => ActionPorts,
) {
  const sessionBindings: ReturnType<typeof createSessionBindings<typeof PREST, ResultReveal>> =
    createSessionBindings<typeof PREST, ResultReveal>(() =>
      stateView(
        foundation.run.activity,
        [
          'activeTrial',
          'activeDaily',
          'runRandom',
          'combatRandom',
          'runTrialsWasUnlocked',
          'trialFailure',
          'trialResult',
        ],
        stateView(
          foundation.run.sessionState,
          [
            'rewardLedger',
            'runBossMilestone',
            'runTemplate',
            'savedRun',
            'shrineOfferIds',
            'runItemReveals',
            'timeScale',
            'hitStop',
            'rewardFlowBusy',
          ],
          stateView(
            foundation.view.stageState,
            ['stageSeed'],
            stateView(
              foundation.profile.profileFoundation,
              ['ST'],
              stateView(
                foundation.profile.profileEquipment,
                ['EQ'],
                stateView(foundation.run.sceneState, ['sceneLoading', 'sceneContinuation'], {
                  get adoptPhase(): SessionBindingViews<typeof PREST, ResultReveal>['adoptPhase'] {
                    return () => readActions().phaseRouter.adoptCheckpoint();
                  },
                  get discardSceneContinuation(): SessionBindingViews<
                    typeof PREST,
                    ResultReveal
                  >['discardSceneContinuation'] {
                    return () => {
                      foundation.run.sceneState.sceneContinuation = undefined;
                    };
                  },
                  get $() {
                    return foundation.browser.$;
                  },
                  get AWAKENING() {
                    return foundation.profile.AWAKENING;
                  },
                  get COLLECTION_PROGRESS() {
                    return foundation.profile.COLLECTION_PROGRESS;
                  },
                  get G() {
                    return foundation.run.G;
                  },
                  get META() {
                    return foundation.profile.META;
                  },
                  get SETUP() {
                    return foundation.profile.SETUP;
                  },
                  get UNL() {
                    return foundation.profile.UNL;
                  },
                  get WX() {
                    return foundation.run.WX;
                  },
                  get DAILY_LOGIN() {
                    return foundation.profile.DAILY_LOGIN;
                  },
                  get ITEMS() {
                    return foundation.profile.ITEMS;
                  },
                  get accessibleUnlocks() {
                    return foundation.profile.accessibleUnlocks;
                  },
                  get applySeal() {
                    return foundation.view.applySeal;
                  },
                  get bossPos() {
                    return readActions().bossPos;
                  },
                  get computeMods() {
                    return readActions().computeMods;
                  },
                  get enemyPos() {
                    return readActions().enemyPos;
                  },
                  get hud() {
                    return readActions().hud;
                  },
                  get playerEquipment() {
                    return foundation.profile.playerEquipment;
                  },
                  get playerStats() {
                    return foundation.profile.playerStats;
                  },
                  get premiumAccess() {
                    return foundation.browser.premiumAccess;
                  },
                  get renderHp() {
                    return readActions().renderHp;
                  },
                  get renderLives() {
                    return readActions().renderLives;
                  },
                  get saveAwakening() {
                    return foundation.profile.saveAwakening;
                  },
                  get saveMeta() {
                    return foundation.profile.saveMeta;
                  },
                  get saveStats() {
                    return foundation.profile.saveStats;
                  },
                  get saveCollections() {
                    return foundation.profile.saveCollections;
                  },
                  get setScore() {
                    return readActions().setScore;
                  },
                  get setStage() {
                    return readActions().setStage;
                  },
                  get syncCollections() {
                    return foundation.profile.syncCollections;
                  },
                  get toast() {
                    return readActions().toast;
                  },
                  get updateSavedRunButtons() {
                    return readActions().updateSavedRunButtons;
                  },
                  get showScreen() {
                    return readActions().showScreen;
                  },
                  get showShrineOffers() {
                    return readActions().showShrineOffers;
                  },
                  get showOver() {
                    return readActions().showOver;
                  },
                  get persistence(): SessionBindingViews<
                    typeof PREST,
                    ResultReveal
                  >['persistence'] {
                    return {
                      read: readRunCheckpoint,
                      write: writeRunCheckpoint,
                      clear: clearRunCheckpoint,
                    };
                  },
                  get storage(): SessionBindingViews<typeof PREST, ResultReveal>['storage'] {
                    return store;
                  },
                  get resetClock(): SessionBindingViews<typeof PREST, ResultReveal>['resetClock'] {
                    return () => readActions().frameLoop.resetClock();
                  },
                  get events(): SessionBindingViews<typeof PREST, ResultReveal>['events'] {
                    return context.events;
                  },
                  get P() {
                    return foundation.run.P;
                  },
                  get PREST() {
                    return PREST;
                  },
                  get apparelMotion() {
                    return foundation.view.apparelMotion;
                  },
                  get audio() {
                    return foundation.browser.audio;
                  },
                  get checkUnlocks() {
                    return readActions().checkUnlocks;
                  },
                  get clearHints() {
                    return readActions().clearHints;
                  },
                  get guided() {
                    return foundation.browser.guided;
                  },
                  get hint() {
                    return readActions().hint;
                  },
                  get prepareScene() {
                    return readActions().prepareScene;
                  },
                  get presentationState() {
                    return foundation.view.presentationState;
                  },
                  get stageVisits() {
                    return foundation.view.stageVisits;
                  },
                  get startTrialEncounter() {
                    return readActions().startTrialEncounter;
                  },
                  get startWave() {
                    return readActions().startWave;
                  },
                  get startBoss() {
                    return readActions().startBoss;
                  },
                  get audioInit() {
                    return foundation.browser.audioInit;
                  },
                  get buildLeaves() {
                    return presentation.buildLeaves;
                  },
                  get waveCfg() {
                    return readActions().waveCfg;
                  },
                  get clearTrialResult(): SessionBindingViews<
                    typeof PREST,
                    ResultReveal
                  >['clearTrialResult'] {
                    return () => {
                      foundation.run.activity.trialResult = null;
                    };
                  },
                  get clearCheckpoint(): SessionBindingViews<
                    typeof PREST,
                    ResultReveal
                  >['clearCheckpoint'] {
                    return clearRunCheckpoint;
                  },
                  get newRunSeed() {
                    return newRunSeed;
                  },
                  get resetWeather(): SessionBindingViews<
                    typeof PREST,
                    ResultReveal
                  >['resetWeather'] {
                    return (random) => {
                      Object.assign(foundation.run.WX, createWeatherState(random));
                    };
                  },
                  get TRIAL_PROGRESS() {
                    return foundation.profile.TRIAL_PROGRESS;
                  },
                  get R() {
                    return foundation.view.R;
                  },
                  get deferUntilSceneReady() {
                    return readActions().deferUntilSceneReady;
                  },
                  get renderTrialObjective() {
                    return readActions().renderTrialObjective;
                  },
                  get store() {
                    return store;
                  },
                  get toTitle() {
                    return readActions().toTitle;
                  },
                  get rewardScreen() {
                    return readActions().rewardScreen;
                  },
                  get supportPremium() {
                    return readActions().supportPremium;
                  },
                  get testerPremium() {
                    return foundation.browser.browserPreferences.testerPremium;
                  },
                  get lifecycle() {
                    return foundation.lifecycle;
                  },
                  get rewardSupport() {
                    return readActions().rewardSupport;
                  },
                  get captureCheckpoint() {
                    return readActions().captureCheckpoint;
                  },
                  get reviveDaruma() {
                    return readActions().reviveDaruma;
                  },
                  get finishTrial() {
                    return readActions().finishTrial;
                  },
                  get challenge() {
                    return readActions().challenge;
                  },
                  get runResults() {
                    return readActions().runResults;
                  },
                  get setBestLine(): SessionBindingViews<
                    typeof PREST,
                    ResultReveal
                  >['setBestLine'] {
                    return () => readActions().setBestLine();
                  },
                  get modeKey() {
                    return readActions().modeKey;
                  },
                  get clearRunCheckpoint() {
                    return clearRunCheckpoint;
                  },
                  get renderGameOver() {
                    return renderGameOver;
                  },
                  get refreshArmoryNew() {
                    return readActions().refreshArmoryNew;
                  },
                  get setupAttract() {
                    return readActions().setupAttract;
                  },
                  get showPauseScreen() {
                    return readActions().showPauseScreen;
                  },
                  get contextLost() {
                    return !!foundation.browser.nativeScene?.contextLost;
                  },
                }),
              ),
            ),
          ),
        ),
      ),
    );
  foundation.lifecycle.add(
    bindTrialProgression(context.events, () => ({
      TRIAL_PROGRESS: foundation.profile.TRIAL_PROGRESS,
      UNL: foundation.profile.UNL,
      store,
    })),
  );
  foundation.lifecycle.add(
    bindTrialFeedback(context.events, () => ({
      banner: readActions().banner,
      setWaveLabel: (label) => {
        foundation.browser.$('waveLbl').textContent = label;
      },
      renderTrialObjective: readActions().renderTrialObjective,
      sfx: foundation.browser.sfx,
      buildLeaves: presentation.buildLeaves,
      audio: foundation.browser.audio,
      hideTrialObjective: () => {
        foundation.browser.$('trialObjective').hidden = true;
      },
      openPanel: (panel) => readActions().openPanel(panel),
      focusTrialResult: () => {
        foundation.browser
          .$('trials')
          .querySelector<HTMLButtonElement>('#trialResult button')
          ?.focus({ preventScroll: true });
      },
    })),
  );
  foundation.lifecycle.add(
    bindCheckpointFeedback(context.events, () => ({
      $: foundation.browser.$,
      renderLives: readActions().renderLives,
      setScore: readActions().setScore,
      applySeal: foundation.view.applySeal,
      hud: readActions().hud,
      renderHp: readActions().renderHp,
      toast: readActions().toast,
      updateSavedRunButtons: readActions().updateSavedRunButtons,
      showScreen: readActions().showScreen,
    })),
  );
  foundation.lifecycle.add(
    bindRunFlowFeedback(context.events, () => ({
      $: foundation.browser.$,
      applySeal: foundation.view.applySeal,
      clearHints: readActions().clearHints,
      refreshArmoryNew: readActions().refreshArmoryNew,
      showScreen: readActions().showScreen,
      hud: readActions().hud,
      presentationState: foundation.view.presentationState,
      setBestLine: readActions().setBestLine,
      showPauseScreen: readActions().showPauseScreen,
      renderTrialObjective: readActions().renderTrialObjective,
    })),
  );
  foundation.lifecycle.add(
    bindRunStartFeedback(context.events, () => ({
      $: foundation.browser.$,
      apparelMotion: foundation.view.apparelMotion,
      presentationState: foundation.view.presentationState,
      clearEffects: () => {
        for (const [key, particles] of Object.entries(foundation.view.presentationState.fx))
          if (key !== 'scratches') particles.length = 0;
      },
      clearHints: readActions().clearHints,
      hint: readActions().hint,
      hud: readActions().hud,
      setScore: readActions().setScore,
      showScreen: readActions().showScreen,
      toast: readActions().toast,
      applySeal: foundation.view.applySeal,
      audioInit: foundation.browser.audioInit,
      buildLeaves: presentation.buildLeaves,
    })),
  );
  return sessionBindings;
}
