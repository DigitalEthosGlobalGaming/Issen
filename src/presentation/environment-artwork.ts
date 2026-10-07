import { createBackground } from '../rendering/scene/background.ts';
import { createWeatherParticles } from '../rendering/scene/weather-particles.ts';
import { STAGES } from '../game/content/stages.ts';
import type { createAmbient } from '../rendering/scene/ambient.ts';
import type { Random } from '../shared/random.ts';
import type { EnvironmentState } from './environment-state.ts';

export interface EnvironmentArtworkViews {
  readonly W: number;
  readonly H: number;
  readonly DPR: number;
  readonly S: number;
  readonly stage: number;
  readonly environmentState: EnvironmentState;
  readonly L: {
    horizonY: number;
    groundY: number;
    glows?: ReturnType<typeof createBackground>['glows'];
  };
  readonly R: Random;
  readonly density: () => number;
  readonly context2d: (canvas: HTMLCanvasElement) => CanvasRenderingContext2D;
  readonly ambient: () => ReturnType<typeof createAmbient>;
}

/** Cosmetic cache construction; no gameplay state, hazard reset or combat RNG. */
export function createEnvironmentArtwork(doc: Document, readViews: () => EnvironmentArtworkViews) {
  function buildBG() {
    const { W, H, DPR, S, stage, environmentState, L, R, density, context2d, ambient } =
      readViews();
    const result = createBackground(W, H, DPR, stage);
    environmentState.bg = result.canvas;
    L.glows = result.glows;
  }

  function buildMist() {
    const { W, H, DPR, S, stage, environmentState, L, R, density, context2d, ambient } =
      readViews();
    const st = STAGES[stage]!;
    environmentState.mistSprite = doc.createElement('canvas');
    environmentState.mistSprite.width = environmentState.mistSprite.height = 128;
    const m = context2d(environmentState.mistSprite);
    const gr = m.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${st.mist},1)`);
    gr.addColorStop(0.5, `rgba(${st.mist},.45)`);
    gr.addColorStop(1, `rgba(${st.mist},0)`);
    m.fillStyle = gr;
    m.fillRect(0, 0, 128, 128);
    environmentState.mists = [];
    for (let i = 0; i < 10; i++)
      environmentState.mists.push({
        x: R() * W,
        y: L.horizonY + R() * (L.groundY - L.horizonY + H * 0.06),
        w: W * (0.45 + R() * 0.7),
        h: H * (0.05 + R() * 0.07),
        a: 0.08 + R() * 0.13,
        v: (5 + R() * 12) * S,
      });
  }
  function buildGrass() {
    const { W, H, DPR, S, stage, environmentState, L, R, density, context2d, ambient } =
      readViews();
    const built = ambient().buildGrass(STAGES[stage]!.gl);
    environmentState.fg = built.fg;
    environmentState.mid = built.mid;
  }
  function newLeaf(anywhere: boolean) {
    const { W, H, DPR, S, stage, environmentState, L, R, density, context2d, ambient } =
      readViews();
    return ambient().newLeaf(anywhere);
  }
  function buildLeaves() {
    const { W, H, DPR, S, stage, environmentState, L, R, density, context2d, ambient } =
      readViews();
    environmentState.leaves = ambient().buildLeaves();
  }
  function gustLeaves(n: number) {
    const { W, H, DPR, S, stage, environmentState, L, R, density, context2d, ambient } =
      readViews();
    ambient().gustLeaves(environmentState.leaves, n);
  }

  function buildWeatherArtwork() {
    const { W, H, DPR, S, stage, environmentState, L, R, density, context2d, ambient } =
      readViews();
    const w = STAGES[stage]!.weather;
    environmentState.weatherDensity = density();
    const built = createWeatherParticles(w, W, H, S, R, environmentState.weatherDensity);
    environmentState.wx = built.particles;
    environmentState.bamboo = built.bamboo;
    if (w === 'smoke') {
      if (!environmentState.smokeSprite) {
        environmentState.smokeSprite = doc.createElement('canvas');
        environmentState.smokeSprite.width = environmentState.smokeSprite.height = 128;
        const m = context2d(environmentState.smokeSprite);
        const gr = m.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, 'rgba(14,12,11,1)');
        gr.addColorStop(0.55, 'rgba(14,12,11,.6)');
        gr.addColorStop(1, 'rgba(14,12,11,0)');
        m.fillStyle = gr;
        m.fillRect(0, 0, 128, 128);
      }
    }
  }
  function rebalanceWeather() {
    const { W, H, DPR, S, stage, environmentState, L, R, density, context2d, ambient } =
      readViews();
    const target = createWeatherParticles(STAGES[stage]!.weather, W, H, S, R, density());
    if (environmentState.wx.length > target.particles.length)
      environmentState.wx.length = target.particles.length;
    else if (environmentState.wx.length < target.particles.length)
      environmentState.wx.push(...target.particles.slice(environmentState.wx.length));
    environmentState.weatherDensity = density();
  }

  return {
    buildBG,
    buildMist,
    buildGrass,
    newLeaf,
    buildLeaves,
    gustLeaves,
    buildWeatherArtwork,
    rebalanceWeather,
  };
}
