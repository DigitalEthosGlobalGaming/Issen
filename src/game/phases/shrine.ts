import { definePhase } from '../session/phase-router.ts';
import { shrineOffers, applyBlessing, crossroadsCurse } from '../shrine/blessings.ts';
import type { BLESS } from '../content/blessings.ts';
import type { RunState, Screen } from '../run-state.ts';
import type { Statistics } from '../progression/statistics.ts';
import type { Random } from '../../shared/random.ts';
type Blessing = (typeof BLESS)[number];

export interface ShrineViews {
  readonly G: RunState;
  readonly ST: Statistics;
  readonly combatRandom: Random;
  shrineOfferIds: string[] | null;
  readonly renderLives: () => void;
  readonly toast: (message: { k: string; msg: string }) => void;
  readonly nextStep: () => void;
  readonly captureCheckpoint: () => void;
  readonly showShrineOffers: (offers: Blessing[]) => void;
  readonly premiumAccess: () => boolean;
  readonly saveStats: () => void;
  readonly computeMods: () => void;
  readonly checkUnlocks: () => void;
  readonly hud: (on: boolean) => void;
  readonly showScreen: (screen: Screen | null) => void;
  readonly sfx: { unlock(): void };
  readonly resetKnocks: () => void;
}

/** Shrine offer, reroll and choice rules retain existing checkpoint/reward order. */
export function createShrinePhase<Context>(readViews: () => ShrineViews) {
  function applyPick(id: string) {
    const views = readViews();
    const {
      G,
      ST,
      combatRandom,
      renderLives,
      toast,
      nextStep,
      captureCheckpoint,
      showShrineOffers,
      premiumAccess,
      saveStats,
      computeMods,
      checkUnlocks,
      hud,
      showScreen,
      sfx,
      resetKnocks,
    } = views;
    const extras = applyBlessing(G, id, combatRandom);
    if (id === 'crossroads') {
      const curse = crossroadsCurse(G, combatRandom);
      if (curse) {
        ST.curses++;
        toast({ k: curse.k, msg: `Crossroads curse: ${curse.n}` });
      }
    }
    renderLives();
    if (extras.length)
      toast({ k: '双', msg: 'Twin blessing: ' + extras.map((b) => b.n).join(' and ') });
  }
  function openShrine() {
    const views = readViews();
    const {
      G,
      ST,
      combatRandom,
      renderLives,
      toast,
      nextStep,
      captureCheckpoint,
      showShrineOffers,
      premiumAccess,
      saveStats,
      computeMods,
      checkUnlocks,
      hud,
      showScreen,
      sfx,
      resetKnocks,
    } = views;
    resetKnocks();
    if (G.m.noShrine) {
      nextStep();
      return;
    }
    const opts = shrineOffers(G, combatRandom);
    if (!opts.length) {
      nextStep();
      return;
    }
    G.state = 'shrine';
    views.shrineOfferIds = opts.map((bl) => bl.id);
    captureCheckpoint();
    showShrineOffers(opts);
  }
  function reroll() {
    const views = readViews();
    const {
      G,
      ST,
      combatRandom,
      renderLives,
      toast,
      nextStep,
      captureCheckpoint,
      showShrineOffers,
      premiumAccess,
      saveStats,
      computeMods,
      checkUnlocks,
      hud,
      showScreen,
      sfx,
      resetKnocks,
    } = views;
    if (G.state !== 'shrine' || G.shrineRerolls < 1 || !premiumAccess()) return;
    const opts = shrineOffers(G, combatRandom);
    if (!opts.length) return;
    G.shrineRerolls--;
    views.shrineOfferIds = opts.map((bl) => bl.id);
    captureCheckpoint();
    showShrineOffers(opts);
  }
  function pick(bl: Blessing) {
    const views = readViews();
    const {
      G,
      ST,
      combatRandom,
      renderLives,
      toast,
      nextStep,
      captureCheckpoint,
      showShrineOffers,
      premiumAccess,
      saveStats,
      computeMods,
      checkUnlocks,
      hud,
      showScreen,
      sfx,
      resetKnocks,
    } = views;
    if (G.state !== 'shrine') return;
    G.bless.add(bl.id);
    applyPick(bl.id);
    if (bl.t === 1) ST.rares++;
    if (bl.t === 2) ST.curses++;
    ST.shrines++;
    saveStats();
    computeMods();
    checkUnlocks();
    hud(true);
    showScreen(null);
    sfx.unlock();
    views.shrineOfferIds = null;
    nextStep();
  }
  return Object.assign(definePhase<Context>({}), { openShrine, applyPick, reroll, pick });
}
