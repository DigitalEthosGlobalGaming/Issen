import type { DeathViews } from '../phases/death.ts';
import type { Enemy } from '../combat/enemy.ts';
import type { Direction } from '../../shared/directions.ts';

export type CompanionRevivalViews = Pick<DeathViews,
  'events' | 'G' | 'breakCombo' | 'captureCheckpoint' | 'startBoss' | 'startWave' | 'timeScale'>;
/** Companion revival restarts the current encounter using existing plain run fields. */
export function createCompanionRevival(readViews: () => CompanionRevivalViews) {
  function reviveDaruma(ph = false, support = false) {
    const views = readViews();
    const { G, breakCombo, captureCheckpoint, startBoss, startWave } = views;
    if (!support) {
      if (ph) G.phoenixUsed = true;
      else G.darumaUsed = true;
    }
    views.timeScale = 1;
    breakCombo();
    G.pStreak = 0;
    if (!G.zen && !G.hard)
      G.lives = support ? Math.max(1, Math.ceil(G.maxLives / 2)) : ph ? G.maxLives : 1;
    const inBoss = G.diedInBoss;
    G.enemies = [];
    G.attacker = null;
    G.pendingSpawns = [];
    G.so = null;
    if (inBoss) {
      G.boss = null;
      G.bossCount--;
      startBoss();
    } else startWave(G.wave, true);
    if (support) {
      G.lives = Math.max(1, Math.ceil(G.maxLives / 2));
      captureCheckpoint();
    }
    views.events.emit('revived', {
      kind: support ? 'support' : ph ? 'phoenix' : 'daruma', lives: G.lives,
    });
  }
  return reviveDaruma;
}

export function visiblePet(equipment: Readonly<{ pet: string; robe: string }>) {
  return equipment.pet === 'nopet' && equipment.robe === 'scarecrow' ? 'crow' : equipment.pet;
}
export interface FoxfireViews {
  readonly events: DeathViews['events'];
  killEnemy(enemy: Enemy, direction: Direction, chained: boolean): void;
}
export function saveWithFoxfire(e: Enemy, views: FoxfireViews) {
  e.p = 0.5;
  views.killEnemy(e, e.dir, true);
  views.events.emit('companionSaved', { kind: 'foxfire', x: 0, y: 0 });
}
