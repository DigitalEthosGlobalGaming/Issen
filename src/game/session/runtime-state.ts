import { templateModifiers, type MetaProgress } from '../progression/meta.ts';
import { createRunRewardLedger } from '../progression/run-rewards.ts';
import type { Setup } from '../../platform/saves.ts';
import type { RunCheckpoint } from '../../platform/run-checkpoint.ts';
/** Mutable run lifetime metadata is plain data, separate from serialized combat records. */
export function createRuntimeSessionState<Reveal>(
  meta: MetaProgress,
  setup: Setup,
  premium: boolean,
  readCheckpoint: () => RunCheckpoint | null,
) {
  return {
    runTemplate: templateModifiers(meta, setup, premium),
    rewardLedger: createRunRewardLedger(),
    runBossMilestone: 0,
    runItemReveals: [] as Reveal[],
    savedRun: readCheckpoint(),
    shrineOfferIds: null as string[] | null,
    hitStop: 0,
    timeScale: 1,
    knocks: 0,
    rewardFlowBusy: false,
    loginCrestRevealed: false,
  };
}
