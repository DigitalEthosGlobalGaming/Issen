import type { EnvironmentState } from './environment-state.ts';
import { createAmbient } from '../rendering/scene/ambient.ts';
import { createWeatherRenderer } from '../rendering/scene/weather-draw.ts';
import { DRIFT_DENSITY } from '../rendering/scene/drift-catalog.ts';
import { STAGES } from '../game/content/stages.ts';
import type { SceneDrawing } from '../rendering/scene-drawing.ts';
import type { GrassBlade, Leaf } from '../rendering/scene/ambient.ts';
import type { WeatherParticle, Bamboo, WeatherState } from '../rendering/scene/weather-state.ts';
import type { createDriftRenderer } from '../rendering/scene/drift-renderer.ts';
import type { createLayout } from '../rendering/layout.ts';
import type { Random } from '../shared/random.ts';
import type { RunState } from '../game/run-state.ts';

export interface EnvironmentViews {
  readonly environmentState: EnvironmentState;
  readonly activeTrial: { realm?: string } | null;
  readonly previewDemon: boolean;
  readonly G: Readonly<Pick<RunState, 'stage' | 'm'>>;
  readonly W: number;
  readonly H: number;
  readonly S: number;
  readonly L: ReturnType<typeof createLayout>;
  readonly R: Random;
  readonly density: () => number;
  readonly driftRenderer: ReturnType<typeof createDriftRenderer>;
  readonly reducedMotion: () => boolean;
  readonly g: SceneDrawing;
  readonly fg: GrassBlade[];
  readonly time: number;
  readonly wind: number;
  readonly leaves: Leaf[];
  readonly wx: WeatherParticle[];
  readonly bamboo: Bamboo[];
  readonly cinematic: { readonly active: boolean };
  readonly cinematicWeather: WeatherState;
  readonly WX: WeatherState;
  readonly smokeSprite: HTMLCanvasElement | null;
}

/** Ambient geometry and weather drawing; gameplay weather hazards update separately. */
export function createEnvironmentPresentation(readViews: () => EnvironmentViews) {
  function ambient() {
    const {
      activeTrial,
      previewDemon,
      G,
      W,
      H,
      S,
      L,
      R,
      density,
      driftRenderer,
      environmentState,
      time,
    } = readViews();
    const stage = activeTrial?.realm === 'demon' || previewDemon ? STAGES.length : G.stage;
    return createAmbient({
      width: W,
      height: H,
      scale: S,
      layout: L,
      random: R,
      density: density() * (DRIFT_DENSITY[stage] ?? 1),
      stage,
      time,
      motion: environmentState.leafMotion,
      drawLeaves: (g, leaves, front, motion, spriteMotion) =>
        driftRenderer.drawLeaves(g, {
          leaves,
          front,
          motion,
          spriteMotion,
          scale: S,
          width: W,
          height: H,
        }),
      spriteMotion: true,
    });
  }
  const snowGrass = new WeakMap<GrassBlade[], GrassBlade[]>();
  const demonGrass = new WeakMap<GrassBlade[], GrassBlade[]>();
  function blades(list: GrassBlade[], t: number, snowTips = false, demonic = false) {
    const { fg, g, reducedMotion, wind, density } = readViews();
    let visible = list;
    if (snowTips) {
      let cached = snowGrass.get(list);
      if (!cached) {
        cached = list
          .filter((_, index) => index % 9 === 0)
          .map((blade) => ({
            ...blade,
            h: blade.h * 0.17,
            w: blade.w * 0.6,
          }));
        snowGrass.set(list, cached);
      }
      visible = cached;
    }
    if (demonic) {
      let cached = demonGrass.get(list);
      if (!cached) {
        const foreground = list === fg;
        cached = list
          .filter((_, index) => !foreground || index % 2 === 0)
          .map((blade, index) => ({
            ...blade,
            h: blade.h * (foreground ? 0.28 : 0.65),
            w: blade.w * 0.7,
            col: index % 5 === 0 ? 'rgba(164,145,122,.65)' : 'rgba(86,71,64,.8)',
          }));
        demonGrass.set(list, cached);
      }
      visible = cached;
    }
    ambient().blades(
      g,
      visible,
      demonic && reducedMotion() ? 0 : t,
      demonic && reducedMotion() ? 1 : wind,
      list === fg ? 12 : -12,
      density(),
    );
  }
  function drawLeaves(front: boolean) {
    const { g, leaves } = readViews();
    ambient().drawLeaves(g, leaves, front);
  }
  function weatherRenderer() {
    const {
      g,
      G,
      W,
      H,
      S,
      time,
      wind,
      wx,
      bamboo,
      cinematic,
      cinematicWeather,
      WX,
      smokeSprite,
      driftRenderer,
    } = readViews();
    return createWeatherRenderer(g, {
      weather: STAGES[G.stage]!.weather,
      width: W,
      height: H,
      scale: S,
      time,
      wind,
      hazard: G.m.hazard,
      particles: wx,
      bamboo,
      state: cinematic.active ? cinematicWeather : WX,
      smokeSprite,
      drawEmber: driftRenderer.drawEmber,
    });
  }
  function drawWeather() {
    weatherRenderer().drawWeather();
  }
  function drawSmoke() {
    weatherRenderer().drawSmoke();
  }

  function updateAmbient(dt: number) {
    const { environmentState, W, time, wind } = readViews();
    for (const m of environmentState.mists) {
      m.x += m.v * (0.5 + wind * 0.5) * dt;
      if (m.x - m.w / 2 > W) m.x = -m.w / 2;
    }
    ambient().updateLeaves(environmentState.leaves, dt, time, wind);
  }
  function updateTransition(raw: number) {
    const { environmentState } = readViews();
    if (environmentState.stageFade > 0) {
      environmentState.stageFade = Math.max(0, environmentState.stageFade - raw / 1.3);
      if (!environmentState.stageFade) environmentState.prevBg = null;
    }
  }
  return {
    ambient,
    blades,
    drawLeaves,
    weatherRenderer,
    drawWeather,
    drawSmoke,
    updateAmbient,
    updateTransition,
  };
}
