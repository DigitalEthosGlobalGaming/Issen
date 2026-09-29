import type { RunState } from '../run-state.ts';

export interface BlessingTriggers {
  flourishWard: boolean;
  flourishPending: boolean;
  precisionWard: boolean;
  precisionProgress: number;
  knifeProgress: number;
  tempoUsedWave: boolean;
  tempoPending: boolean;
  stormProgress: number;
  stormCharged: boolean;
  rekindleBank: number;
  rekindleUsedWave: boolean;
}

export function createBlessingTriggers(): BlessingTriggers {
  return {
    flourishWard: false,
    flourishPending: false,
    precisionWard: false,
    precisionProgress: 0,
    knifeProgress: 0,
    tempoUsedWave: false,
    tempoPending: false,
    stormProgress: 0,
    stormCharged: false,
    rekindleBank: 0,
    rekindleUsedWave: false,
  };
}

export function startBlessingWave(run: RunState): void {
  const b = run.blessingTriggers;
  b.flourishWard = b.flourishPending;
  b.flourishPending = false;
  b.tempoUsedWave = false;
  b.tempoPending = false;
  b.rekindleBank = 0;
  b.rekindleUsedWave = false;
}

export function recordBlessingCut(
  run: RunState,
  perfect: boolean,
): {
  knife: boolean;
  precisionWard: boolean;
  stormCharged: boolean;
  rekindled: number;
} {
  const b = run.blessingTriggers;
  if (!perfect) {
    b.precisionProgress = 0;
    b.knifeProgress = 0;
    b.stormProgress = 0;
    return { knife: false, precisionWard: false, stormCharged: false, rekindled: 0 };
  }
  const hasKnifeDance = run.bless.has('knifedance') && run.maxKnives > 0;
  b.knifeProgress = hasKnifeDance ? b.knifeProgress + 1 : 0;
  const knife = hasKnifeDance && b.knifeProgress % 3 === 0 && run.knives < run.maxKnives;
  if (run.bless.has('stolentempo') && !b.tempoUsedWave) {
    b.tempoUsedWave = true;
    b.tempoPending = true;
  }
  let stormCharged = false;
  if (run.bless.has('stormcall') && !b.stormCharged && ++b.stormProgress >= 3) {
    b.stormProgress = 0;
    b.stormCharged = true;
    stormCharged = true;
  }
  let precisionWard = false;
  if (run.bless.has('oath') && !b.precisionWard && ++b.precisionProgress >= 5) {
    b.precisionProgress = 0;
    b.precisionWard = true;
    precisionWard = true;
  }
  const rekindled = run.bless.has('rekindle') && !b.rekindleUsedWave ? b.rekindleBank : 0;
  if (rekindled) {
    run.combo += rekindled;
    b.rekindleBank = 0;
    b.rekindleUsedWave = true;
  }
  return { knife, precisionWard, stormCharged, rekindled };
}

export function recordComboBreak(run: RunState, previous: number): void {
  const b = run.blessingTriggers;
  b.precisionProgress = 0;
  b.knifeProgress = 0;
  b.stormProgress = 0;
  if (run.state === 'playing' && run.bless.has('rekindle') && !b.rekindleUsedWave)
    b.rekindleBank = Math.max(b.rekindleBank, Math.floor((previous - run.combo) / 2));
}

export function nextBlessingAttacker(run: RunState): 'lightning' | 'hesitate' | null {
  const b = run.blessingTriggers;
  if (b.stormCharged) {
    b.stormCharged = false;
    return 'lightning';
  }
  if (b.tempoPending) {
    b.tempoPending = false;
    return 'hesitate';
  }
  return null;
}

export function availableWards(
  run: Pick<RunState, 'bless' | 'wardUsed' | 'runWards' | 'blessingTriggers'>,
): number {
  return (
    Number(run.bless.has('ward') && !run.wardUsed) +
    Number(run.blessingTriggers.flourishWard) +
    Number(run.blessingTriggers.precisionWard) +
    run.runWards
  );
}
