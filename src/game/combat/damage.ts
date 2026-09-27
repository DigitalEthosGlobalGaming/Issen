export interface DamageState {
  zen: boolean;
  hard: boolean;
  bless: ReadonlySet<string>;
  wardUsed: boolean;
  runWards: number;
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
  if (!run.zen && !ward && run.runWards <= 0 && !run.hard && run.lives > 1) {
    run.lives--;
    run.lostLife = true;
    run.scars = (run.scars || 0) + 1;
    return hurt(run.lives === 1 ? 'Last life' : 'Life lost', false, true);
  }
  if (!run.zen && !run.hard && run.lives === 1 && !ward && run.runWards <= 0) run.lives = 0;
  if (run.zen) {
    if (ward) run.wardUsed = true;
    return hurt(ward ? 'Warded' : null, ward);
  }
  if (ward || run.runWards > 0) {
    if (ward) run.wardUsed = true;
    else run.runWards--;
    return hurt('Warded');
  }
  return { kind: 'death' };
}
