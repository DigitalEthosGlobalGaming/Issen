import type { RunState } from '../run-state.ts';
import type { EventBus, GameEvents } from '../events.ts';
import type { TrialDefinition } from '../content/trials.ts';
import { scoreGain } from './scoring.ts';
import { protectCombo } from './run-powers.ts';
import { recordComboBreak } from '../shrine/triggered.ts';

export interface CombatScoreViews {
  readonly G: RunState;
  readonly events: EventBus<GameEvents>;
  readonly activeTrial: TrialDefinition | null;
  trialFailure: string;
}
export function createCombatScore(readViews: () => CombatScoreViews) {
  return {
    addScore(points: number, x: number, y: number, label?: string, size?: number) {
      const { G, events } = readViews();
      const amount = scoreGain(points, G);
      G.score += amount;
      events.emit('scoreAdded', { amount, total: G.score, x, y, label, size, zen: G.zen });
      return amount;
    },
    bumpCombo() {
      const { G, events } = readViews();
      G.maxCombo = Math.max(G.maxCombo, G.combo);
      events.emit('comboChanged', { combo: G.combo, maximum: G.maxCombo, zen: G.zen });
    },
    breakCombo() {
      const views = readViews(),
        { G, events, activeTrial } = views;
      if (activeTrial?.cleanOpenings)
        views.trialFailure = 'An opening was missed or a counter went the wrong way.';
      if (protectCombo(G)) {
        events.emit('comboProtected', { combo: G.combo });
        return;
      }
      const previous = G.combo;
      G.combo = G.bless && G.bless.has('banner') && G.combo >= 10 ? 10 : 0;
      if (G.combo < previous) {
        recordComboBreak(G, previous);
        events.emit('comboBroken', { previous });
      }
    },
  };
}
