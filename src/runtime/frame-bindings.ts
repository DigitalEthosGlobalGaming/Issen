import { createLightSources } from '../presentation/light-sources.ts';
import { createFrameSimulation, type FrameSimulationViews } from './frame-simulation.ts';
import { createFrameLoop } from '../platform/frame-loop.ts';
import {
  createPostPreparation,
  type PostPreparationViews,
} from '../presentation/post-preparation.ts';
import { createPostPresentation, type PostViews } from '../presentation/post.ts';
import { createRuntimeScene, type SceneViews } from '../presentation/scene.ts';
import {
  advancePresentationClock,
  advancePresentationCamera,
  type PresentationState,
} from '../presentation/state.ts';
import { updatePlayerAnimation, type createPlayerAnimation } from '../game/player/player.ts';
import { updateWeather as simulateWeather } from '../rendering/scene/weather-update.ts';
import { STAGES } from '../game/content/stages.ts';
import type { EnvironmentState } from '../presentation/environment-state.ts';
import type { createWeatherState } from '../rendering/scene/weather-state.ts';
import type { createAudio } from '../audio/audio.ts';
import type { createEffectQuality } from '../rendering/effects/quality.ts';
import type { createPostArtwork } from '../presentation/post-artwork.ts';
import type { createScreenAnimation } from '../ui/screen-animation.ts';
import type { createEnvironmentPresentation } from '../presentation/environment.ts';
import type { createPlayerFigures } from '../presentation/player-figures.ts';
import type { Random } from '../shared/random.ts';
import { cacheView, stateView } from '../game/session/state-view.ts';
import { sampleAssetBackground } from '../platform/asset-background.ts';

const gameplayStates = ['playing', 'boss', 'between', 'standoff', 'shrine', 'dead'];
const backgroundQuietStates = ['title', 'over', 'between', 'shrine', 'paused'];

type SimulationPorts = Omit<
  FrameSimulationViews,
  | 'updateWeather'
  | 'updatePlayer'
  | 'advanceClock'
  | 'advanceCamera'
  | 'presentationState'
  | 'audio'
  | 'WX'
  | 'guided'
>;
type ScenePorts = Omit<
  SceneViews,
  | 'time'
  | 'zoom'
  | 'zoomX'
  | 'zoomY'
  | 'previewDemon'
  | 'mistSprite'
  | 'mists'
  | 'mid'
  | 'fg'
  | 'drawPlayer'
  | 'drawPet'
  | 'drawFoxfire'
  | 'drawPost'
>;
type PostPorts = Omit<PostViews, 'time' | 'grainPats' | 'vig' | 'inkEdge' | 'lb' | 'flashCol'>;
type PreparationPorts = Omit<PostPreparationViews, 'time' | 'fx' | 'signals'>;
export type FrameBindingViews = SimulationPorts &
  ScenePorts &
  PostPorts &
  PreparationPorts & {
    readonly P: ReturnType<typeof createPlayerAnimation>;
    readonly presentationState: PresentationState;
    readonly environmentState: EnvironmentState;
    readonly WX: ReturnType<typeof createWeatherState>;
    readonly audio: ReturnType<typeof createAudio>;
    readonly guided: FrameSimulationViews['guided'] & { readonly frozen: boolean };
    readonly postArtwork: ReturnType<typeof createPostArtwork>;
    readonly playerFigures: ReturnType<typeof createPlayerFigures>;
    readonly screenAnimation: ReturnType<typeof createScreenAnimation>;
    readonly effectQuality: ReturnType<typeof createEffectQuality>;
    readonly ambient: ReturnType<typeof createEnvironmentPresentation>['ambient'];
    readonly rebalanceWeather: () => void;
    readonly armory: { readonly inspectionExpanded: boolean };
    readonly combatRandom: Random;
    readonly flash: Parameters<typeof simulateWeather>[3]['flash'];
    readonly sfx: Parameters<typeof simulateWeather>[3]['sounds'];
    readonly gustLeaves: Parameters<typeof simulateWeather>[3]['gustLeaves'];
    readonly drawPreview: () => void;
    readonly settlePresentedScene: () => void;
    hitStop: number;
    readonly timeScale: number;
  };

/** Owns frame dispatch, prepared drawing and scheduling through current narrow views. */
export function createFrameBindings(
  readViews: () => FrameBindingViews,
  lightSources = createLightSources(),
) {
  // The parent is a lifetime live view. Overrides keep dynamic selections as getters.
  function frameView<Ports extends object>(ports: Ports) {
    return cacheView(() => {
      const parent = readViews();
      const keys = (Object.keys(parent) as (keyof FrameBindingViews)[]).filter(
        (key) => !Object.hasOwn(ports, key),
      );
      return stateView(parent, keys, ports);
    });
  }
  function updatePlayer(dt: number) {
    const { P, G } = readViews();
    updatePlayerAnimation(P, dt, G.state === 'dead' || G.state === 'over');
  }
  function updateWeather(dt: number) {
    const {
      G,
      cinematic,
      environmentState,
      WX,
      W,
      H,
      S,
      presentationState,
      L,
      R,
      combatRandom,
      flash,
      sfx,
      gustLeaves,
    } = readViews();
    simulateWeather(
      cinematic.active ? environmentState.cinematicWeather : WX,
      environmentState.wx,
      dt,
      {
        weather: STAGES[G.stage]!.weather,
        phase: G.state,
        width: W,
        height: H,
        scale: S,
        wind: presentationState.wind,
        time: presentationState.time,
        hazard: G.m.hazard,
        layout: L,
        random: R,
        hazardRandom: cinematic.active ? R : combatRandom,
        flash,
        sounds: sfx,
        gustLeaves,
        onShake: (amount) => {
          presentationState.shake = Math.max(presentationState.shake, amount);
        },
      },
    );
  }

  const frameSimulation = createFrameSimulation(
    frameView({
      updatePlayer,
      updateWeather,
      advanceClock: (dt: number) => advancePresentationClock(readViews().presentationState, dt),
      advanceCamera: (raw: number) => advancePresentationCamera(readViews().presentationState, raw),
    }),
  );
  let presentationChanged = false;
  let presentationElapsed = 0;
  let preparedFrame: ReturnType<typeof preparePresentation> | undefined;
  function update(dt: number, raw: number) {
    frameSimulation.update(dt, raw);
    presentationChanged = true;
  }
  const postPreparation = createPostPreparation(
    frameView({
      get fx() {
        return readViews().presentationState.fx;
      },
      get time() {
        return readViews().presentationState.time;
      },
      get signals() {
        return readViews().presentationState;
      },
    }),
  );
  const { advancePost, preparePresentation } = postPreparation;
  const drawPost = createPostPresentation(
    frameView({
      get time() {
        return readViews().presentationState.time;
      },
      get grainPats() {
        return readViews().postArtwork.grainPats;
      },
      get vig() {
        return readViews().postArtwork.vig;
      },
      get inkEdge() {
        return readViews().postArtwork.inkEdge;
      },
      get lb() {
        return readViews().presentationState.lb;
      },
      get flashCol() {
        return readViews().presentationState.flashCol;
      },
    }),
  );
  function drawPlayer() {
    readViews().playerFigures.drawPlayer();
  }
  function drawPet() {
    readViews().playerFigures.drawPet();
  }
  function drawFoxfire() {
    readViews().playerFigures.drawFoxfire();
  }
  const drawScene = createRuntimeScene(
    frameView({
      get time() {
        return readViews().presentationState.time;
      },
      get zoom() {
        return readViews().presentationState.zoom;
      },
      get zoomX() {
        return readViews().presentationState.zoomX;
      },
      get zoomY() {
        return readViews().presentationState.zoomY;
      },
      get previewDemon() {
        return readViews().environmentState.previewDemon;
      },
      get mistSprite() {
        return readViews().environmentState.mistSprite;
      },
      get mists() {
        return readViews().environmentState.mists;
      },
      get mid() {
        return readViews().environmentState.mid;
      },
      get fg() {
        return readViews().environmentState.fg;
      },
      drawPlayer,
      drawPet,
      drawFoxfire,
      drawPost,
    }),
    lightSources,
  );
  function render(raw: number) {
    const { G, armory, settlePresentedScene } = readViews();
    // Only the opaque inspection dialog covers the scene completely.
    if (G.panel === 'armory' && armory.inspectionExpanded) return;
    presentationElapsed = Math.min(0.05, presentationElapsed + raw);
    if (!preparedFrame || presentationChanged || frameRate() === 60) {
      preparedFrame = preparePresentation(presentationElapsed);
      presentationElapsed = 0;
      presentationChanged = false;
    }
    drawScene(preparedFrame);
    settlePresentedScene();
  }
  const frameLoop = createFrameLoop(
    {
      get hitStop() {
        return readViews().hitStop;
      },
      set hitStop(value) {
        readViews().hitStop = value;
      },
      get slowT() {
        return readViews().G.slowT;
      },
      set slowT(value) {
        readViews().G.slowT = value;
      },
      get timeScale() {
        return readViews().timeScale;
      },
    },
    {
      maxFps: frameRate,
      maxUpdateFps: () => 60,
      clockReset: () => {
        presentationElapsed = 0;
        presentationChanged = false;
        preparedFrame = undefined;
      },
      demand: () => {
        const { cinematic, screenAnimation, G, armory } = readViews();
        return cinematic.active
          ? { update: true, render: true, afterRender: false }
          : screenAnimation.demand(G.panel === 'armory' && armory.inspectionExpanded);
      },
      paused: () => {
        const { G, guided } = readViews();
        return G.state === 'paused' || guided.frozen;
      },
      update,
      render,
      afterRender: () => {
        const { G, drawPreview } = readViews();
        if (G.panel === 'armory') drawPreview();
      },
      sampleFrame: (interval, work) => {
        const {
          sceneLoading,
          G,
          effectQuality,
          ambient,
          environmentState,
          density,
          rebalanceWeather,
        } = readViews();
        sampleAssetBackground(
          G.stage,
          !sceneLoading && !G.panel && backgroundQuietStates.includes(G.state),
          work,
          1000 / frameRate(),
        );
        if (sceneLoading) return;
        if (G.panel || ['title', 'over', 'paused'].includes(G.state) || document.hidden) return;
        if (!effectQuality.sample(interval, work)) return;
        ambient().balanceLeaves(environmentState.leaves);
        if (Math.abs(environmentState.weatherDensity - density()) >= 0.09) rebalanceWeather();
      },
    },
  );
  function frameRate() {
    const { G, cinematic, guided } = readViews();
    return !G.panel && !cinematic.active && !guided.frozen && gameplayStates.includes(G.state)
      ? 120
      : 60;
  }
  return {
    frameLoop,
    update,
    render,
    drawScene,
    postPreparation,
    advancePost,
    preparePresentation,
    updatePlayer,
    updateWeather,
    drawPost,
  };
}
