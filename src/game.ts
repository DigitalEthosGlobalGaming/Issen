import { createSealPresentation } from './presentation/seal.ts';
import { createStageState } from './presentation/stage-state.ts';
import { createPresentationGeometry } from './presentation/geometry.ts';
import { createSceneState } from './game/session/scene-state.ts';
import { createRuntimePreferences } from './platform/runtime-preferences.ts';
import { createRuntimeAudio } from './ui/wiring/audio.ts';
import { createRuntimeSessionState } from './game/session/runtime-state.ts';
import { cacheView } from './game/session/state-view.ts';
import type { PhaseBindingViews } from './game/session/phase-bindings.ts';
import { createFrameBindings } from './runtime/frame-bindings.ts';
import { bindStandoffFeedback } from './presentation/standoff-feedback.ts';
import { createKillAppearance } from './presentation/kill-appearance.ts';
import { createViewport } from './presentation/viewport.ts';
import { bindGraphicsLifecycle } from './presentation/graphics-lifecycle.ts';
import { createRunActivity } from './game/session/activity.ts';
import { createSessionBindings, type SessionBindingViews } from './game/session/session-bindings.ts';
import { createMenuBindings, type MenuBindingViews } from './ui/wiring/menu-bindings.ts';
import { createPhaseBindings } from './game/session/phase-bindings.ts';
import { bindBossFeedback } from './presentation/boss-feedback.ts';
import { createFiguresHost } from './presentation/figures-host.ts';
import { createProfileFoundation, createProfileProgress, createProfileEquipment } from './game/progression/profile-state.ts';
import { createEnvironmentHost } from './presentation/environment-host.ts';
import { createEquipmentPresentation } from './presentation/equipment.ts';
import { createNativeServices } from './presentation/native-services.ts';
import { bindDamageFeedback } from './presentation/damage-feedback.ts';
import { bindDuelFeedback } from './presentation/duel-feedback.ts';
import { bindEncounterProgression } from './game/progression/encounter-listeners.ts';
import { createSceneFlow } from './game/session/scene-flow.ts';
import { createProfileRules } from './game/progression/profile-rules.ts';
import { createActiveEquipment } from './game/equipment/active.ts';
import { visiblePet, saveWithFoxfire } from './game/player/companions.ts';
import { createCombatScore } from './game/progression/combat-score.ts';
import { bindCombatScoreFeedback } from './presentation/combat-score.ts';
import { bindKillFeedback } from './presentation/kill.ts';
import { bindCombatProgression } from './game/progression/combat-listeners.ts';
import { createEnemyKill } from './game/combat/kill.ts';
import { createPhaseRouter, definePhase } from './game/session/phase-router.ts';
import { bindProfileWiring } from './ui/wiring/profile.ts';
import { bindPurchaseWiring } from './ui/wiring/purchases.ts';
import { createInputWiring } from './ui/wiring/input.ts';
import { createTitleSecrets } from './ui/wiring/secrets.ts';
import { createPresentationState } from './presentation/state.ts';
import { createPostArtwork } from './presentation/post-artwork.ts';
import { createFeedbackPresentation } from './presentation/feedback.ts';
import { createEventBus, type GameEvents } from './game/events.ts';
import type { GameContext } from './game/session/context.ts';
import type { PresentationContext } from './presentation/context.ts';
import { recordDailyLogin, SEVEN_DAWNS_CREST } from './game/progression/daily-login.ts';
import { syncCollectionProgress } from './game/progression/collection-progress.ts';
import { type PendingSupportReward } from './platform/pending-support.ts';
import { createRewardedSupport } from './platform/rewarded-support.ts';
import { createRewardScreen } from './ui/screens/rewarded-support.ts';
import { setSealTextures } from './rendering/ui-art.ts';
import { createStageVisitSeeds } from './rendering/environment/stage-variation.ts';
import { compositionKey } from './rendering/environment/worker-types.ts';
import { SUPPORTER_FILM_ITEM } from './game/content/items.ts';
import { precisionZone } from './game/progression/mastery.ts';
import { PREMIUM_FILM } from './platform/premium.ts';
import { testerPremiumActive } from './platform/tester-premium.ts';
import type { Item, ItemCategory } from './game/content/items.ts';
import type { Enemy } from './game/combat/enemy.ts';
import type { Boss } from './game/encounters/boss.ts';
import type { Direction } from './shared/directions.ts';
import { createLifecycle } from './platform/lifecycle.ts';
import { createRuntimeScreens } from './ui/wiring/screens.ts';
import { createRunState } from './game/run-state.ts';
import type { PreviewFrame } from './rendering/armory-preview.ts';
import { createArmoryPreview } from './rendering/armory-preview.ts';
import { activeNow } from './platform/activity.ts';
import { createSecondaryMotion } from './rendering/figures/secondary-motion.ts';
import { appendGameOverUnlocks, renderGameOver, ITEM_TYPE_LABEL as TYPE_WORD } from './ui/screens/game-over.ts';
import { createRunResults } from './ui/screens/run-results.ts';
import type { ResultReveal } from './ui/screens/run-results.ts';
import { recordSecretEvent } from './game/progression/secret-events.ts';
import { bossPosition } from './rendering/figures/boss-position.ts';
import { createGrunt as createEnemy } from './game/combat/grunt-spawn.ts';
import { pickEnemyLook, orderedEnemies, selectAttacker } from './game/combat/enemy-spawn.ts';
import { enemyPosition } from './rendering/figures/enemy-position.ts';
import { advanceGrunts as simulateEnemies } from './game/combat/grunt.ts';
import { createWeatherState } from './rendering/scene/weather-state.ts';
import { REST_POSE as PREST, createPlayerAnimation, startSwing } from './game/player/player.ts';
import { comboMultiplier, scoreGain } from './game/progression/scoring.ts';
import { createEffectQuality } from './rendering/effects/quality.ts';
import { BOSS_SHADOW_DURATION } from './rendering/figures/death.ts';
import { renderShrine } from './ui/screens/shrine.ts';
import { createNotifications } from './ui/notifications.ts';
import { modeKey as getModeKey } from './game/progression/modes.ts';
import { makeFig, EPOSE } from './shared/figure-model.ts';
import type { createBackground } from './rendering/scene/background.ts';
import { createPalette } from './rendering/palette.ts';
import { waveConfig, bossParameters } from './game/encounters/configuration.ts';
import { createLayout } from './rendering/layout.ts';
import type { BladeStats } from './game/progression/statistics.ts';
import { BLESS } from './game/content/blessings.ts';
import { loadStatistics, loadSetup, loadUnlocks, loadEquipment } from './platform/saves.ts';
import { createItems } from './game/content/items.ts';
import { renderPauseBlessings } from './ui/screens/pause.ts';
import { DEATH_REASONS } from './ui/screens/game-over.ts';
import { store, isTestProfile } from './platform/storage.ts';
import { STAGES } from './game/content/stages.ts';
import { rng, newRunSeed } from './shared/random.ts';
import { readRunCheckpoint, writeRunCheckpoint, clearRunCheckpoint } from './platform/run-checkpoint.ts';
import { createRuntimeFrames } from './runtime/frames.ts';
import { createRuntimeControls } from './runtime/controls.ts';
import { createRuntimeGameplay } from './runtime/gameplay.ts';
import { createRuntimeUIBase } from './runtime/ui-base.ts';

import { createRuntimePresentation } from './runtime/presentation.ts';
import { createRuntimeFoundation } from './runtime/foundation.ts';

import { stateView } from './game/session/state-view.ts';

import { startRuntime } from './runtime/startup.ts';

import { type PreparedLighting } from './presentation/native-services.ts';

import { type GameEdition } from './platform/editions.ts';

import { pageActive } from './platform/activity.ts';

export function startGame(
  surfaces: ReadonlyMap<string, import('./rendering/scene-surface.ts').SceneSurface>,
  lighting?: PreparedLighting,
): () => void {
  const foundation = createRuntimeFoundation(surfaces, lighting, {
    edition: import.meta.env.VITE_GAME_EDITION as GameEdition,
    saveSettings: () => controls.saveSettings(),
  });

  const presentation = createRuntimePresentation(
    foundation,
    () => ({
      isSp: () => game.isSp(),
      isSteelThird: () => game.isSteelThird(),
      isRobeSp: () => game.isRobeSp(),
      pz: () => game.pz(),
      waveConfiguration: () => game.waveConfiguration(),
      liveOrdered: () => game.liveOrdered(),
    }),
    () => controls.cinematic,
  );

  const ui = createRuntimeUIBase(foundation, () => game.shrinePhase);
  const game = createRuntimeGameplay(
    foundation,
    presentation,
    ui,
    () => ({
      openPanel: (...args) => controls.openPanel(...args),
      setBestLine: () => controls.setBestLine(),
      refreshArmoryNew: () => controls.refreshArmoryNew(),
    }),
    () => ({ resetClock: () => frames.frameLoop.resetClock() }),
  );

  let artworkReady = false;

  const controls = createRuntimeControls(
    foundation,
    presentation,
    ui,
    game,
    surfaces,
    () => artworkReady,
  );

  const frames = createRuntimeFrames(
    foundation,
    presentation,
    ui,
    game,
    controls,
    () => artworkReady,
  );
  // Scene readiness belongs to orchestration, never to a drawing call.

  startRuntime(() =>
    stateView(
      foundation.run.sessionState,
      ['savedRun'],
      stateView(
        foundation.view.geometry,
        ['W', 'H', 'DPR'],
        stateView(foundation.view.stageState, ['stageSeed'], {
          lifecycle: foundation.lifecycle,
          frameLoop: frames.frameLoop,
          G: foundation.run.G,
          cinematic: controls.cinematic,
          setupScreen: controls.setupScreen,
          tutorial: controls.tutorial,
          armory: controls.armory,
          notifications: ui.notifications,
          guided: foundation.browser.guided,
          runResults: ui.runResults,
          audio: foundation.browser.audio,
          driftRenderer: presentation.driftRenderer,
          reducedMotion: foundation.browser.reducedMotion,
          reducedFlashes: foundation.browser.reducedFlashes,
          density: foundation.browser.density,
          computeMods: game.computeMods,
          applySeal: foundation.view.applySeal,
          resize: frames.resize,
          setupAttract: game.setupAttract,
          restoreCheckpoint: game.restoreCheckpoint,
          showPauseScreen: ui.showPauseScreen,
          showOver: game.showOver,
          recoverSupportReward: game.recoverSupportReward,
          setMuteIcon: foundation.browser.setMuteIcon,
          refreshArmoryNew: controls.refreshArmoryNew,
          setBestLine: controls.setBestLine,
          updateSavedRunButtons: ui.updateSavedRunButtons,
          disposePointer: controls.disposePointer,
          disposeKeyboard: controls.disposeKeyboard,
          inkCharm: foundation.browser.inkCharm,
          inkCompanion: foundation.browser.inkCompanion,
          inkEnemy: foundation.browser.inkEnemy,
          inkPlayer: foundation.browser.inkPlayer,
          inkSword: foundation.browser.inkSword,
          environmentRenderer: foundation.browser.environmentRenderer,
          presentationState: foundation.view.presentationState,
          markArtworkReady() {
            artworkReady = true;
            if (pageActive()) frames.frameLoop.start();
          },
        }),
      ),
    ),
  );
  return foundation.lifecycle.dispose;
}
