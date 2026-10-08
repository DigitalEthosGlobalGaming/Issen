import type { EventBus, GameEvents } from '../../game/events.ts';
export interface RunStartFeedbackViews {
  readonly $: (id: string) => HTMLElement;
  readonly apparelMotion: { reset(): void };
  readonly presentationState: { lbT: number };
  readonly clearEffects: () => void;
  readonly clearHints: () => void;
  readonly hint: (id: string, text: string, duration: number) => void;
  readonly hud: (on: boolean) => void;
  readonly setScore: () => void;
  readonly showScreen: (screen: null) => void;
  readonly toast: (item: { k: string; msg: string }) => void;
  readonly applySeal: () => void;
  readonly audioInit: () => void;
  readonly buildLeaves: () => void;
}
/** Cosmetic resets and entry cues retain their original call boundaries. */
export function bindRunStartFeedback(
  events: EventBus<GameEvents>,
  read: () => RunStartFeedbackViews,
) {
  const offCue = events.on('runStartCue', (event) => {
    const v = read();
    switch (event.kind) {
      case 'motion':
        v.apparelMotion.reset();
        break;
      case 'effects':
        v.presentationState.lbT = 0;
        v.clearEffects();
        break;
      case 'clearHints':
        v.clearHints();
        break;
      case 'screen':
        v.showScreen(null);
        v.hud(true);
        v.$('bossbar').classList.remove('on');
        break;
      case 'score':
        v.setScore();
        break;
      case 'seal':
        v.applySeal();
        break;
      case 'audio':
        v.audioInit();
        break;
      case 'leaves':
        v.buildLeaves();
        break;
    }
  });
  const offHint = events.on('runModeHint', (event) => {
    const v = read();
    switch (event.mode) {
      case 'rush':
        v.hint(
          'rush',
          'Boss rush. Only duels, one after another, with a shrine after every victory.',
          5500,
        );
        break;
      case 'blade':
        v.hint(
          'blade',
          'No arrows. Raised high is up, held low is down, held out to a side is that side.',
          6500,
        );
        break;
      case 'zen':
        v.hint(
          'zen',
          'Endless combo. You cannot die, but every mistake breaks your chain. End the run from pause.',
          6500,
        );
        break;
    }
  });
  const offFortune = events.on('runFortune', (event) =>
    read().toast({ k: event.glyph, msg: `Omikuji: ${event.name}. ${event.description}` }),
  );
  return () => {
    offFortune();
    offHint();
    offCue();
  };
}
