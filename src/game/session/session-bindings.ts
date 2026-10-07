import { createCheckpointFlow, type CheckpointFlowViews } from './checkpoint-flow.ts';
import { createRunStart, type RunStartViews } from './run-start.ts';
import { createTrialSession, type TrialSessionViews } from './trials.ts';
import { createResultsSession, type ResultsViews } from './results.ts';
import { createRunFlow, type RunFlowViews } from './run-flow.ts';
export type SessionBindingViews<Pose extends object, Reveal> = CheckpointFlowViews & RunStartViews<Pose, Reveal> & TrialSessionViews & ResultsViews & RunFlowViews<Pose>;
/** Shared capabilities; factories are invoked at their original construction points. */
export function createSessionBindings<Pose extends object, Reveal>(readViews: () => SessionBindingViews<Pose, Reveal>) {
  return {
    checkpoint: () => createCheckpointFlow(readViews()),
    runStart: () => createRunStart(readViews()),
    trial: () => createTrialSession(readViews),
    results: () => createResultsSession(readViews),
    runFlow: () => createRunFlow(readViews()),
  };
}
