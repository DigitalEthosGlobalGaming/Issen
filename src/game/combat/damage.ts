export interface DamageState {
  zen: boolean;
  hard: boolean;
  bless: ReadonlySet<string>;
  wardUsed: boolean;
  runWards: number;
  blessingTriggers?: { flourishWard: boolean; precisionWard: boolean };
  lives: number;
  lostLife?: boolean;
  scars?: number;
  m: { feintSafe: number };
}
export type DamageOutcome =
  { kind: 'hurt'; keepCombo: boolean; label: string | null; lifeLost: boolean } | { kind: 'death' };
export function resolveDamage(run: DamageState, reason: string): DamageOutcome {
  const hurt = (label: string | null, keepCombo = false, lifeLost = false): DamageOutcome => ({
    kind: 'hurt',
    keepCombo,
    label,
    lifeLost,
  });
  if (reason === 'feint' && run.m.feintSafe && !run.zen) return hurt('Tricked!');
  const ward = run.bless.has('ward') && !run.wardUsed;
  const flourish = !!run.blessingTriggers?.flourishWard;
  const precision = !!run.blessingTriggers?.precisionWard;
  if (
    !run.zen &&
    !ward &&
    !flourish &&
    !precision &&
    run.runWards <= 0 &&
    !run.hard &&
    run.lives > 1
  ) {
    run.lives--;
    run.lostLife = true;
    run.scars = (run.scars || 0) + 1;
    return hurt(run.lives === 1 ? 'Last life' : 'Life lost', false, true);
  }
  if (
    !run.zen &&
    !run.hard &&
    run.lives === 1 &&
    !ward &&
    !flourish &&
    !precision &&
    run.runWards <= 0
  )
    run.lives = 0;
  if (run.zen) {
    if (ward) run.wardUsed = true;
    else if (flourish) run.blessingTriggers!.flourishWard = false;
    else if (precision) run.blessingTriggers!.precisionWard = false;
    return hurt(ward || flourish || precision ? 'Warded' : null, ward || flourish || precision);
  }
  if (ward || flourish || precision || run.runWards > 0) {
    if (ward) run.wardUsed = true;
    else if (flourish) run.blessingTriggers!.flourishWard = false;
    else if (precision) run.blessingTriggers!.precisionWard = false;
    else run.runWards--;
    return hurt('Warded');
  }
  return { kind: 'death' };
}
