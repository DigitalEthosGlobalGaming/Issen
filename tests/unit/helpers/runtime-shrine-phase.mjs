import { createShrinePhase } from '../../../src/game/phases/shrine.ts';
export function shrinePhaseFixture(session) {
  const G = session.run,
    trace = [];
  let offers = [];
  const views = {
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
  return {
    views,
    trace,
    phase: createShrinePhase(() => views),
    get offers() {
      return offers;
    },
  };
}
