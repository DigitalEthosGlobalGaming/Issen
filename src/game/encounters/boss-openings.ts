import { DIRS, OPP } from '../../shared/directions.ts';
import type { Random } from '../../shared/random.ts';
import type { Boss } from './boss.ts';

export function chainLength(count: number, mode: string, random: Random = Math.random): number {
  if (mode === 'ronin') count++;
  if (count <= 1) return 1;
  if (count === 2) return 2;
  return (count <= 4 ? 2 : 3) + (random() < 0.5 ? 1 : 0);
}
export function bossShownDirection(boss: Boss) {
  return boss.def.mirror ? OPP[boss.sdir] : boss.sdir;
}
export function parryOpening(
  boss: Boss,
  input: { count: number; mode: string; chainModifier: number; counter: boolean },
  random: Random = Math.random,
): { second: boolean; counterDamage: boolean } {
  boss.glint = 0;
  const second = !!(boss.def.twin && !boss.twinDone);
  if (second) {
    boss.twinDone = true;
    boss.state = 'windup';
    boss.t = 0;
    boss.dur = boss.bp.wind * 0.45;
    return { second, counterDamage: false };
  }
  boss.twinDone = false;
  boss.state = 'stagger';
  boss.t = 0;
  boss.sdir = DIRS[(random() * 4) | 0]!;
  boss.chainLen = Math.max(1, chainLength(input.count, input.mode, random) + input.chainModifier);
  boss.chainLeft = boss.chainLen;
  boss.window = boss.bp.stag;
  boss.blockT = 0;
  boss.kageUsed = 0;
  const counterDamage = input.counter && boss.hp > 1;
  if (counterDamage) boss.hp--;
  return { second, counterDamage };
}
