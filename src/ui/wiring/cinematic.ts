import { createCinematic } from '../screens/cinematic.ts';
import {
  recordSecretEvent,
  reconcileCinematicCompanion,
} from '../../game/progression/secret-events.ts';
import { createWeatherState } from '../../rendering/scene/weather-state.ts';
import { STAGES } from '../../game/content/stages.ts';
import { store } from '../../platform/storage.ts';
import type { Equipment } from '../../platform/saves.ts';
import type { Statistics } from '../../game/progression/statistics.ts';
import type { RunState } from '../../game/run-state.ts';
import type { Item, ItemCategory } from '../../game/content/items.ts';
import type { EnvironmentState } from '../../presentation/environment-state.ts';
import type { createStageVisitSeeds } from '../../rendering/environment/stage-variation.ts';
import type { parseSettings } from '../../platform/settings.ts';
import type { createLifecycle } from '../../platform/lifecycle.ts';

export interface CinematicViews {
  readonly $: (id: string) => HTMLElement;
  readonly G: RunState;
  readonly ST: Statistics;
  readonly EQ: Equipment;
  readonly UNL: Set<string>;
  readonly ITEMS: Item[];
  readonly settings: ReturnType<typeof parseSettings>;
  readonly cvs: HTMLCanvasElement;
  readonly lifecycle: ReturnType<typeof createLifecycle>;
  readonly environmentState: EnvironmentState;
  readonly previewVisits: ReturnType<typeof createStageVisitSeeds>;
  readonly palette: { clearFog: () => void };
  stageSeed: number;
  MIST: number[];
  readonly buildLeaves: () => void;
  readonly buildBG: () => void;
  readonly buildMist: () => void;
  readonly buildGrass: () => void;
  readonly buildWeather: (resetSimulation?: boolean) => void;
  readonly prepareScene: () => void;
  readonly setupAttract: () => void;
  readonly accessible: (id: string) => boolean;
  readonly saveStats: () => void;
  readonly toast: (item: { k: string; msg?: string; n?: string; type?: ItemCategory }) => void;
}

/** Viewer state and grade remain separate from the live run and equipment. */
export function createCinematicWiring(views: CinematicViews) {
  const {
    $,
    G,
    previewVisits,
    environmentState,
    buildLeaves,
    palette,
    buildBG,
    buildMist,
    buildGrass,
    buildWeather,
    prepareScene,
    setupAttract,
    settings,
    ITEMS,
    accessible,
    UNL,
    saveStats,
    toast,
    cvs,
    lifecycle,
  } = views;
  let cinematicStage = 0;
  let cinematicStageSeed = views.stageSeed;
  let cinematicFilm = views.EQ.film;
  function previewStage(stage: number, newVisit = true) {
    if (newVisit) views.stageSeed = previewVisits.enter(stage, true);
    environmentState.previewDemon = stage === STAGES.length;
    G.stage = environmentState.previewDemon ? 0 : stage;
    buildLeaves();
    views.MIST = environmentState.previewDemon ? [80, 66, 85] : STAGES[stage]!.fog;
    palette.clearFog();
    environmentState.prevBg = null;
    environmentState.stageFade = 0;
    buildBG();
    buildMist();
    buildGrass();
    buildWeather(false);
    Object.assign(
      environmentState.cinematicWeather,
      createWeatherState(() => 0.5),
    );
    prepareScene();
    if (newVisit) setupAttract();
  }
  const cinematic = createCinematic($('app'), {
    canOpen: () => G.state === 'title' && !G.panel,
    stage: () => G.stage,
    scenes: [...STAGES.map((stage) => stage.n), 'Demon'],
    bindings: () => settings.bindings,
    film: () => views.EQ.film,
    films: () =>
      ITEMS.filter((item) => item.type === 'film' && accessible(item.id) && UNL.has(item.id)),
    enter(stage) {
      if (recordSecretEvent(views.ST, { kind: 'cinematic' })) saveStats();
      if (reconcileCinematicCompanion(views.ST, UNL)) {
        store.set('issen.unlocks', [...UNL]);
        toast({ k: '石', msg: 'Unlocked: Mystic Rock companion' });
      }
      cinematicStage = G.stage;
      cinematicStageSeed = views.stageSeed;
      cinematicFilm = views.EQ.film;
      previewStage(stage);
    },
    scene: previewStage,
    leave: () => {
      cvs.dataset.debris = 'sprites';
      views.stageSeed = cinematicStageSeed;
      previewStage(cinematicStage, false);
      setupAttract();
    },
    grade: (value) => {
      cinematicFilm = value;
    },
  });
  lifecycle.add(cinematic.dispose);
  // Graphics borrows stage preparation only, avoiding viewer rewards and visit RNG.
  let graphicsOrigin: { stage: number; seed: number } | undefined;
  function syncGraphicsShowcase() {
    const data = cvs.ownerDocument.documentElement.dataset;
    const active = data.graphicsOpen === 'true' && G.state === 'title' && !cinematic.active;
    if (active === !!graphicsOrigin) return;
    data.graphicsShowcase = String(active);
    if (active) {
      graphicsOrigin = { stage: G.stage, seed: views.stageSeed };
      views.stageSeed = 0x49535345;
      previewStage(3, false);
    } else if (graphicsOrigin) {
      const origin = graphicsOrigin;
      graphicsOrigin = undefined;
      views.stageSeed = origin.seed;
      if (!lifecycle.disposed) previewStage(origin.stage, false);
    }
  }
  const graphicsObserver = new MutationObserver(syncGraphicsShowcase);
  graphicsObserver.observe(cvs.ownerDocument.documentElement, {
    attributes: true,
    attributeFilter: ['data-graphics-open'],
  });
  lifecycle.add(() => {
    graphicsObserver.disconnect();
    cvs.ownerDocument.documentElement.dataset.graphicsShowcase = 'false';
  });
  const logo = document.querySelector<HTMLElement>('#title .t-k')!;
  lifecycle.listen(logo, 'keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      cinematic.open();
    }
  });
  const sceneFilm = () => (cinematic.active ? cinematicFilm : views.EQ.film);

  return {
    cinematic,
    sceneFilm,
    previewStage,
    /** Read-only original scene identity retained while the viewer changes visits. */
    get savedStageSeed() {
      return cinematicStageSeed;
    },
  };
}
