import type { EventBus, GameEvents } from '../game/events.ts';

export interface WaveInputFeedbackViews {
  readonly pop: (x: number, y: number, text: string) => void;
  readonly sfx: { glint(): void; whoosh(): void };
  readonly knifeTrail: (event: GameEvents['knifeHit']) => void;
  readonly sparks: (x: number, y: number, count: number) => void;
  readonly buzz: (duration: number) => void;
  readonly hud: (visible: boolean) => void;
}

/** Input reactions use frozen geometry and cosmetic ports, without run/RNG access. */
export function bindWaveInputFeedback(events: EventBus<GameEvents>, readViews: () => WaveInputFeedbackViews) {
  const offSwipe = events.on('swipeCue', event => {
    const { pop, sfx } = readViews();
    if (event.kind === 'mirror') { pop(0, 0, '鏡'); sfx.glint(); }
    else sfx.whoosh();
  });
  const offKnife = events.on('knifeHit', event => {
    const { knifeTrail, sparks, sfx, buzz, hud } = readViews();
    knifeTrail(event);
    sparks(event.x, event.y - event.height * 0.55, 10);
    sfx.whoosh();
    buzz(8);
    hud(true);
  });
  return () => { offKnife(); offSwipe(); };
}
