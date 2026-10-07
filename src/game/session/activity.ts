import type { TrialDefinition } from '../content/trials.ts';
import type { DailyRun } from '../progression/daily.ts';
import type { TrialOutcome } from './trials.ts';
import { restorableRng } from '../../shared/random.ts';
import { trialsUnlocked } from '../progression/trials.ts';
/** Mutable session metadata stays separate from checkpoint-compatible combat records. */
export function createRunActivity(random: () => number, roninWave: number) {
  return {
    activeTrial: null as TrialDefinition | null,
    activeDaily: null as DailyRun | null,
    trialFailure: '',
    trialResult: null as TrialOutcome | null,
    combatRandom: random,
    runRandom: restorableRng(0),
    runTrialsWasUnlocked: trialsUnlocked(roninWave),
  };
}
