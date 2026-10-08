import type { EventBus, GameEvents } from '../events.ts';
import { completeTrial, grantTrialRewards, type TrialProgress } from './trials.ts';
/** Trial persistence owns only persistent completion/unlock records and storage. */
export function bindTrialProgression(events: EventBus<GameEvents>, read: () => {
  readonly TRIAL_PROGRESS: TrialProgress;
  readonly UNL: Set<string>;
  readonly store: { set(key: string, value: unknown): boolean };
}) {
  return events.on('trialSettlement', event => {
    if (!event.passed) return;
    const v = read();
    completeTrial(v.TRIAL_PROGRESS, event.id);
    v.store.set('issen.trials', v.TRIAL_PROGRESS);
    grantTrialRewards(v.TRIAL_PROGRESS, v.UNL);
    v.store.set('issen.unlocks', [...v.UNL]);
  });
}
