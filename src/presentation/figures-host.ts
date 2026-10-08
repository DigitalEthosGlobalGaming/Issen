import { createFiguresPresentation, type FigureViews } from './figures.ts';
import { createPlayerFigures, type PlayerFigureViews } from './player-figures.ts';
import { createCuePresentation, type CueViews } from './cues.ts';
import { cacheView, stateView } from '../game/session/state-view.ts';
export type FigureHostViews = Omit<FigureViews, 'time' | 'wind'> &
  Omit<PlayerFigureViews, 'drawPetAt' | 'drawFigure'> &
  Omit<CueViews, 'time' | 'veil' | 'ordered'> & {
    readonly presentationState: { readonly time: number; readonly wind: number };
    readonly WX: { readonly veil: number };
    readonly waveConfiguration: () => { readonly ordered: boolean };
  };
/** Figure and combat-cue bindings expose only read-only current rule views. */
export function createFiguresHost(readViews: () => FigureHostViews) {
  const {
    figureRenderer,
    drawFigure,
    drawSplit,
    drawPetAt,
    drawSword,
    drawGlint,
    tipOf,
    drawEnemy,
    drawBoss,
  } = createFiguresPresentation(
    cacheView(() =>
      stateView(
        readViews(),
        [
          'g',
          'inkCharm',
          'inkCompanion',
          'inkEnemy',
          'inkPlayer',
          'inkSword',
          'G',
          'W',
          'H',
          'cols',
          'R',
          'density',
          'reducedMotion',
          'reducedFlashes',
          'robePal',
          'accessible',
          'EQ',
          'SEAL',
          'FONT',
        ],
        {
          get time() {
            return readViews().presentationState.time;
          },
          get wind() {
            return readViews().presentationState.wind;
          },
        },
      ),
    ),
  );
  const playerFigures = createPlayerFigures(
    cacheView(() =>
      stateView(
        readViews(),
        [
          'G',
          'L',
          'g',
          'presentationState',
          'EQ',
          'H',
          'W',
          'P',
          'apparelMotion',
          'playerRobePalette',
          'isRobeSp',
          'bladeStyle',
          'CHARMCOL',
          'petOf',
        ],
        { drawPetAt, drawFigure },
      ),
    ),
  );
  const { drawEnso, drawGlyphs } = createCuePresentation(
    cacheView(() =>
      stateView(readViews(), ['g', 'SEAL', 'SEALARC', 'FONT', 'pz', 'G', 'liveOrdered'], {
        get time() {
          return readViews().presentationState.time;
        },
        ordered: () => readViews().waveConfiguration().ordered,
        get veil() {
          return readViews().WX.veil;
        },
      }),
    ),
  );
  return {
    figureRenderer,
    drawFigure,
    drawSplit,
    drawPetAt,
    drawSword,
    drawGlint,
    tipOf,
    drawEnemy,
    drawBoss,
    playerFigures,
    drawEnso,
    drawGlyphs,
  };
}
