import type { EventBus, GameEvents } from '../../game/events.ts';
import { TRIALS } from '../../game/content/trials.ts';
export interface TrialFeedbackViews {
  readonly banner: (glyph: string, text: string) => void;
  readonly setWaveLabel: (text: string) => void;
  readonly renderTrialObjective: () => void;
  readonly sfx: { unlock(): void };
  readonly buildLeaves: () => void;
  readonly audio: { setPaused(paused: boolean): void };
  readonly hideTrialObjective: () => void;
  readonly openPanel: (panel: 'trials') => void;
  readonly focusTrialResult: () => void;
}
/** Trial UI and cosmetic restoration react at the existing synchronous boundaries. */
export function bindTrialFeedback(events: EventBus<GameEvents>, read: () => TrialFeedbackViews) {
  const offEncounter = events.on('trialEncounter', event => {
    const v = read(), trial = TRIALS.find(t => t.id === event.id)!;
    v.banner('試練', trial.waveCount ? `${trial.name} · Wave ${event.wave}/${trial.waveCount}` : trial.name);
    v.setWaveLabel(trial.waveCount ? `Wave ${event.wave}/${trial.waveCount}` : 'Trials');
    v.renderTrialObjective();
  });
  const offSettlement = events.on('trialSettlement', event => { if (event.passed) read().sfx.unlock(); });
  const offLeaves = events.on('trialLeavesReset', () => read().buildLeaves());
  const offAudio = events.on('trialAudioReset', () => read().audio.setPaused(false));
  const offObjective = events.on('trialObjectiveHidden', () => read().hideTrialObjective());
  const offMenu = events.on('trialMenuReady', () => { const v = read(); v.openPanel('trials'); v.focusTrialResult(); });
  return () => { offMenu(); offObjective(); offAudio(); offLeaves(); offSettlement(); offEncounter(); };
}
