import type { EventBus, GameEvents } from '../events.ts';
import type { Statistics, BladeStats } from './statistics.ts';

export interface CombatProgressionViews {
  readonly ST: Statistics;
  readonly bst: () => BladeStats | null;
  readonly challenge: (metric: keyof BladeStats, value?: number) => void;
  readonly checkUnlocks: () => void;
}

/** Profile reactions never receive run records or a gameplay random generator. */
export function bindCombatProgression(
  events: EventBus<GameEvents>,
  readViews: () => CombatProgressionViews,
) {
  const removeCombo = events.on('comboChanged', (event) => {
    const { ST, bst, challenge } = readViews();
    if (event.zen) ST.bestZen = Math.max(ST.bestZen, event.combo);
    else {
      ST.bestCombo = Math.max(ST.bestCombo, event.combo);
      const blade = bst();
      if (blade) blade.c = Math.max(blade.c, event.combo);
      challenge('c', event.combo);
    }
  });
  const removeKill = events.on('kill', (event) => {
    const { ST, bst, challenge, checkUnlocks } = readViews();
    ST.kills++;
    if (event.feint) ST.feintKills = (ST.feintKills || 0) + 1;
    const blade = bst();
    if (blade) blade.k++;
    challenge('k');
    if (event.perfect) {
      ST.perfects++;
      if (!event.trial) ST.bestRunPerfects = Math.max(ST.bestRunPerfects, event.runPerfects);
      if (blade) blade.p++;
      challenge('p');
      ST.bestPStreak = Math.max(ST.bestPStreak, event.pStreak);
    }
    checkUnlocks();
  });
  return () => {
    removeKill();
    removeCombo();
  };
}
