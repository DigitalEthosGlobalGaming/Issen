import { parseRunCheckpoint, type RunCheckpoint } from './run-checkpoint.ts';
import type { RewardSettlement } from '../game/progression/run-rewards.ts';
export interface PendingSupportReward {
  id: string;
  hundredths: number;
  reward: RewardSettlement;
  checkpoint: RunCheckpoint;
}
export function parsePendingSupport(value: unknown): PendingSupportReward | null {
  if (!value || typeof value !== 'object') return null;
  const saved = value as Partial<PendingSupportReward>;
  const checkpoint = parseRunCheckpoint(saved.checkpoint);
  if (
    !checkpoint ||
    typeof saved.id !== 'string' ||
    !/^[a-f0-9-]{36}$/.test(saved.id) ||
    !Number.isSafeInteger(saved.hundredths) ||
    saved.hundredths! <= 0 ||
    !saved.reward ||
    ![saved.reward.before, saved.reward.after, saved.reward.gained].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    )
  )
    return null;
  return { id: saved.id, hundredths: saved.hundredths!, reward: saved.reward, checkpoint };
}
