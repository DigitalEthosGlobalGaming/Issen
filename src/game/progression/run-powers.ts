/** Run-local charges never change the purchased ranks in the saved profile. */
export function protectCombo(run: { combo: number; composure: number }): boolean {
  if (run.combo <= 0 || run.composure <= 0) return false;
  run.composure--;
  return true;
}

/** Called once per cleared ordinary wave, never for a jump, boss or standoff. */
export function recoverAfterWave(run: {
  wavesCleared: number;
  recoveryEvery: number;
  zen: boolean;
  hard: boolean;
  lives: number;
  maxLives: number;
}): boolean {
  run.wavesCleared++;
  if (
    !run.recoveryEvery ||
    run.wavesCleared % run.recoveryEvery !== 0 ||
    run.zen ||
    run.hard ||
    run.lives >= run.maxLives
  )
    return false;
  run.lives++;
  return true;
}
