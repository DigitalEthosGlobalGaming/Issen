import type { EventBus, GameEvents } from '../game/events.ts';
import { STAGES } from '../game/content/stages.ts';

export interface StandoffCueViews {
  readonly banner: (glyph: string, label: string) => void;
  readonly setWaveLabel: (label: string) => void;
  readonly letterbox: (duration: number) => void;
  readonly clearLetterbox: () => void;
  readonly hint: (key: string, text: string, duration?: number) => void;
  readonly flash: (amount: number) => void;
  readonly sfx: { drum(): void; step(): void; glint(): void };
}
/** Challenger entry and transition feedback has no combat or random capability. */
export function bindStandoffCues(events: EventBus<GameEvents>, read: () => StandoffCueViews) {
  const offStart = events.on('standoffStarted', event => {
    const v = read(), stage = STAGES[event.stage]!;
    v.banner('挑', event.changed ? `A challenger in the ${stage.n.toLowerCase()}` : 'A challenger blocks the road');
    v.setWaveLabel('挑');
    v.letterbox(99);
    v.sfx.drum();
    v.hint('standoff', 'A standoff. Stay still. The instant he draws, cut the way his blade points. Moving early is death.', 6500);
  });
  const offCue = events.on('standoffCue', event => {
    const v = read();
    if (event.kind === 'step') v.sfx.step();
    else if (event.kind === 'draw') { v.sfx.glint(); v.flash(0.2); }
    else v.clearLetterbox();
  });
  return () => { offCue(); offStart(); };
}
