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


/** Knife kills settle their original profile counter and save through value events. */
export function bindKnifeProgression(
  events: EventBus<GameEvents>,
  readViews: () => { readonly ST: Statistics; readonly saveStats: () => void },
) {
  return events.on('knifeHit', () => {
    const { ST, saveStats } = readViews();
    ST.kills++;
    saveStats();
  });
}


/** Wave profile milestones settle at preparation/committed entry without run/RNG access. */
export function bindWaveProgression(
  events: EventBus<GameEvents>,
  readViews: () => EncounterProgressionViews & {
    readonly saveStats: () => void; readonly checkUnlocks: () => void;
  },
) {
  const offPrepared = events.on('wavePrepared', event => {
    const { ST } = readViews();
    if (event.wave >= 9 && !event.zen && !event.lostLife && !ST.flawless) ST.flawless = 1;
  });
  const offReached = events.on('waveReached', event => {
    const { ST, bst, challenge, saveStats, checkUnlocks } = readViews(), n = event.wave;
    if (!event.zen) {
      if (event.blade) ST.bladeWave = Math.max(ST.bladeWave || 0, n);
      if (!event.lostLife) ST.flawlessWave = Math.max(ST.flawlessWave || 0, n);
      const blade = bst();
      if (blade) {
        blade.w = Math.max(blade.w, n);
        if (event.mode === 'ronin') blade.rw = Math.max(blade.rw, n);
      }
      challenge('w', n);
      if (event.mode === 'ronin') challenge('rw', n);
      ST.bestWave = Math.max(ST.bestWave, n);
      if (event.mode === 'ronin') ST.roninWave = Math.max(ST.roninWave, n);
      ST.furthestStage = Math.max(ST.furthestStage, Math.floor((n - 1) / 3));
    }
    saveStats();
    checkUnlocks();
  });
  return () => { offReached(); offPrepared(); };
}
