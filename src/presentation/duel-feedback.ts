import type { EventBus, GameEvents } from '../game/events.ts';
export interface DuelFeedbackViews {
  readonly S: number;
  readonly sparks: (x: number, y: number, count: number) => void;
  readonly ring: (
    x: number,
    y: number,
    from: number,
    to: number,
    life: number,
    width: number,
  ) => void;
  readonly shake: (amount: number) => void;
  readonly flash: (amount: number) => void;
  readonly sfx: { clang(): void; block(): void };
  readonly combatHaptics: { play(event: 'parry'): void };
  readonly letterbox: (duration: number) => void;
  readonly buzz: (duration: number) => void;
}
/** Cosmetic duel reactions have no run record or gameplay RNG capability. */
export function bindDuelFeedback(events: EventBus<GameEvents>, readViews: () => DuelFeedbackViews) {
  const offParry = events.on('parry', (event) => {
    const { S, sparks, ring, shake, flash, sfx, combatHaptics, letterbox } = readViews();
    sparks(event.x, event.y, 24);
    ring(event.x, event.y, 4 * S, 90 * S, 0.35, Math.max(2, 2.5 * S));
    shake(11 * S);
    flash(0.3);
    sfx.clang();
    combatHaptics.play('parry');
    letterbox(0.3);
  });
  const offBlock = events.on('block', (event) => {
    const { S, sparks, ring, shake, flash, sfx, buzz } = readViews();
    sparks(event.x, event.y, 16);
    ring(event.x, event.y, 3 * S, 70 * S, 0.28, Math.max(1.5, 2 * S));
    shake(7 * S);
    flash(0.12);
    sfx.block();
    buzz(12);
  });
  return () => {
    offBlock();
    offParry();
  };
}
