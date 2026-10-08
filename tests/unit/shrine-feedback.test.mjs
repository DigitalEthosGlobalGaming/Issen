import test from 'node:test';
import assert from 'node:assert/strict';
import { bindShrineFeedback } from '../../src/ui/wiring/shrine-feedback.ts';
import { BLESS_BY } from '../../src/game/content/blessings.ts';
import { restorableRng } from '../../src/shared/random.ts';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { shrinePhaseFixture } from './helpers/runtime-shrine-phase.mjs';
const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };

function findSeed(id) {
  for (let seed = 1; seed < 1000; seed++) {
    const runtime = runStartSession(seed, setup), f = shrinePhaseFixture(runtime, false);
    runtime.run.bossCount = 7;
    f.phase.openShrine();
    const found = f.views.shrineOfferIds.includes(id);
    f.dispose();
    if (found) return seed;
  }
  assert.fail(`an eligible ${id} offer must be produced by real seeded generation`);
}
for (const target of ['crossroads', 'twin'])
  test(`actual ${target} shrine choice, reroll and profile settlement are independent of UI subscriptions`, () => {
    const seed = findSeed(target);
    function drive(enabled) {
      const runtime = runStartSession(seed, setup), f = shrinePhaseFixture(runtime, false);
      const G = runtime.run, values = [], calls = [], order = [], saves = [], visual = restorableRng(34);
      const call = name => (...args) => { calls.push([name, ...args]); visual.next(); order.push(name); };
      const ui = { toast: call('toast'), showShrineOffers: call('offers'), hud: call('hud'), showScreen: call('screen'), sfx: { unlock: call('unlock') } };
      const off = enabled ? bindShrineFeedback(runtime.views.events, () => ui) : () => {};
      for (const name of ['shrineOffers', 'shrineCurse', 'shrineTwin', 'shrineRecorded', 'shrineChosen'])
        runtime.views.events.on(name, event => {
          assert.ok(Object.isFrozen(event));
          if (event.ids) { assert.ok(Object.isFrozen(event.ids)); assert.ok(event.ids.every(id => BLESS_BY[id])); }
          values.push([name, event]);
        });
      f.views.captureCheckpoint = () => { order.push('checkpoint'); };
      f.views.saveStats = () => { saves.push(structuredClone(f.views.ST)); order.push('save'); };
      f.views.computeMods = () => { runtime.views.computeMods(); order.push('mods'); };
      f.views.checkUnlocks = () => { order.push('unlocks'); };
      for (const name of ['toast', 'showShrineOffers', 'hud', 'showScreen', 'renderLives'])
        f.views[name] = () => assert.fail(`rules must not call UI port ${name}`);
      f.views.sfx = { unlock() { assert.fail('rules must emit unlock feedback'); } };
      G.bossCount = 7;
      f.phase.openShrine();
      assert.ok(f.views.shrineOfferIds.includes(target));
      const original = values[0][1];
      assert.equal(order[0], 'checkpoint');
      f.phase.pick(BLESS_BY[target]);
      f.phase.pick(BLESS_BY[target]);
      assert.equal(G.state, 'between'); assert.equal(f.views.shrineOfferIds, null);
      assert.ok(G.bless.has(target));
      assert.equal(f.views.ST.shrines, 1); assert.equal(f.views.ST.rares, 1);
      assert.equal(saves.length, 1);
      assert.deepEqual(order.filter(name => ['save', 'mods', 'unlocks'].includes(name)), ['save', 'mods', 'unlocks']);
      if (target === 'crossroads') {
        assert.equal(f.views.ST.curses, 1);
        assert.equal(values.filter(([name]) => name === 'shrineCurse').length, 1);
      } else {
        const twin = values.find(([name]) => name === 'shrineTwin')[1];
        assert.equal(twin.ids.length, 2); assert.ok(twin.ids.every(id => G.bless.has(id)));
      }
      f.phase.openShrine(); G.shrineRerolls = 1;
      f.phase.reroll(); f.phase.reroll();
      assert.equal(G.shrineRerolls, 0);
      assert.equal(values.filter(([name]) => name === 'shrineOffers').length, 3);
      assert.ok(original.ids.includes(target), 'old snapshots survive offer-array replacement');
      const length = calls.length;
      off(); f.dispose();
      runtime.views.events.emit('shrineOffers', original);
      runtime.views.events.emit('shrineChosen', { id: target });
      assert.equal(calls.length, length);
      assert.equal(saves.length, 1);
      return { run: structuredClone(G), stats: structuredClone(f.views.ST), saves, random: runtime.random.state(), visual: visual.state() };
    }
    const on = drive(true), off = drive(false);
    assert.deepEqual(on.run, off.run); assert.deepEqual(on.stats, off.stats); assert.deepEqual(on.saves, off.saves);
    assert.equal(on.random, off.random); assert.notEqual(on.visual, off.visual);
  });
