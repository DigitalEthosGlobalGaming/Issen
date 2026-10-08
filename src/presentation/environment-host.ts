import { createEnvironmentState } from './environment-state.ts';
import { createEnvironmentArtwork, type EnvironmentArtworkViews } from './environment-artwork.ts';
import { createEnvironmentPresentation, type EnvironmentViews } from './environment.ts';
import { createDriftRenderer } from '../rendering/scene/drift-renderer.ts';
import { cacheView, stateView } from '../game/session/state-view.ts';
export type EnvironmentHostViews = Pick<
  EnvironmentArtworkViews,
  'W' | 'H' | 'DPR' | 'S' | 'L' | 'R' | 'density' | 'context2d'
> &
  Pick<EnvironmentViews, 'activeTrial' | 'G' | 'L' | 'reducedMotion' | 'g' | 'cinematic' | 'WX'> & {
    readonly presentationState: { readonly time: number; readonly wind: number };
  };
/** Per-game scenery state, cached artwork and drawing share one explicit binding owner. */
export function createEnvironmentHost(
  ownerDocument: Document,
  lifecycle: { add(cleanup: () => void): void },
  readViews: () => EnvironmentHostViews,
) {
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
  } = createEnvironmentArtwork(
    ownerDocument,
    cacheView(() =>
      stateView(readViews(), ['W', 'H', 'DPR', 'S', 'L', 'R', 'density', 'context2d'], {
        get stage() {
          return readViews().G.stage;
        },
        environmentState,
        get ambient() {
          return ambient;
        },
      }),
    ),
  );

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
  } = createEnvironmentPresentation(
    cacheView(() =>
      stateView(
        readViews(),
        [
          'activeTrial',
          'G',
          'W',
          'H',
          'S',
          'L',
          'R',
          'density',
          'reducedMotion',
          'g',
          'cinematic',
          'WX',
        ],
        {
          environmentState,
          driftRenderer,
          get previewDemon() {
            return environmentState.previewDemon;
          },
          get fg() {
            return environmentState.fg;
          },
          get time() {
            return readViews().presentationState.time;
          },
          get wind() {
            return readViews().presentationState.wind;
          },
          get leaves() {
            return environmentState.leaves;
          },
          get wx() {
            return environmentState.wx;
          },
          get bamboo() {
            return environmentState.bamboo;
          },
          get cinematicWeather() {
            return environmentState.cinematicWeather;
          },
          get smokeSprite() {
            return environmentState.smokeSprite;
          },
        },
      ),
    ),
  );
  return {
    environmentState,
    driftRenderer,
    buildBG,
    buildMist,
    buildGrass,
    newLeaf,
    buildLeaves,
    gustLeaves,
    buildWeatherArtwork,
    rebalanceWeather,
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
