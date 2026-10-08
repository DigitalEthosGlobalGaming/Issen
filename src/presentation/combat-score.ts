import type { EventBus, GameEvents } from '../game/events.ts';
export interface CombatScoreFeedbackViews {
  readonly setScore: () => void;
  readonly pop: (x: number, y: number, text: string, size?: number) => void;
  readonly W: number;
  readonly H: number;
}
export function bindCombatScoreFeedback(
  events: EventBus<GameEvents>,
  readViews: () => CombatScoreFeedbackViews,
) {
  const removeScore = events.on('scoreAdded', (event) => {
    const { setScore, pop } = readViews();
    setScore();
    if (event.zen) {
      if (event.label) pop(event.x, event.y, event.label, event.size);
    } else
      pop(
        event.x,
        event.y,
        (event.label ? event.label + ' ' : '') + '+' + event.amount,
        event.size,
      );
  });
  const removeProtected = events.on('comboProtected', () => {
    const { W, H, pop } = readViews();
    pop(W / 2, H * 0.4, 'Composure · combo kept');
  });
  return () => {
    removeProtected();
    removeScore();
  };
}
