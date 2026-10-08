import type { EventBus, GameEvents } from '../../game/events.ts';
import { BLESS_BY, type BLESS } from '../../game/content/blessings.ts';
export interface ShrineFeedbackViews {
  readonly toast: (message: { k: string; msg: string }) => void;
  readonly showShrineOffers: (offers: (typeof BLESS)[number][]) => void;
  readonly hud: (on: boolean) => void;
  readonly showScreen: (screen: null) => void;
  readonly sfx: { unlock(): void };
}
/** UI reactions resolve immutable catalog IDs; they never generate offers or mutate rules. */
export function bindShrineFeedback(events: EventBus<GameEvents>, read: () => ShrineFeedbackViews) {
  const offOffers = events.on('shrineOffers', e => read().showShrineOffers(e.ids.map(id => BLESS_BY[id]!)));
  const offCurse = events.on('shrineCurse', e => {
    const curse = BLESS_BY[e.id]!;
    read().toast({ k: curse.k, msg: `Crossroads curse: ${curse.n}` });
  });
  const offTwin = events.on('shrineTwin', e => {
    read().toast({ k: '双', msg: 'Twin blessing: ' + e.ids.map(id => BLESS_BY[id]!.n).join(' and ') });
  });
  const offChosen = events.on('shrineChosen', () => { const v = read(); v.hud(true); v.showScreen(null); v.sfx.unlock(); });
  return () => { offChosen(); offTwin(); offCurse(); offOffers(); };
}
