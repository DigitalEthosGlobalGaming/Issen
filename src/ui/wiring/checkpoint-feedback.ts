import type { EventBus, GameEvents } from '../../game/events.ts';
import type { Screen } from '../../game/run-state.ts';
import { kanji } from '../../shared/format.ts';
export interface CheckpointFeedbackViews {
  readonly $: (id: string) => HTMLElement;
  readonly renderLives: () => void;
  readonly setScore: () => void;
  readonly applySeal: () => void;
  readonly hud: (on: boolean) => void;
  readonly renderHp: () => void;
  readonly toast: (message: { k: string; msg: string }) => void;
  readonly updateSavedRunButtons: () => void;
  readonly showScreen: (screen: Screen | null) => void;
}
/** Saved encounter display reacts to values after rule/profile/RNG restoration. */
export function bindCheckpointFeedback(
  events: EventBus<GameEvents>,
  read: () => CheckpointFeedbackViews,
) {
  const offRestored = events.on('checkpointRestored', (event) => {
    const v = read();
    v.renderLives();
    v.setScore();
    v.applySeal();
    v.hud(true);
    v.$('waveLbl').textContent =
      event.state === 'boss'
        ? '決闘'
        : event.state === 'standoff'
          ? '挑'
          : `第${kanji(event.wave)}陣`;
    if (event.bossName !== null) {
      v.$('bossK').textContent = event.bossGlyph;
      v.$('bossN').textContent = event.bossName;
      v.renderHp();
      v.$('bossbar').classList.toggle('on', event.bossShown);
    } else v.$('bossbar').classList.remove('on');
  });
  const offChanged = events.on('checkpointChanged', () => read().updateSavedRunButtons());
  const offFailure = events.on('checkpointSaveFailed', () =>
    read().toast({ k: '!', msg: 'Run could not be saved on this device.' }),
  );
  const offScreen = events.on('sessionScreen', (event) => read().showScreen(event.screen));
  return () => {
    offScreen();
    offFailure();
    offChanged();
    offRestored();
  };
}
