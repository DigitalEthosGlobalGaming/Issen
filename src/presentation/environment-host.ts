import { createEnvironmentState } from './environment-state.ts';
import { createEnvironmentArtwork, type EnvironmentArtworkViews } from './environment-artwork.ts';
import { createEnvironmentPresentation, type EnvironmentViews } from './environment.ts';
import { createDriftRenderer } from '../rendering/scene/drift-renderer.ts';
export type EnvironmentHostViews =
  Pick<EnvironmentArtworkViews, 'W' | 'H' | 'DPR' | 'S' | 'L' | 'R' | 'density' | 'context2d'> &
  Pick<EnvironmentViews, 'activeTrial' | 'G' | 'L' | 'reducedMotion' | 'g' | 'cinematic' | 'WX'> & {
    readonly presentationState: { readonly time: number; readonly wind: number };
  };
/** Per-game scenery state, cached artwork and drawing share one explicit binding owner. */
export function createEnvironmentHost(ownerDocument: Document, lifecycle: { add(cleanup: () => void): void }, readViews: () => EnvironmentHostViews) {
  const environmentState = createEnvironmentState();
  const {
    buildBG,
    buildMist,
    buildGrass,
    newLeaf,
    buildLeaves,
    gustLeaves,
    buildWeatherArtwork,
    rebalanceWeather,
  } = createEnvironmentArtwork(ownerDocument, () => {
    const { W, H, DPR, S, G, L, R, density, context2d } = readViews();
    return ({
    W,
    H,
    DPR,
    S,
    stage: G.stage,
    environmentState,
    L,
    R,
    density,
    context2d,
    ambient,
  });
  });

  /* ---------------- ambient ---------------- */

  const driftRenderer = createDriftRenderer();

  lifecycle.add(driftRenderer.dispose);
  const {
    ambient,
    blades,
    drawLeaves,
    weatherRenderer,
    drawWeather,
    drawSmoke,
    updateAmbient,
    updateTransition,
  } = createEnvironmentPresentation(() => {
    const { activeTrial, G, W, H, S, L, R, density, reducedMotion, g, presentationState, cinematic, WX } = readViews();
    return ({
    environmentState,
    activeTrial,
    previewDemon: environmentState.previewDemon,
    G,
    W,
    H,
    S,
    L,
    R,
    density,
    driftRenderer,
    reducedMotion,
    g,
    fg: environmentState.fg,
    time: presentationState.time,
    wind: presentationState.wind,
    leaves: environmentState.leaves,
    wx: environmentState.wx,
    bamboo: environmentState.bamboo,
    cinematic,
    cinematicWeather: environmentState.cinematicWeather,
    WX,
    smokeSprite: environmentState.smokeSprite,
  });
  });
  return { environmentState, driftRenderer, buildBG, buildMist, buildGrass, newLeaf, buildLeaves, gustLeaves, buildWeatherArtwork, rebalanceWeather, ambient, blades, drawLeaves, weatherRenderer, drawWeather, drawSmoke, updateAmbient, updateTransition };
}
