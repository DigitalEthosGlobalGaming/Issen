import type { Modifiers } from '../equipment/modifiers.ts';
export interface ScoreContext {
  mode: string;
  blade: boolean;
  hard: boolean;
  event: string | null;
  scars?: number;
  m: Pick<Modifiers, 'score' | 'bladeScore' | 'scarScore'>;
}
export function comboMultiplier(
  combo: number,
  modifiers: Pick<Modifiers, 'comboCap' | 'comboStep'>,
): number {
  return Math.min(modifiers.comboCap, 1 + Math.floor(combo / modifiers.comboStep) * 0.5);
}
export function scoreGain(points: number, run: ScoreContext): number {
  return Math.round(
    points *
      (run.mode === 'ronin' ? 2 : 1) *
      (run.blade ? 1.5 : 1) *
      run.m.score *
      (run.event === 'blood' ? 2 : 1) *
      (run.hard ? 1.5 : 1) *
      (run.blade ? run.m.bladeScore : 1) *
      (1 + run.m.scarScore * (run.scars || 0)),
  );
}
