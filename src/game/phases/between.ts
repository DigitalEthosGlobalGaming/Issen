import { definePhase } from '../session/phase-router.ts';
import type { RunState } from '../run-state.ts';
import type { TrialDefinition } from '../content/trials.ts';
export interface BetweenViews {
  readonly G: RunState;
  readonly activeTrial: TrialDefinition | null;
  readonly trialFailure: string;
  readonly finishTrial: (message?: string) => void;
  readonly startTrialEncounter: () => void;
  readonly startBoss: () => void;
  readonly openShrine: () => void;
  readonly nextStep: () => void;
}

/** The existing inter-encounter timer selects the next trial, duel, shrine or wave. */
export function createBetweenPhase<Context>(readViews: () => BetweenViews) {
  return definePhase<Context>({
    update(_context, dt) {
      const {
        G,
        activeTrial,
        trialFailure,
        finishTrial,
        startTrialEncounter,
        startBoss,
        openShrine,
        nextStep,
      } = readViews();
      if (G.state !== 'between') return;
      G.nextT -= dt;
      if (G.nextT <= 0) {
        if (activeTrial) {
          if (trialFailure) finishTrial(trialFailure);
          else if (activeTrial.waveCount && G.wave < activeTrial.waveCount) startTrialEncounter();
          else if (activeTrial.bosses && G.bossesSlain < activeTrial.bosses.length)
            startTrialEncounter();
          else finishTrial();
        } else if (!G.afterBoss && G.wave % 3 === 0) startBoss();
        else if (G.afterBoss) {
          G.afterBoss = false;
          openShrine();
        } else nextStep();
      }
    },
  });
}
