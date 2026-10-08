import type { EventBus, GameEvents } from '../game/events.ts';
/** Warning sounds have no character/run/RNG capabilities. */
export function bindGruntCues(events: EventBus<GameEvents>, read: () => {
  readonly sfx: { bell(): void; feint(): void; bark(): void };
}) {
  return events.on('gruntCue', event => { read().sfx[event.kind](); });
}
