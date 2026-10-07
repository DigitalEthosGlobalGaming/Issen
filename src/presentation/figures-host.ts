import { createFiguresPresentation, type FigureViews } from './figures.ts';
import { createPlayerFigures, type PlayerFigureViews } from './player-figures.ts';
import { createCuePresentation, type CueViews } from './cues.ts';
export type FigureHostViews =
  Omit<FigureViews, 'time' | 'wind'> &
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
  } = createFiguresPresentation(() => {
    const { g, inkCharm, inkCompanion, inkEnemy, inkPlayer, inkSword, presentationState, G, W, H, cols, R, density, reducedMotion, reducedFlashes, robePal, accessible, EQ, SEAL, FONT } = readViews();
    return ({
    g,
    inkCharm,
    inkCompanion,
    inkEnemy,
    inkPlayer,
    inkSword,
    time: presentationState.time,
    wind: presentationState.wind,
    G,
    W,
    H,
    cols,
    R,
    density,
    reducedMotion,
    reducedFlashes,
    robePal,
    accessible,
    EQ,
    SEAL,
    FONT,
  });
  });
  const playerFigures = createPlayerFigures(() => {
    const { G, L, g, presentationState, EQ, H, W, P, apparelMotion, playerRobePalette, isRobeSp, bladeStyle, CHARMCOL, petOf } = readViews();
    return ({
    G,
    L,
    g,
    presentationState,
    EQ,
    H,
    W,
    drawPetAt,
    P,
    drawFigure,
    apparelMotion,
    playerRobePalette,
    isRobeSp,
    bladeStyle,
    CHARMCOL,
    petOf,
  });
  });
  const { drawEnso, drawGlyphs } = createCuePresentation(() => {
    const { g, presentationState, SEAL, SEALARC, FONT, pz, G, waveConfiguration, liveOrdered, WX } = readViews();
    return ({
    g,
    time: presentationState.time,
    SEAL,
    SEALARC,
    FONT,
    pz,
    G,
    ordered: () => waveConfiguration().ordered,
    liveOrdered,
    veil: WX.veil,
  });
  });
  return { figureRenderer, drawFigure, drawSplit, drawPetAt, drawSword, drawGlint, tipOf, drawEnemy, drawBoss, playerFigures, drawEnso, drawGlyphs };
}
