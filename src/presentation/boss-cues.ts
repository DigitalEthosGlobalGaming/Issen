import type { EventBus, GameEvents } from '../game/events.ts';
import { kanji, roman } from '../shared/format.ts';
export interface BossCueViews {
  readonly S: number;
  readonly banner: (glyph: string, label: string) => void;
  readonly setBossLabels: (wave: string, glyph: string, name: string) => void;
  readonly renderHp: () => void;
  readonly showBossBar: (shown: boolean) => void;
  readonly setScore: () => void;
  readonly pop: (x: number, y: number, text: string, size?: number) => void;
  readonly flash: (amount: number) => void;
  readonly sfx: { drum(): void; glint(): void; deflect(): void };
  readonly hint: (key: string, text: string, duration?: number) => void;
  readonly notifications: { readonly activeHint: string | null };
  readonly hideHint: () => void;
}
/** Duel entry, health, warning and tutorial feedback consumes frozen values. */
export function bindBossCues(events: EventBus<GameEvents>, read: () => BossCueViews) {
  const offEntry = events.on('bossEntered', e => {
    const v = read(), name = e.name + (e.lap ? ' ' + roman(e.lap + 1) : '');
    v.banner(e.glyph, name);
    v.setBossLabels(e.rush ? `決闘 ${kanji(e.wave)}` : '決闘', e.glyph, name);
  });
  const offHealth = events.on('bossHealth', () => read().renderHp());
  const offStart = events.on('bossReady', () => { const v = read(); v.showBossBar(true); v.sfx.drum(); });
  const offTraits = events.on('bossTraits', e => {
    const v = read();
    if (e.twin) v.hint('twin', 'The Twin Fang strikes twice. Parry both glints.', 4500);
    if (e.spear) v.hint('spear', 'The spear gives less warning. Watch the tip.', 4500);
    if (e.mirror) v.hint('mirror', 'The Mirror never feints. Cut opposite to his arrow and blade.', 5000);
  });
  const offCue = events.on('bossCue', e => {
    const v = read();
    if (e.kind === 'draw') { v.sfx.glint(); v.flash(.14); return; }
    if (e.kind === 'return') { v.pop(e.x, e.y - e.height * 1.25, '返し', Math.max(20, 26 * v.S)); return; }
    if (e.kind === 'recovered') { v.setScore(); v.pop(e.x, e.y - e.height * 1.05, 'Recovered'); return; }
    if (e.kind === 'deflected') v.setScore();
    v.sfx.deflect();
    v.pop(e.x, e.y - e.height * 1.05, e.kind === 'afterimage' ? 'Afterimage' : 'Deflected');
  });
  const offOpening = events.on('bossOpening', e => {
    const v = read();
    if (e.kind !== 'parry' && v.notifications.activeHint === 'parry') v.hideHint();
    if (e.kind === 'parry') v.hint('parry', e.mirror ? 'An opening. Swipe opposite to his arrow and blade.' : 'An opening. Swipe the way his blade points.', 3000);
    else if (e.kind === 'chain') v.hint('chain', e.mirror ? 'He blocked. Keep swiping opposite to his arrow and blade.' : 'He blocked. Keep swiping the way his blade points.', 3500);
  });
  return () => { offOpening(); offCue(); offTraits(); offStart(); offHealth(); offEntry(); };
}
