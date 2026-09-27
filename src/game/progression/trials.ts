import { TRIALS } from '../content/trials.ts';
import type { TrialDefinition } from '../content/trials.ts';

export const TRIAL_UNLOCK_WAVE = 10;
export interface TrialProgress {
  completed: string[];
}
export function trialsUnlocked(roninWave: number): boolean {
  return Number.isFinite(roninWave) && roninWave >= TRIAL_UNLOCK_WAVE;
}
export function parseTrialProgress(value: unknown): TrialProgress {
  const saved = value && typeof value === 'object' && 'completed' in value ? value.completed : [];
  return {
    completed: Array.isArray(saved)
      ? TRIALS.filter((trial) => saved.includes(trial.id)).map((trial) => trial.id)
      : [],
  };
}
export function trialPassed(
  trial: TrialDefinition,
  result: {
    kills: number;
    perfects: number;
    bossesSlain: number;
    failed: boolean;
  },
): boolean {
  if (result.failed) return false;
  if (trial.wave) return result.kills >= trial.wave.total && result.perfects >= trial.wave.perfects;
  return !!trial.bosses?.length && result.bossesSlain >= trial.bosses.length;
}
/** Idempotent completion; cosmetics are also reconciled at load after interrupted writes. */
export function completeTrial(progress: TrialProgress, id: string): boolean {
  if (!TRIALS.some((trial) => trial.id === id) || progress.completed.includes(id)) return false;
  progress.completed.push(id);
  return true;
}
export function grantTrialRewards(progress: TrialProgress, unlocks: Set<string>): void {
  for (const trial of TRIALS)
    if (progress.completed.includes(trial.id)) unlocks.add(trial.reward.id);
}
