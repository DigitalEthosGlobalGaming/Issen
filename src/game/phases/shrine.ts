import { definePhase } from '../session/phase-router.ts';
import { shrineOffers, applyBlessing, crossroadsCurse } from '../shrine/blessings.ts';
import type { RuleEvents } from '../events.ts';
import type { BLESS } from '../content/blessings.ts';
import type { RunState } from '../run-state.ts';
import type { Random } from '../../shared/random.ts';
type Blessing = (typeof BLESS)[number];

export interface ShrineViews {
  readonly events: RuleEvents;
  readonly G: RunState;
  readonly combatRandom: Random;
  shrineOfferIds: string[] | null;
  readonly nextStep: () => void;
  readonly captureCheckpoint: () => void;
  readonly premiumAccess: () => boolean;
  readonly computeMods: () => void;
  readonly resetKnocks: () => void;
}
/** Shrine rules own seeded offers, effects, modifiers and continuation boundaries. */
export function createShrinePhase<Context>(readViews: () => ShrineViews) {
  function applyPick(id: string) {
    const { G, combatRandom, events } = readViews();
    const extras = applyBlessing(G, id, combatRandom);
    if (id === 'crossroads') {
      const curse = crossroadsCurse(G, combatRandom);
      if (curse) events.emit('shrineCurse', { id: curse.id });
    }
    events.emit('livesChanged', { cause: 'refresh', lives: G.lives });
    if (extras.length) events.emit('shrineTwin', { ids: Object.freeze(extras.map(b => b.id)) });
  }
  function showOffers(views: ShrineViews, opts: Blessing[]) {
    views.shrineOfferIds = opts.map(bl => bl.id);
    views.captureCheckpoint();
    views.events.emit('shrineOffers', { ids: Object.freeze([...views.shrineOfferIds]) });
  }
  function openShrine() {
    const views = readViews(), { G, combatRandom, resetKnocks, nextStep } = views;
    resetKnocks();
    if (G.m.noShrine) { nextStep(); return; }
    const opts = shrineOffers(G, combatRandom);
    if (!opts.length) { nextStep(); return; }
    G.state = 'shrine';
    showOffers(views, opts);
  }
  function reroll() {
    const views = readViews(), { G, combatRandom, premiumAccess } = views;
    if (G.state !== 'shrine' || G.shrineRerolls < 1 || !premiumAccess()) return;
    const opts = shrineOffers(G, combatRandom);
    if (!opts.length) return;
    G.shrineRerolls--;
    showOffers(views, opts);
  }
  function pick(bl: Blessing) {
    const views = readViews(), { G, events, computeMods, nextStep } = views;
    if (G.state !== 'shrine') return;
    G.bless.add(bl.id);
    applyPick(bl.id);
    events.emit('shrineRecorded', { tier: bl.t });
    computeMods();
    events.emit('shrineChosen', { id: bl.id });
    views.shrineOfferIds = null;
    nextStep();
  }
  return Object.assign(definePhase<Context>({}), { openShrine, applyPick, reroll, pick });
}
