import type { RuleEvents } from '../events.ts';
import { clamp } from '../../shared/math.ts';
import { EPOSE, approachPose } from '../../shared/figure-model.ts';
import { deathDuration } from '../../shared/character-death.ts';
import type { Pose } from '../../shared/character.ts';
import type { Enemy, EnemyPosition } from './enemy.ts';
import { createStateMachine, type StateTable } from '../state-machine.ts';
import { createBehaviourRegistry } from '../behaviour-registry.ts';
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
  events: RuleEvents;
  foxSave: (enemy: Enemy) => void;
  playerDie: (enemy: Enemy, reason: 'late') => void;
  position: (enemy: Enemy) => EnemyPosition;
  rawDelta?: number;
}

export interface GruntContext {
  readonly G: EnemyUpdateState;
  readonly env: EnemyUpdateEnvironment;
  target?: Pose;
  rate?: number;
}
type GruntTable = StateTable<Enemy['state'], Enemy, GruntContext>;
function stillOpening(e: Enemy, { G, env }: GruntContext) {
  if (
    e === G.attacker &&
    !e.still &&
    G.bless.has('still') &&
    e.p >= env.perfectZone() &&
    G.state === 'playing'
  ) {
    e.still = true;
    G.slowT = 0.45;
  }
}
function missedOpening(e: Enemy, { G, env }: GruntContext) {
  if (e.p >= 1 && G.state === 'playing') {
    if (G.m.foxfire && !G.foxUsed) {
      G.foxUsed = true;
      env.foxSave(e);
    } else env.playerDie(e, 'late');
  }
}
function feintAttack(e: Enemy, context: GruntContext) {
  const { G, env } = context;
  e.p = e.t / e.T;
  if (G.m.suzu && !e.switched && !e.rang && e.p >= e.feintAt - 0.12) {
    e.rang = true;
    env.events.emit('gruntCue', { kind: 'bell' });
  }
  stillOpening(e, context);
  if (!e.switched && e.p >= e.feintAt) {
    e.switched = true;
    e.snap = 0.12;
    env.events.emit('gruntCue', { kind: 'feint' });
    if (env.pet === 'shiba') {
      env.events.emit('gruntCue', { kind: 'bark' });
      G.petT = 0.6;
    }
  }
  missedOpening(e, context);
}
function strike(e: Enemy, context: GruntContext, zen: boolean) {
  context.target = EPOSE.down;
  context.rate = 28;
  if (zen && e.t > 0.4) gruntMachine.transition(e, 'fade', context);
}
export const gruntTable: GruntTable = {
  enter: { next: (e) => (e.t >= 0.9 ? 'idle' : undefined) },
  idle: {},
  attack: {
    update(e, context) {
      e.p = e.t / e.T;
      stillOpening(e, context);
      missedOpening(e, context);
    },
  },
  strike: { update: (e, context) => strike(e, context, false) },
  dying: {
    update(e, context) {
      if (e.deathType && e.deathType !== 'split') {
        context.target = EPOSE.down;
        context.rate = 5;
      }
    },
  },
  fade: {},
};
const gruntMachine = createStateMachine<Enemy['state'], Enemy, GruntContext>(gruntTable);
export interface GruntBehaviour {
  readonly machine: ReturnType<typeof createStateMachine<Enemy['state'], Enemy, GruntContext>>;
}
const feintTable: GruntTable = {
  ...gruntTable,
  attack: { update: feintAttack },
  strike: { update: (e, context) => strike(e, context, !!e.zen) },
};
const zenTable: GruntTable = {
  ...gruntTable,
  strike: { update: (e, context) => strike(e, context, true) },
};
export const gruntBehaviours = createBehaviourRegistry<Enemy, GruntBehaviour>();
gruntBehaviours.register('feint', {
  matches: (e) => !!e.fake,
  behaviour: { machine: createStateMachine(feintTable) },
});
gruntBehaviours.register('zen', {
  matches: (e) => !!e.zen,
  behaviour: { machine: createStateMachine(zenTable) },
});
gruntBehaviours.register('still', {
  matches: (e) => !!e.still,
  behaviour: { machine: gruntMachine },
});
gruntBehaviours.register('grunt', { matches: () => true, behaviour: { machine: gruntMachine } });

export function advanceGrunts(G: EnemyUpdateState, dt: number, env: EnemyUpdateEnvironment) {
  for (const e of G.enemies) {
    if (e.state === 'dying') e.shadowTime = (e.shadowTime ?? 0) + (env.rawDelta ?? dt);
    e.t +=
      dt *
      (e.state === 'attack' && G.freezeT > 0
        ? 0
        : e.state === 'attack' && env.surge > 0
          ? 1 + 0.4 * G.m.hazard
          : 1);
    e.life += dt;
    if (e.glint > 0 && !(G.so && G.so.e === e && G.so.fired && !G.so.done))
      e.glint = Math.max(0, e.glint - dt * 3);
    // Existing pose selection precedes an attack's same-frame feint switch.
    const enteringIdle = e.state === 'enter' && e.t >= 0.9,
      shownState = enteringIdle ? 'idle' : e.state,
      shownTime = enteringIdle ? 0 : e.t;
    let shown: keyof typeof EPOSE =
      shownState === 'enter' && shownTime < 0.55 ? 'guard' : e.fake && !e.switched ? e.fake : e.dir;
    if (G.state === 'title') shown = 'guard';
    if (e.challenger && shownState === 'idle') shown = G.so && G.so.fired ? e.dir : 'guard';
    const context: GruntContext = { G, env };
    gruntBehaviours.resolve(e).behaviour.machine.update(e, context, dt);
    let target = context.target ?? EPOSE[shown],
      rate = context.rate ?? 9;
    // A damage callback can enter strike during attack update in the same frame.
    if (e.state === 'strike') {
      target = EPOSE.down;
      rate = 28;
    }
    if (e.state === 'dying' && e.deathType && e.deathType !== 'split') {
      target = EPOSE.down;
      rate = 5;
    }
    if (e.snap > 0) {
      rate = 32;
      e.snap -= dt;
    }
    approachPose(e.pose, target, 1 - Math.exp(-dt * rate));
    if ((e.flinch ?? 0) > 0) e.flinch = Math.max(0, (e.flinch ?? 0) - dt * 2.2);
    if (e.challenger) e.lean *= Math.exp(-dt * 8);
    else {
      let lean = 0;
      const fear = e.state === 'idle' ? clamp((G.combo - 10) / 20) : 0;
      if (e.fake && !e.switched && e.state !== 'enter') {
        const phase = (env.time * 0.8 + e.d.seed) % 1;
        lean +=
          Math.sin(env.time * 40 + e.d.seed) * 0.004 +
          (phase < 0.18 ? Math.sin((phase / 0.18) * Math.PI) * 0.024 : 0);
      }
      lean -= 0.035 * (e.flinch || 0);
      lean += Math.sin(env.time * 23 + e.d.seed * 3) * 0.005 * fear;
      e.lean = lean;
    }
    e.pos = env.position(e);
  }
  G.enemies = G.enemies.filter(
    (e) =>
      !(e.state === 'dying' && e.t >= deathDuration(e.deathType)) &&
      !(e.state === 'fade' && e.t >= 0.5),
  );
}
