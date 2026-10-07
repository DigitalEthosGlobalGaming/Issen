import type { Direction } from '../../shared/directions.ts';
import type { RunPhase } from '../run-state.ts';

export interface PhaseController<Context> {
  enter(context: Context): void;
  update(context: Context, dt: number): void;
  onSwipe(context: Context, direction: Direction): void;
  onTap(context: Context): void;
  /** True consumes pointer-down; false leaves it available for swipe/release. */
  onTapDown(context: Context): boolean;
  exit(context: Context): void;
}

export interface PhasePorts {
  read(): RunPhase;
  write(phase: RunPhase): void;
  changed(from: RunPhase, to: RunPhase): void;
}

/** Passive phases still implement the complete controller vocabulary. */
export function definePhase<Context>(
  handlers: Partial<PhaseController<Context>>,
): PhaseController<Context> {
  return {
    enter() {},
    update() {},
    onSwipe() {},
    onTap() {},
    onTapDown() {
      return false;
    },
    exit() {},
    ...handlers,
  };
}

/** Synchronous phase dispatch. Rules own records/RNG; ports expose only phase changes.
 * Existing direct record writes can synchronize during migration. Checkpoint adoption
 * selects the restored controller without replaying enter effects or a phase event.
 */
export function createPhaseRouter<Context>(
  context: Context,
  ports: PhasePorts,
  controllers: Readonly<Record<RunPhase, PhaseController<Context>>>,
) {
  let active = ports.read();
  let exiting = false;
  function controller(phase: RunPhase) {
    if (!Object.hasOwn(controllers, phase)) throw new Error(`Undefined run phase: ${phase}`);
    return controllers[phase];
  }
  controller(active);
  function select(next: RunPhase, write: boolean) {
    const target = controller(next);
    if (next === active) return;
    if (exiting) throw new Error('A phase exit cannot initiate another transition');
    const previous = active;
    exiting = true;
    try {
      controller(previous).exit(context);
    } finally {
      exiting = false;
    }
    if (write) ports.write(next);
    active = next;
    // An event observes the committed phase before its entry callback.
    ports.changed(previous, next);
    // Nested transitions must not enter a controller which is no longer active.
    if (active === next) target.enter(context);
  }
  function synchronize() {
    select(ports.read(), false);
  }
  function dispatch(action: (phase: PhaseController<Context>) => void) {
    synchronize();
    action(controller(active));
    synchronize();
  }
  return {
    get active() {
      return active;
    },
    transition(next: RunPhase) {
      synchronize();
      select(next, true);
    },
    synchronize,
    adoptCheckpoint() {
      const restored = ports.read();
      controller(restored);
      active = restored;
    },
    update(dt: number) {
      dispatch((phase) => phase.update(context, dt));
    },
    onSwipe(direction: Direction) {
      dispatch((phase) => phase.onSwipe(context, direction));
    },
    onTap() {
      dispatch((phase) => phase.onTap(context));
    },
    onTapDown() {
      let consumed = false;
      dispatch((phase) => {
        consumed = phase.onTapDown(context);
      });
      return consumed;
    },
  };
}
