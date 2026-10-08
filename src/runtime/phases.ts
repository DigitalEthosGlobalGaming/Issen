import { createPhaseBindings, type PhaseBindingViews } from '../game/session/phase-bindings.ts';
import { stateView, cacheView } from '../game/session/state-view.ts';
import type { createRuntimeFoundation } from './foundation.ts';

import type { GameContext } from '../game/session/context.ts';
import type { PresentationContext } from '../presentation/context.ts';

import { DEATH_REASONS } from '../ui/screens/game-over.ts';
import { makeFig, EPOSE } from '../shared/figure-model.ts';
type ActionPorts = Pick<
  PhaseBindingViews,
  | 'setStage'
  | 'checkUnlocks'
  | 'startStandoff'
  | 'waveCfg'
  | 'waveConfiguration'
  | 'captureCheckpoint'
  | 'deferUntilSceneReady'
  | 'spawnEnemy'
  | 'killEnemy'
  | 'earn'
  | 'addScore'
  | 'swingPlayer'
  | 'playerDie'
  | 'enemyPos'
  | 'comboMult'
  | 'bossPos'
  | 'breakCombo'
  | 'bossTipWorld'
  | 'bumpCombo'
  | 'pickLook'
  | 'startWave'
  | 'nextStep'
  | 'computeMods'
  | 'startBoss'
  | 'bossSwipe'
  | 'showOver'
  | 'finishTrial'
  | 'startTrialEncounter'
  | 'openShrine'
>;

/** Compose phase controllers with explicit rule records and deferred actions. */
export function createRuntimePhases(
  foundation: ReturnType<typeof createRuntimeFoundation>,
  context: GameContext<PresentationContext>,
  readActions: () => ActionPorts,
) {
  const {
    waveLifecycle,
    wavesPhase,
    bossPhase,
    standoffPhase,
    shrinePhase,
    deathPhase,
    betweenPhase,
  } = createPhaseBindings(
    cacheView(() =>
      stateView(
        foundation.run.activity,
        ['combatRandom', 'activeTrial', 'activeDaily', 'trialFailure'],
        stateView(
          foundation.run.sessionState,
          ['hitStop', 'runBossMilestone', 'shrineOfferIds', 'timeScale', 'rewardFlowBusy'],
          stateView(
            foundation.profile.profileEquipment,
            ['EQ'],
            stateView(
              foundation.view.geometry,
              ['W', 'H', 'S', 'L'],
              stateView(foundation.profile.profileFoundation, ['ST'], {
                events: context.events,
                G: foundation.run.G,
                setStage: readActions().setStage,
                saveStats: foundation.profile.saveStats,
                checkUnlocks: readActions().checkUnlocks,
                startStandoff: readActions().startStandoff,
                waveCfg: readActions().waveCfg,
                waveConfiguration: readActions().waveConfiguration,
                captureCheckpoint: readActions().captureCheckpoint,
                deferUntilSceneReady: readActions().deferUntilSceneReady,
                spawnEnemy: readActions().spawnEnemy,
                killEnemy: readActions().killEnemy,
                earn: readActions().earn,
                addScore: readActions().addScore,
                orderSucceeded: () => foundation.browser.guided.orderSucceeded(),
                swingPlayer: readActions().swingPlayer,
                playerDie: readActions().playerDie,
                enemyPos: readActions().enemyPos,
                comboMult: readActions().comboMult,
                bossPos: readActions().bossPos,
                guided: foundation.browser.guided,
                breakCombo: readActions().breakCombo,
                bossTipWorld: readActions().bossTipWorld,
                bumpCombo: readActions().bumpCombo,
                pickLook: readActions().pickLook,
                startWave: readActions().startWave,
                accessible: foundation.browser.accessible,
                makeFigure: makeFig,
                guardPose: EPOSE.guard,
                nextStep: readActions().nextStep,
                premiumAccess: foundation.browser.premiumAccess,
                computeMods: readActions().computeMods,
                resetKnocks: () => {
                  foundation.run.sessionState.knocks = 0;
                },
                startBoss: readActions().startBoss,
                bossSwipe: readActions().bossSwipe,
                reasonMessage: (reason) => DEATH_REASONS[reason] || '',
                fallPlayer: (fall) => {
                  foundation.run.P.fall = fall;
                },
                showOver: readActions().showOver,
                finishTrial: readActions().finishTrial,
                startTrialEncounter: readActions().startTrialEncounter,
                openShrine: readActions().openShrine,
              } satisfies Omit<
                PhaseBindingViews,
                | 'hitStop'
                | 'runBossMilestone'
                | 'shrineOfferIds'
                | 'timeScale'
                | 'rewardFlowBusy'
                | 'combatRandom'
                | 'activeTrial'
                | 'activeDaily'
                | 'trialFailure'
                | 'ST'
                | 'W'
                | 'H'
                | 'S'
                | 'L'
                | 'EQ'
              >),
            ),
          ) satisfies Omit<
            PhaseBindingViews,
            | 'hitStop'
            | 'runBossMilestone'
            | 'shrineOfferIds'
            | 'timeScale'
            | 'rewardFlowBusy'
            | 'combatRandom'
            | 'activeTrial'
            | 'activeDaily'
            | 'trialFailure'
          >,
        ),
      ),
    ),
    context,
  );
  return {
    waveLifecycle,
    wavesPhase,
    bossPhase,
    standoffPhase,
    shrinePhase,
    deathPhase,
    betweenPhase,
  };
}
