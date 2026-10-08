import { STAGES } from '../content/stages.ts';
import type { RunState } from '../run-state.ts';

const activeStates = new Set<RunState['state']>([
  'playing',
  'boss',
  'between',
  'standoff',
  'shrine',
  'paused',
]);
const encounterVisit = (ordinal: number, rush: boolean) =>
  Math.floor((ordinal - 1) / (rush ? 1 : 3));

/** Shared by encounter entry and background prediction; never consumes randomness. */
export function encounterScenery(ordinal: number, rush = false) {
  const visit = encounterVisit(ordinal, rush);
  return { stage: visit % STAGES.length, lap: Math.floor(visit / STAGES.length) };
}

/** Trials retain their scene; cinematic choices and inactive runs have no known next visit. */
export function predictNextStage(
  run: Pick<RunState, 'state' | 'wave' | 'stage' | 'rush'>,
  trial: boolean,
  cinematic: boolean,
): number | undefined {
  if (
    trial ||
    cinematic ||
    !activeStates.has(run.state) ||
    !Number.isSafeInteger(run.wave) ||
    run.wave < 1
  )
    return undefined;
  const visit = encounterVisit(run.wave, run.rush);
  if (visit % STAGES.length !== run.stage) return undefined;
  return (visit + 1) % STAGES.length;
}
