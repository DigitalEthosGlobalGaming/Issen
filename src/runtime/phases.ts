import { createPhaseBindings, type PhaseBindingViews } from '../game/session/phase-bindings.ts';
import { stateView, cacheView } from '../game/session/state-view.ts';
import type { createRuntimeFoundation } from './foundation.ts';
import type { createRuntimePresentation } from './presentation.ts';
import type { GameContext } from '../game/session/context.ts';
import type { PresentationContext } from '../presentation/context.ts';
import { BOSS_SHADOW_DURATION } from '../rendering/figures/death.ts';
import { DEATH_REASONS } from '../ui/screens/game-over.ts';
import { makeFig, EPOSE } from '../shared/figure-model.ts';
type ActionPorts = Pick<
  PhaseBindingViews,
  | 'renderLives'
  | 'setStage'
  | 'bst'
  | 'challenge'
  | 'checkUnlocks'
  | 'startStandoff'
  | 'waveCfg'
  | 'waveConfiguration'
  | 'banner'
  | 'hint'
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
  | 'hud'
  | 'bossPos'
  | 'renderHp'
  | 'breakCombo'
  | 'setScore'
  | 'bossTipWorld'
  | 'bumpCombo'
  | 'notifications'
  | 'hideHint'
  | 'pickLook'
  | 'startWave'
  | 'toast'
  | 'nextStep'
  | 'showShrineOffers'
  | 'computeMods'
  | 'showScreen'
  | 'startBoss'
  | 'bossSwipe'
  | 'showOver'
  | 'finishTrial'
  | 'startTrialEncounter'
  | 'openShrine'
>;

/** Compose phase controllers with explicit base records, presentation and deferred actions. */
export function createRuntimePhases(
  foundation: ReturnType<typeof createRuntimeFoundation>,
  presentation: ReturnType<typeof createRuntimePresentation>,
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
                renderLives: readActions().renderLives,
                pop: presentation.pop,
                setStage: readActions().setStage,
                bst: readActions().bst,
                challenge: readActions().challenge,
                saveStats: foundation.profile.saveStats,
                checkUnlocks: readActions().checkUnlocks,
                startStandoff: readActions().startStandoff,
                waveCfg: readActions().waveCfg,
                waveConfiguration: readActions().waveConfiguration,
                banner: readActions().banner,
                setWaveLabel: (label) => {
                  foundation.browser.$('waveLbl').textContent = label;
                },
                sfx: foundation.browser.sfx,
                hint: readActions().hint,
                captureCheckpoint: readActions().captureCheckpoint,
                deferUntilSceneReady: readActions().deferUntilSceneReady,
                spawnEnemy: readActions().spawnEnemy,
                lightningFx: (p) =>
                  presentation
                    .effectSpawner()
                    .killFx('bolt', p.x, p.y - p.h * 0.55, -Math.PI / 2, p.h / 160),
                killEnemy: readActions().killEnemy,
                dust: presentation.dust,
                earn: readActions().earn,
                addScore: readActions().addScore,
                orderSucceeded: () => foundation.browser.guided.orderSucceeded(),
                swingPlayer: readActions().swingPlayer,
                playerDie: readActions().playerDie,
                enemyPos: readActions().enemyPos,
                comboMult: readActions().comboMult,
                sparks: presentation.sparks,
                buzz: foundation.browser.buzz,
                hud: readActions().hud,
                knifeTrail(pos) {
                  foundation.view.presentationState.fx.knives.push({
                    x0: foundation.view.geometry.L.player.x,
                    y0:
                      foundation.view.geometry.L.player.y -
                      foundation.view.geometry.L.player.h * 0.55,
                    x1: pos.x,
                    y1: pos.y - pos.h * 0.55,
                    t: 0,
                    life: 0.18,
                  });
                },
                bossPos: readActions().bossPos,
                renderHp: readActions().renderHp,
                guided: foundation.browser.guided,
                flash: presentation.flash,
                breakCombo: readActions().breakCombo,
                setScore: readActions().setScore,
                bossTipWorld: readActions().bossTipWorld,
                ring: presentation.ring,
                combatHaptics: foundation.browser.combatHaptics,
                letterbox: presentation.letterbox,
                bumpCombo: readActions().bumpCombo,
                notifications: readActions().notifications,
                hideHint: readActions().hideHint,
                addSlash: presentation.addSlash,
                killFx: presentation.killFx,
                scraps: presentation.scraps,
                stamp: presentation.stamp,
                punch: presentation.punch,
                inkBurst: presentation.inkBurst,
                shake: (amount) => {
                  foundation.view.presentationState.shake = Math.max(
                    foundation.view.presentationState.shake,
                    amount,
                  );
                },
                setBossLabels: (wave, glyph, name) => {
                  foundation.browser.$('waveLbl').textContent = wave;
                  foundation.browser.$('bossK').textContent = glyph;
                  foundation.browser.$('bossN').textContent = name;
                },
                showBossBar: (shown) => {
                  foundation.browser.$('bossbar').classList.toggle('on', shown);
                },
                bossStain: (p) => {
                  foundation.view.presentationState.fx.stains.push({
                    x: p.x,
                    y: p.y + p.h * 0.01,
                    rx: p.h * 0.3,
                    t: 0,
                    life: BOSS_SHADOW_DURATION,
                  });
                },
                pickLook: readActions().pickLook,
                startWave: readActions().startWave,
                accessible: foundation.browser.accessible,
                makeFigure: makeFig,
                guardPose: EPOSE.guard,
                clearLetterbox: () => {
                  foundation.view.presentationState.lbT = 0;
                },
                toast: readActions().toast,
                nextStep: readActions().nextStep,
                showShrineOffers: readActions().showShrineOffers,
                premiumAccess: foundation.browser.premiumAccess,
                computeMods: readActions().computeMods,
                showScreen: readActions().showScreen,
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
