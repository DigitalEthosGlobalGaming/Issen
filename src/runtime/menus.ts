import { createMenuBindings, type MenuBindingViews } from '../ui/wiring/menu-bindings.ts';
import { stateView } from '../game/session/state-view.ts';
import type { createRuntimeFoundation } from './foundation.ts';
import type { createRuntimePresentation } from './presentation.ts';
type MenuActionPorts = Pick<
  MenuBindingViews,
  | 'hudView'
  | 'renderArmory'
  | 'startTrial'
  | 'showScreen'
  | 'toTitle'
  | 'checkUnlocks'
  | 'computeMods'
  | 'hud'
  | 'refreshArmoryNew'
  | 'renderLives'
  | 'testJump'
  | 'toast'
  | 'screenAnimation'
  | 'prepareScene'
  | 'artworkReady'
  | 'supportPreview'
  | 'releasePreviewArtwork'
  | 'inspectionChanged'
  | 'demoKill'
  | 'buildWeather'
  | 'setupAttract'
>;

/** Wire menu owners from explicit base context, presentation and deferred action capabilities. */
export function createRuntimeMenus(
  foundation: ReturnType<typeof createRuntimeFoundation>,
  presentation: ReturnType<typeof createRuntimePresentation>,
  readActions: () => MenuActionPorts,
) {
  const {
    setBestLine,
    openPanel,
    closePanel,
    renderStats,
    setupScreen,
    renderSetup,
    tutorial,
    launchTutorial,
    showAdmin,
    scrollMenus,
    applySettings,
    saveSettings,
    lightingDebug,
    options,
    armoryWiring,
    cinematicWiring,
  } = createMenuBindings(() =>
    stateView(
      foundation.run.activity,
      ['trialResult'],
      stateView(
        foundation.run.sessionState,
        ['savedRun'],
        stateView(
          foundation.view.geometry,
          ['MIST'],
          stateView(
            foundation.view.stageState,
            ['stageSeed'],
            stateView(
              foundation.profile.profileFoundation,
              ['ST'],
              stateView(foundation.profile.profileEquipment, ['EQ'], {
                get $(): MenuBindingViews['$'] {
                  return foundation.browser.$;
                },
                get playerStats(): MenuBindingViews['playerStats'] {
                  return foundation.profile.playerStats;
                },
                get G(): MenuBindingViews['G'] {
                  return foundation.run.G;
                },
                get hudView(): MenuBindingViews['hudView'] {
                  return readActions().hudView;
                },
                get previewFrame(): MenuBindingViews['previewFrame'] {
                  return presentation.previewFrame;
                },
                get testerPremium(): MenuBindingViews['testerPremium'] {
                  return foundation.browser.browserPreferences.testerPremium;
                },
                get renderArmory(): MenuBindingViews['renderArmory'] {
                  return readActions().renderArmory;
                },
                get META(): MenuBindingViews['META'] {
                  return foundation.profile.META;
                },
                get saveMeta(): MenuBindingViews['saveMeta'] {
                  return foundation.profile.saveMeta;
                },
                get premiumAccess(): MenuBindingViews['premiumAccess'] {
                  return foundation.browser.premiumAccess;
                },
                get TRIAL_PROGRESS(): MenuBindingViews['TRIAL_PROGRESS'] {
                  return foundation.profile.TRIAL_PROGRESS;
                },
                get startTrial(): MenuBindingViews['startTrial'] {
                  return readActions().startTrial;
                },
                get showScreen(): MenuBindingViews['showScreen'] {
                  return readActions().showScreen;
                },
                get UNL(): MenuBindingViews['UNL'] {
                  return foundation.profile.UNL;
                },
                get ITEMS(): MenuBindingViews['ITEMS'] {
                  return foundation.profile.ITEMS;
                },
                get clearTrialResult(): MenuBindingViews['clearTrialResult'] {
                  return () => {
                    foundation.run.activity.trialResult = null;
                  };
                },
                get SETUP(): MenuBindingViews['SETUP'] {
                  return foundation.profile.SETUP;
                },
                get ITEM_BY(): MenuBindingViews['ITEM_BY'] {
                  return foundation.profile.ITEM_BY;
                },
                get sfx(): MenuBindingViews['sfx'] {
                  return foundation.browser.sfx;
                },
                get toTitle(): MenuBindingViews['toTitle'] {
                  return readActions().toTitle;
                },
                get reducedMotion(): MenuBindingViews['reducedMotion'] {
                  return foundation.browser.reducedMotion;
                },
                get AWAKENING(): MenuBindingViews['AWAKENING'] {
                  return foundation.profile.AWAKENING;
                },
                get applySeal(): MenuBindingViews['applySeal'] {
                  return foundation.view.applySeal;
                },
                get checkUnlocks(): MenuBindingViews['checkUnlocks'] {
                  return readActions().checkUnlocks;
                },
                get computeMods(): MenuBindingViews['computeMods'] {
                  return readActions().computeMods;
                },
                get hud(): MenuBindingViews['hud'] {
                  return readActions().hud;
                },
                get playerEquipment(): MenuBindingViews['playerEquipment'] {
                  return foundation.profile.playerEquipment;
                },
                get refreshArmoryNew(): MenuBindingViews['refreshArmoryNew'] {
                  return readActions().refreshArmoryNew;
                },
                get renderLives(): MenuBindingViews['renderLives'] {
                  return readActions().renderLives;
                },
                get revoked(): MenuBindingViews['revoked'] {
                  return foundation.profile.revoked;
                },
                get saveAwakening(): MenuBindingViews['saveAwakening'] {
                  return foundation.profile.saveAwakening;
                },
                get testJump(): MenuBindingViews['testJump'] {
                  return readActions().testJump;
                },
                get toast(): MenuBindingViews['toast'] {
                  return readActions().toast;
                },
                get setTrialsWasUnlocked(): MenuBindingViews['setTrialsWasUnlocked'] {
                  return (value) => {
                    foundation.run.activity.runTrialsWasUnlocked = value;
                  };
                },
                get cvs(): MenuBindingViews['cvs'] {
                  return foundation.browser.cvs;
                },
                get screenAnimation(): MenuBindingViews['screenAnimation'] {
                  return readActions().screenAnimation;
                },
                get lifecycle(): MenuBindingViews['lifecycle'] {
                  return foundation.lifecycle;
                },
                get settings(): MenuBindingViews['settings'] {
                  return foundation.browser.settings;
                },
                get reducedFlashes(): MenuBindingViews['reducedFlashes'] {
                  return foundation.browser.reducedFlashes;
                },
                get prepareScene(): MenuBindingViews['prepareScene'] {
                  return readActions().prepareScene;
                },
                get combatHaptics(): MenuBindingViews['combatHaptics'] {
                  return foundation.browser.combatHaptics;
                },
                get audio(): MenuBindingViews['audio'] {
                  return foundation.browser.audio;
                },
                get setMuteIcon(): MenuBindingViews['setMuteIcon'] {
                  return foundation.browser.setMuteIcon;
                },
                get presentationState(): MenuBindingViews['presentationState'] {
                  return foundation.view.presentationState;
                },
                get environmentState(): MenuBindingViews['environmentState'] {
                  return presentation.environmentState;
                },
                get ambient(): MenuBindingViews['ambient'] {
                  return presentation.ambient;
                },
                get rebalanceWeather(): MenuBindingViews['rebalanceWeather'] {
                  return presentation.rebalanceWeather;
                },
                get lightingRig(): MenuBindingViews['lightingRig'] {
                  return foundation.browser.lightingRig;
                },
                get audioInit(): MenuBindingViews['audioInit'] {
                  return foundation.browser.audioInit;
                },
                get systemMotion(): MenuBindingViews['systemMotion'] {
                  return foundation.browser.systemMotion;
                },
                get artworkReady() {
                  return readActions().artworkReady;
                },
                get supportPreview() {
                  return readActions().supportPreview;
                },
                get releasePreviewArtwork() {
                  return readActions().releasePreviewArtwork;
                },
                get inspectionChanged() {
                  return readActions().inspectionChanged;
                },
                get accessibleUnlocks(): MenuBindingViews['accessibleUnlocks'] {
                  return foundation.profile.accessibleUnlocks;
                },
                get accessible(): MenuBindingViews['accessible'] {
                  return foundation.browser.accessible;
                },
                get DAILY_LOGIN(): MenuBindingViews['DAILY_LOGIN'] {
                  return foundation.profile.DAILY_LOGIN;
                },
                get COLLECTION_PROGRESS(): MenuBindingViews['COLLECTION_PROGRESS'] {
                  return foundation.profile.COLLECTION_PROGRESS;
                },
                get ARMORY_SEEN(): MenuBindingViews['ARMORY_SEEN'] {
                  return foundation.profile.ARMORY_SEEN;
                },
                get SEALS(): MenuBindingViews['SEALS'] {
                  return foundation.view.SEALS;
                },
                get CHARMCOL(): MenuBindingViews['CHARMCOL'] {
                  return presentation.CHARMCOL;
                },
                get demoKill(): MenuBindingViews['demoKill'] {
                  return readActions().demoKill;
                },
                get previewVisits(): MenuBindingViews['previewVisits'] {
                  return foundation.view.previewVisits;
                },
                get buildLeaves(): MenuBindingViews['buildLeaves'] {
                  return presentation.buildLeaves;
                },
                get palette(): MenuBindingViews['palette'] {
                  return foundation.view.palette;
                },
                get buildBG(): MenuBindingViews['buildBG'] {
                  return presentation.buildBG;
                },
                get buildMist(): MenuBindingViews['buildMist'] {
                  return presentation.buildMist;
                },
                get buildGrass(): MenuBindingViews['buildGrass'] {
                  return presentation.buildGrass;
                },
                get buildWeather(): MenuBindingViews['buildWeather'] {
                  return readActions().buildWeather;
                },
                get setupAttract(): MenuBindingViews['setupAttract'] {
                  return readActions().setupAttract;
                },
                get saveStats(): MenuBindingViews['saveStats'] {
                  return foundation.profile.saveStats;
                },
              }),
            ),
          ),
        ),
      ),
    ),
  );
  return {
    setBestLine,
    openPanel,
    closePanel,
    renderStats,
    setupScreen,
    renderSetup,
    tutorial,
    launchTutorial,
    showAdmin,
    scrollMenus,
    applySettings,
    saveSettings,
    lightingDebug,
    options,
    armoryWiring,
    cinematicWiring,
  };
}
