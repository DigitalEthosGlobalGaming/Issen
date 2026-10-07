import type { EventBus, GameEvents } from '../events.ts';
import type { Statistics, BladeStats } from './statistics.ts';
import { recordSecretEvent } from './secret-events.ts';
export interface EncounterProgressionViews {
  readonly ST: Statistics;
  readonly bst: () => BladeStats | null;
  readonly challenge: (metric: keyof BladeStats, value?: number) => void;
}
/** Encounter profile reactions receive values and profile capabilities, never run state/RNG. */
export function bindEncounterProgression(
  events: EventBus<GameEvents>,
  readViews: () => EncounterProgressionViews,
) {
  const offParry = events.on('parry', () => {
    readViews().ST.parries++;
  });
  const offBoss = events.on('bossDefeated', (event) => {
    const { ST, bst, challenge } = readViews();
    ST.duels++;
    if (event.rush) {
      ST.rushBest = Math.max(ST.rushBest || 0, event.bossesSlain);
      if (event.blade) ST.rushBlade = (ST.rushBlade || 0) + 1;
    }
    const blade = bst();
    if (blade) blade.d++;
    challenge('d');
    if (event.mode === 'ronin') ST.roninDuels++;
    if (event.mirror) recordSecretEvent(ST, { kind: 'mirrorVictory', clean: event.clean });
    if (event.clean) ST.cleanDuels++;
    if (event.blade) ST.bladeDuels++;
  });
  const offStandoff = events.on('standoffResolved', (event) => {
    if (!event.won) return;
    const { ST, challenge } = readViews();
    ST.kills++;
    ST.standoffs++;
    challenge('k');
  });
  return () => {
    offStandoff();
    offBoss();
    offParry();
  };
}
