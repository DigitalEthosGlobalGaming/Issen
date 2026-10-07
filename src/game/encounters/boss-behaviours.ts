import { bossStateTable } from './boss-states.ts';
import { createStateMachine } from '../state-machine.ts';
import { OPP, type Direction } from '../../shared/directions.ts';
import type { Boss, BossDefinition } from './boss.ts';
import { createBehaviourRegistry } from '../behaviour-registry.ts';

export interface BossBehaviour {
  readonly machine: ReturnType<typeof createBossMachine>;
  readonly allowFeint: boolean;
  shownDirection(boss: Readonly<Boss>): Direction;
  secondParry(boss: Readonly<Boss>): boolean;
  configure(boss: Boss): void;
}
function createBossMachine() {
  return createStateMachine(bossStateTable);
}
const base: BossBehaviour = {
  machine: createBossMachine(),
  allowFeint: true,
  shownDirection: (boss) => boss.sdir,
  secondParry: () => false,
  configure: () => {},
};
export const bossBehaviours = createBehaviourRegistry<{ def: BossDefinition }, BossBehaviour>();
bossBehaviours.register('mirror', {
  matches: (b) => !!b.def.mirror,
  behaviour: {
    ...base,
    allowFeint: false,
    shownDirection: (b) => OPP[b.sdir],
    configure: (b) => {
      b.bp.feint = 0;
    },
  },
});
bossBehaviours.register('twin', {
  matches: (b) => !!b.def.twin,
  behaviour: {
    ...base,
    secondParry: (b) => !b.twinDone,
  },
});
bossBehaviours.register('spear', {
  matches: (b) => !!b.def.spear,
  behaviour: {
    ...base,
    configure: (b) => {
      b.bp.flash *= 0.8;
      b.bp.wind *= 1.2;
    },
  },
});
bossBehaviours.register('base', { matches: () => true, behaviour: base });
