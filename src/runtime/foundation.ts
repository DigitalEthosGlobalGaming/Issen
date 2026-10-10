import { createSealPresentation } from '../presentation/seal.ts';
import { createStageState } from '../presentation/stage-state.ts';
import { createPresentationGeometry } from '../presentation/geometry.ts';
import { createSceneState } from '../game/session/scene-state.ts';
import { createRuntimePreferences } from '../platform/runtime-preferences.ts';
import { createRuntimeAudio } from '../ui/wiring/audio.ts';
import { createRuntimeSessionState } from '../game/session/runtime-state.ts';

import { createRunActivity } from '../game/session/activity.ts';

import {
  createProfileFoundation,
  createProfileProgress,
  createProfileEquipment,
} from '../game/progression/profile-state.ts';

import { createNativeServices, type PreparedLighting } from '../presentation/native-services.ts';

import { createPresentationState } from '../presentation/state.ts';

import { syncCollectionProgress } from '../game/progression/collection-progress.ts';

import { SUPPORTER_FILM_ITEM } from '../game/content/items.ts';
import { type GameEdition } from '../platform/editions.ts';

import { PREMIUM_FILM } from '../platform/premium.ts';

import type { Item } from '../game/content/items.ts';

import { createLifecycle } from '../platform/lifecycle.ts';

import { createRunState } from '../game/run-state.ts';

import { createSecondaryMotion } from '../rendering/figures/secondary-motion.ts';

import type { ResultReveal } from '../ui/screens/run-results.ts';

import { createWeatherState } from '../rendering/scene/weather-state.ts';
import { createPlayerAnimation } from '../game/player/player.ts';

import { createPalette } from '../rendering/palette.ts';

import { loadStatistics, loadSetup, loadUnlocks, loadEquipment } from '../platform/saves.ts';
import { createItems } from '../game/content/items.ts';

import { store, isTestProfile } from '../platform/storage.ts';

import { readRunCheckpoint } from '../platform/run-checkpoint.ts';
import type { SceneSurface } from '../rendering/scene-surface.ts';

/** Construct one runtime's explicit records and browser services before domain wiring. */
export function createRuntimeFoundation(
  surfaces: ReadonlyMap<string, SceneSurface>,
  lighting: PreparedLighting | undefined,
  ports: { readonly edition: GameEdition; readonly saveSettings: () => void },
) {
  const lifecycle = createLifecycle();
  if (surfaces) for (const surface of surfaces.values()) lifecycle.add(surface.dispose);
  const nativeScene = surfaces.get('c')?.native;
  if (!nativeScene) throw new Error('A prepared WebGL2 scene is required');
  function $(id: 'c' | 'prevC' | 'supportPreview'): HTMLCanvasElement;
  function $(id: 'bAgain'): HTMLButtonElement;
  function $(id: string): HTMLElement;
  function $(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error('Missing game element ' + id);
    return el;
  }
  function context2d(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D unavailable');
    return context;
  }
  const cvs = $('c'),
    mainG = nativeScene;
  let g = mainG;
  const {
    memorySnapshot,
    reclaimMemory,
    prepareFigureArtwork,
    environmentRenderer,
    demonRealmRenderer,
    inkCharm,
    inkCompanion,
    inkEnemy,
    inkPlayer,
    inkSword,
    lightingRig,
    uiMaterialLighting,
  } = createNativeServices(cvs.ownerDocument, lifecycle, lighting, nativeScene);
  const R = Math.random;
  const browserPreferences = createRuntimePreferences({
    lifecycle,
    storage: store,
    edition: ports.edition,
  });
  const {
    settings,
    systemMotion,
    reducedMotion,
    reducedFlashes,
    buzz,
    combatHaptics,
    edition,
    premiumAccess,
    accessible,
    density,
    ambientDensity,
    grassDensity,
    weatherDensity,
    graphics,
    frameRate: graphicsFrameRate,
    frameMetrics,
  } = browserPreferences;
  const FONT = '"Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif';
  const PZ = 0.78;
  const geometry = createPresentationGeometry();
  const { layout } = geometry;
  const palette = createPalette();
  const cols = (fog: number) => palette.fog(fog, geometry.MIST);
  const ITEMS = [
    ...createItems(() => new Set([...UNL].filter((id) => id !== PREMIUM_FILM))),
    SUPPORTER_FILM_ITEM,
  ];
  const ITEM_BY: Record<string, Item> = {};
  for (const it of ITEMS) ITEM_BY[it.id] = it;
  const robePal = palette.robe;
  const profileServices = {
    store,
    loadStatistics,
    loadSetup,
    loadUnlocks,
    loadEquipment,
    premiumAccess,
    accessible,
    isTestProfile,
  };
  const profileFoundation = createProfileFoundation(profileServices);
  const { SETUP, UNL, DAILY_LOGIN, TRIAL_PROGRESS, playerStats } = profileFoundation;
  const activity = createRunActivity(R, playerStats.roninWave);
  const {
    META,
    AWAKENING,
    COLLECTION_PROGRESS,
    saveAwakening,
    saveCollections,
    saveMeta,
    ARMORY_SEEN,
  } = createProfileProgress(profileServices, () => profileFoundation.ST, SETUP, UNL);
  const syncCollections = () => {
    if (!activity.activeTrial && !activity.activeDaily && !['title'].includes(G.state))
      syncCollectionProgress(COLLECTION_PROGRESS, META, profileFoundation.ST, G);
  };
  const sessionState = createRuntimeSessionState<ResultReveal>(
    META,
    SETUP,
    premiumAccess(),
    readRunCheckpoint,
  );
  const saveStats = () => {
    if (!activity.activeTrial && !activity.activeDaily) {
      syncCollections();
      saveCollections();
      store.set('issen.stats', profileFoundation.ST);
    }
  };
  const profileEquipment = createProfileEquipment(profileServices, UNL, ITEMS);
  const { revoked, accessibleUnlocks, playerEquipment, savedFilm, savedEquipment } =
    profileEquipment;
  const { SEALS, sealState, applySeal } = createSealPresentation(() => profileEquipment.EQ, $);
  const stageState = createStageState(R);
  const { stageVisits, previewVisits } = stageState;
  const WX = createWeatherState(() => 0.5);
  const { audio, audioInit, tn, sfx, guided, setMuteIcon } = createRuntimeAudio({
    $,
    settings,
    lifecycle,
    storage: store,
    get phase() {
      return G.state;
    },
    get saveSettings() {
      return ports.saveSettings;
    },
  });
  const presentationState = createPresentationState();
  const G = createRunState(store.get('issen.hints', {}));
  const P = createPlayerAnimation();
  const apparelMotion = createSecondaryMotion();
  const effectQuality = graphics;
  const sceneState = createSceneState();
  return {
    lifecycle,
    browser: {
      prepareFigureArtwork,
      memorySnapshot,
      reclaimMemory,
      $,
      context2d,
      cvs,
      mainG,
      g,
      nativeScene,
      environmentRenderer,
      demonRealmRenderer,
      inkCharm,
      inkCompanion,
      inkEnemy,
      inkPlayer,
      inkSword,
      lightingRig,
      uiMaterialLighting,
      browserPreferences,
      settings,
      systemMotion,
      reducedMotion,
      reducedFlashes,
      buzz,
      combatHaptics,
      edition,
      premiumAccess,
      accessible,
      density,
      ambientDensity,
      grassDensity,
      weatherDensity,
      graphics,
      graphicsFrameRate,
      frameMetrics,
      audio,
      audioInit,
      tn,
      sfx,
      guided,
      setMuteIcon,
    },
    profile: {
      profileServices,
      profileFoundation,
      profileEquipment,
      SETUP,
      UNL,
      DAILY_LOGIN,
      TRIAL_PROGRESS,
      playerStats,
      META,
      AWAKENING,
      COLLECTION_PROGRESS,
      saveAwakening,
      saveCollections,
      saveMeta,
      ARMORY_SEEN,
      ITEMS,
      ITEM_BY,
      revoked,
      accessibleUnlocks,
      playerEquipment,
      savedFilm,
      savedEquipment,
      syncCollections,
      saveStats,
    },
    run: { G, P, activity, sessionState, WX, sceneState },
    view: {
      R,
      FONT,
      PZ,
      geometry,
      layout,
      palette,
      cols,
      robePal,
      SEALS,
      sealState,
      applySeal,
      stageState,
      stageVisits,
      previewVisits,
      presentationState,
      apparelMotion,
      effectQuality,
    },
  };
}
