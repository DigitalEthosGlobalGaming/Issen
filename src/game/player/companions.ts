import type { DeathViews } from '../phases/death.ts';
import type { Enemy } from '../combat/enemy.ts';
import type { Direction } from '../../shared/directions.ts';

export type CompanionRevivalViews = Pick<
  DeathViews,
  | 'G'
  | 'S'
  | 'banner'
  | 'breakCombo'
  | 'captureCheckpoint'
  | 'flash'
  | 'hud'
  | 'renderLives'
  | 'setScore'
  | 'stamp'
  | 'startBoss'
  | 'startWave'
  | 'clearLetterbox'
  | 'resetPlayer'
  | 'inkPulse'
  | 'timeScale'
>;
/** Companion revival restarts the current encounter using existing plain run fields. */
export function createCompanionRevival(readViews: () => CompanionRevivalViews) {
  function reviveDaruma(ph = false, support = false) {
    const views = readViews();
    const {
      G,
      S,
      banner,
      breakCombo,
      captureCheckpoint,
      flash,
      hud,
      renderLives,
      setScore,
      stamp,
      startBoss,
      startWave,
      clearLetterbox,
      resetPlayer,
      inkPulse,
    } = views;
    if (!support) {
      if (ph) G.phoenixUsed = true;
      else G.darumaUsed = true;
    }
    views.timeScale = 1;
    clearLetterbox();
    resetPlayer();
    breakCombo();
    G.pStreak = 0;
    if (!G.zen && !G.hard)
      G.lives = support ? Math.max(1, Math.ceil(G.maxLives / 2)) : ph ? G.maxLives : 1;
    renderLives();
    setScore();
    hud(true);
    inkPulse(0);
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
      renderLives();
      captureCheckpoint();
      banner('起', 'Second Wind');
    } else if (ph) banner('鳳凰', 'Rise from the ashes');
    else banner('達磨', 'Seven times down, eight times up');
    stamp(ph ? '鳳' : '起', 0, 0, Math.max(60, 86 * S), true, 1.6);
    flash(0.5, '255,240,220');
  }
  return reviveDaruma;
}

export function visiblePet(equipment: Readonly<{ pet: string; robe: string }>) {
  return equipment.pet === 'nopet' && equipment.robe === 'scarecrow' ? 'crow' : equipment.pet;
}
export interface FoxfireViews {
  killEnemy(enemy: Enemy, direction: Direction, chained: boolean): void;
  pop(x: number, y: number, text: string): void;
  flash(amount: number, colour: string): void;
  sfx: { glint(): void };
}
export function saveWithFoxfire(e: Enemy, views: FoxfireViews) {
  e.p = 0.5;
  views.killEnemy(e, e.dir, true);
  views.pop(0, 0, '狐火');
  views.flash(0.25, '150,200,255');
  views.sfx.glint();
}
