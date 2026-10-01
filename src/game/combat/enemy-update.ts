import { clamp } from '../../shared/math.ts';
import { EPOSE, approachPose } from '../../rendering/figures/model.ts';
import type { Enemy, EnemyPosition } from './enemy.ts';
import { deathDuration } from '../../rendering/figures/death.ts';
export interface EnemyUpdateState {
  enemies: Enemy[];
  freezeT: number;
  state: string;
  attacker: Enemy | null;
  combo: number;
  bless: ReadonlySet<string>;
  slowT: number;
  petT: number;
  foxUsed: boolean;
  so: { e: Enemy; fired: boolean; done: boolean } | null;
  m: { hazard: number; suzu: number; foxfire: number };
}
export interface EnemyUpdateEnvironment {
  surge: number;
  time: number;
  perfectZone: () => number;
  pet: string;
  sounds: { bell: () => void; feint: () => void; bark: () => void };
  foxSave: (enemy: Enemy) => void;
  playerDie: (enemy: Enemy, reason: 'late') => void;
  position: (enemy: Enemy) => EnemyPosition;
  rawDelta?: number;
}
export function updateEnemies(G: EnemyUpdateState, dt: number, env: EnemyUpdateEnvironment) {
  const {
    surge,
    time,
    perfectZone: pz,
    sounds: sfx,
    pet,
    foxSave,
    playerDie,
    position: enemyPos,
  } = env;
  for (const e of G.enemies) {
    if (e.state === 'dying') e.shadowTime = (e.shadowTime ?? 0) + (env.rawDelta ?? dt);
    e.t +=
      dt *
      (e.state === 'attack' && G.freezeT > 0
        ? 0
        : e.state === 'attack' && surge > 0
          ? 1 + 0.4 * G.m.hazard
          : 1);
    e.life += dt;
    if (e.glint > 0 && !(G.so && G.so.e === e && G.so.fired && !G.so.done))
      e.glint = Math.max(0, e.glint - dt * 3);
    if (e.state === 'enter' && e.t >= 0.9) {
      e.state = 'idle';
      e.t = 0;
    }
    let shown: keyof typeof EPOSE =
      e.state === 'enter' && e.t < 0.55 ? 'guard' : e.fake && !e.switched ? e.fake : e.dir;
    if (G.state === 'title') shown = 'guard';
    if (e.challenger && e.state === 'idle') shown = G.so && G.so.fired ? e.dir : 'guard';
    let tgt = EPOSE[shown],
      rate = 9;
    if (e.state === 'attack') {
      e.p = e.t / e.T;
      if (G.m.suzu && e.fake && !e.switched && !e.rang && e.p >= e.feintAt - 0.12) {
        e.rang = true;
        sfx.bell();
      }
      if (
        e === G.attacker &&
        !e.still &&
        G.bless.has('still') &&
        e.p >= pz() &&
        G.state === 'playing'
      ) {
        e.still = true;
        G.slowT = 0.45;
      }
      if (e.fake && !e.switched && e.p >= e.feintAt) {
        e.switched = true;
        e.snap = 0.12;
        sfx.feint();
        if (pet === 'shiba') {
          sfx.bark();
          G.petT = 0.6;
        }
      }
      if (e.p >= 1 && G.state === 'playing') {
        if (G.m.foxfire && !G.foxUsed) {
          G.foxUsed = true;
          foxSave(e);
        } else playerDie(e, 'late');
      }
    }
    if (e.state === 'strike') {
      tgt = EPOSE.down;
      rate = 28;
      if (e.zen && e.t > 0.4) {
        e.state = 'fade';
        e.t = 0;
      }
    }
    if (e.state === 'dying' && e.deathType && e.deathType !== 'split') {
      tgt = EPOSE.down;
      rate = 5;
    }
    if (e.snap > 0) {
      rate = 32;
      e.snap -= dt;
    }
    approachPose(e.pose, tgt, 1 - Math.exp(-dt * rate));
    if ((e.flinch ?? 0) > 0) e.flinch = Math.max(0, (e.flinch ?? 0) - dt * 2.2);
    if (e.challenger) e.lean *= Math.exp(-dt * 8);
    else {
      let ln = 0;
      const fear = e.state === 'idle' ? clamp((G.combo - 10) / 20) : 0;
      if (e.fake && !e.switched && e.state !== 'enter') {
        const ph = (time * 0.8 + e.d.seed) % 1;
        ln +=
          Math.sin(time * 40 + e.d.seed) * 0.004 +
          (ph < 0.18 ? Math.sin((ph / 0.18) * Math.PI) * 0.024 : 0);
      }
      ln -= 0.035 * (e.flinch || 0);
      ln += Math.sin(time * 23 + e.d.seed * 3) * 0.005 * fear;
      e.lean = ln;
    }
    e.pos = enemyPos(e);
  }
  G.enemies = G.enemies.filter(
    (e) =>
      !(e.state === 'dying' && e.t >= deathDuration(e.deathType)) &&
      !(e.state === 'fade' && e.t >= 0.5),
  );
}
