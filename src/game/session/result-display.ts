import type { RunState } from '../run-state.ts';
import type { ModeRecord } from '../progression/statistics.ts';
import type { RewardSettlement } from '../progression/run-rewards.ts';
import type { ResultReveal } from '../../ui/screens/run-results.ts';
export interface ResultDisplay {
  readonly run: Readonly<
    Pick<
      RunState,
      | 'mode'
      | 'blade'
      | 'zen'
      | 'hard'
      | 'rush'
      | 'score'
      | 'maxCombo'
      | 'wave'
      | 'runTime'
      | 'reason'
      | 'runBlade'
      | 'bossesSlain'
      | 'hits'
      | 'kills'
      | 'perfects'
    >
  > & { readonly newUnlocks: readonly Readonly<RunState['newUnlocks'][number]>[] };
  readonly record: Readonly<ModeRecord>;
  readonly newBest: boolean;
  readonly stageName: string;
  readonly reward: Readonly<RewardSettlement>;
  readonly upgradesEnabled: boolean;
}
export interface ResultSequence {
  readonly id: number;
  readonly reward: Readonly<RewardSettlement>;
  readonly reveals: readonly Readonly<ResultReveal>[];
  readonly bonus: boolean;
  readonly extraEmbers: number;
}
export function resultDisplay(
  run: RunState,
  record: ModeRecord,
  newBest: boolean,
  stageName: string,
  reward: RewardSettlement,
  upgradesEnabled: boolean,
): ResultDisplay {
  const {
    mode,
    blade,
    zen,
    hard,
    rush,
    score,
    maxCombo,
    wave,
    runTime,
    reason,
    runBlade,
    bossesSlain,
    hits,
    kills,
    perfects,
  } = run;
  return Object.freeze({
    run: Object.freeze({
      mode,
      blade,
      zen,
      hard,
      rush,
      score,
      maxCombo,
      wave,
      runTime,
      reason,
      runBlade,
      bossesSlain,
      hits,
      kills,
      perfects,
      newUnlocks: Object.freeze(run.newUnlocks.map((x) => Object.freeze({ ...x }))),
    }),
    record: Object.freeze({ ...record }),
    newBest,
    stageName,
    reward: Object.freeze({ ...reward }),
    upgradesEnabled,
  });
}
