import type { EventBus, GameEvents } from '../events.ts';
import type { Statistics } from './statistics.ts';
/** Profile reactions retain the pre-modifier save and post-modifier unlock check. */
export function bindShrineProgression(events: EventBus<GameEvents>, read: () => {
  readonly ST: Statistics; readonly saveStats: () => void; readonly checkUnlocks: () => void;
}) {
  const offCurse = events.on('shrineCurse', () => { read().ST.curses++; });
  const offRecord = events.on('shrineRecorded', event => {
    const v = read();
    if (event.tier === 1) v.ST.rares++;
    if (event.tier === 2) v.ST.curses++;
    v.ST.shrines++;
    v.saveStats();
  });
  const offChosen = events.on('shrineChosen', () => read().checkUnlocks());
  return () => { offChosen(); offRecord(); offCurse(); };
}
