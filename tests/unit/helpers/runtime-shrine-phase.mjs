import { bindShrineProgression } from '../../../src/game/progression/shrine-listeners.ts';
import { bindShrineFeedback } from '../../../src/ui/wiring/shrine-feedback.ts';
import { createShrinePhase } from '../../../src/game/phases/shrine.ts';
export function shrinePhaseFixture(session, feedback = true) {
  const G = session.run,
    trace = [];
  let offers = [];
  const views = {
    events: session.views.events,
    G,
    ST: session.views.ST,
    combatRandom: session.random.next,
    shrineOfferIds: null,
    renderLives() {},
    toast() {},
    resetKnocks() {},
    nextStep() {
      G.state = 'between';
      trace.push('next');
    },
    captureCheckpoint() {
      trace.push(['checkpoint', [...views.shrineOfferIds]]);
    },
    showShrineOffers(value) {
      offers = value;
      trace.push('offers');
    },
    premiumAccess: () => true,
    saveStats() {},
    computeMods() {},
    checkUnlocks() {},
    hud() {},
    showScreen() {},
    sfx: {
      unlock() {
        trace.push('unlock');
      },
    },
  };
  const offProfile = bindShrineProgression(views.events, () => views);
  const offFeedback = feedback ? bindShrineFeedback(views.events, () => views) : () => {};
  return {
    dispose() { offFeedback(); offProfile(); },
    views,
    trace,
    phase: createShrinePhase(() => views),
    get offers() {
      return offers;
    },
  };
}
