import type { EventBus, GameEvents } from '../game/events.ts';
import { DANG } from '../shared/directions.ts';
import type { StandoffViews } from '../game/phases/standoff.ts';
export type StandoffFeedbackViews = Pick<StandoffViews,
  'W' | 'H' | 'S' | 'addSlash' | 'killFx' | 'scraps' | 'ring' | 'stamp' |
  'punch' | 'flash' | 'sfx' | 'combatHaptics'>;
/** Successful challenger feedback consumes immutable values and cosmetic ports. */
export function bindStandoffFeedback(events: EventBus<GameEvents>, readViews: () => StandoffFeedbackViews) {
  return events.on('standoffResolved', event => {
    if (!event.won) return;
    const { W, H, S, addSlash, killFx, scraps, ring, stamp, punch, flash, sfx, combatHaptics } = readViews();
    const cx = event.x, cy = event.y, h = event.height, a = DANG[event.direction];
    const v: [number, number] = [Math.cos(a), Math.sin(a)], M = Math.max(W, H) * 1.3, sc = h / 160;
      addSlash(cx - v[0] * M, cy - v[1] * M, cx + v[0] * M, cy + v[1] * M, Math.max(3, 3 * S), 0.6);
      killFx(cx, cy, a + Math.PI / 2, sc);
      scraps(cx, cy, 10, sc);
      ring(cx, cy, h * 0.1, h * 1.3, 0.5, Math.max(2, 3 * S));
      stamp('一閃', W / 2, H * 0.3, Math.max(56, 80 * S), true, 1.4);
      punch(1.08, cx, cy);
      flash(0.4);
      sfx.perfect();
      combatHaptics.play('slice');
  });
}
