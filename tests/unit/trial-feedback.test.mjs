import test from 'node:test';
import assert from 'node:assert/strict';
import { bindTrialFeedback } from '../../src/ui/wiring/trial-feedback.ts';
import { createWavesPhase } from '../../src/game/phases/waves.ts';
import { createGrunt } from '../../src/game/combat/grunt-spawn.ts';
import { advanceGrunts } from '../../src/game/combat/grunt.ts';
import { restorableRng } from '../../src/shared/random.ts';
import { trialSessionFixture } from './helpers/runtime-trial-session.mjs';
import { waveLifecycleFixture } from './helpers/runtime-wave-lifecycle.mjs';
import { enemyKillFixture } from './helpers/runtime-enemy-kill.mjs';

test('actual seeded trial combat, reward settlement, failed retry and profile restoration do not depend on UI reactions', () => {
  function drive(enabled) {
    const f = trialSessionFixture(false), G = f.runtime.run, calls = [], values = [], visual = restorableRng(98);
    const player = structuredClone(f.views.playerStats), call = name => (...args) => { calls.push([name, ...args]); visual.next(); };
    const v = { banner: call('banner'), setWaveLabel: call('label'), renderTrialObjective: call('objective'),
      sfx: { unlock: call('unlock') }, buildLeaves: call('leaves'), audio: { setPaused: call('audio') },
      hideTrialObjective: call('hide'), openPanel: call('panel'), focusTrialResult: call('focus') };
    const off = enabled ? bindTrialFeedback(f.views.events, () => v) : () => {};
    for (const name of ['trialEncounter', 'trialSettlement', 'trialLeavesReset', 'trialAudioReset', 'trialObjectiveHidden', 'trialMenuReady'])
      f.views.events.on(name, e => { assert.ok(Object.isFrozen(e)); values.push([name, e]); });
    for (const name of ['banner', 'setWaveLabel', 'renderTrialObjective', 'renderHp', 'buildLeaves', 'hideTrialObjective', 'openPanel', 'focusTrialResult'])
      f.views[name] = () => assert.fail(`rules must not call UI port ${name}`);
    f.views.sfx = { unlock() { assert.fail('unlock must be an event reaction'); } };
    f.views.audio = { setPaused() { assert.fail('audio reset must be an event reaction'); } };
    f.start('quiet-blade');
    const trial = f.views.activeTrial, random = f.views.combatRandom;
    assert.notEqual(f.views.ST, f.views.playerStats);
    const lifecycle = waveLifecycleFixture({ run: G, random: { next: random }, views: { events: f.views.events, ST: f.views.ST } }, false);
    const kill = enemyKillFixture({ run: G, random: { next: random }, views: f.runtime.views });
    kill.views.activeTrial = trial;
    const pos = () => ({ x: 100, y: 200, h: 150, fog: 0, alpha: 1 });
    lifecycle.views.spawnEnemy = slot => createGrunt(G, slot, false, pos, random);
    const input = createWavesPhase(ctx => ctx, lifecycle.lifecycle);
    const inputViews = { events: f.views.events, G, W: 200, activeTrial: trial,
      waveConfiguration: () => G.cfg, killEnemy: kill.rules.killEnemy, orderSucceeded() {}, swingPlayer() {},
      playerDie() { assert.fail('a valid trial cut must not miss'); } };
    for (let tick = 0; tick < 12000 && G.state === 'playing'; tick++) {
      advanceGrunts(G, .02, { events: f.views.events, surge: 0, time: tick * .02,
        perfectZone: () => .78, pet: 'none', foxSave() {}, position: pos,
        playerDie() { assert.fail('perfect trial inputs must avoid late strikes'); } });
      lifecycle.lifecycle.updateWave(.02);
      if (G.attacker && G.attacker.p >= .8) input.onSwipe(inputViews, G.attacker.dir);
    }
    assert.equal(G.state, 'between');
    assert.equal(G.kills, trial.wave.total);
    assert.ok(G.perfects >= trial.wave.perfects);
    f.session.finishTrial(); f.session.finishTrial();
    assert.equal(f.views.trialResult.newlyCompleted, true);
    assert.equal(f.views.trialResult.passed, true);
    assert.deepEqual(f.views.TRIAL_PROGRESS.completed, ['quiet-blade']);
    assert.ok(f.views.UNL.has(trial.reward.id));
    assert.equal(f.views.ST, f.views.playerStats);
    assert.equal(f.views.EQ, f.views.playerEquipment);
    assert.equal(f.views.combatRandom, f.views.R);
    assert.equal(f.trace.filter(e => e === 'issen.trials').length, 1);
    assert.deepEqual(f.views.playerStats, player);
    if (enabled) {
      assert.equal(calls.filter(c => c[0] === 'unlock').length, 1);
      assert.deepEqual(calls.slice(-5).map(c => c[0]), ['leaves', 'audio', 'hide', 'panel', 'focus']);
    }
    f.start('quiet-blade');
    const initial = structuredClone(G.pendingSpawns);
    f.session.finishTrial('A mistake');
    assert.equal(f.views.trialResult.passed, false);
    assert.equal(f.trace.filter(e => e === 'issen.trials').length, 1);
    f.start('quiet-blade');
    assert.deepEqual(G.pendingSpawns, initial);
    const length = calls.length;
    off(); f.dispose(); kill.dispose(); lifecycle.disposeFeedback();
    f.views.events.emit('trialEncounter', values[0][1]);
    f.views.events.emit('trialMenuReady', { id: trial.id });
    f.views.events.emit('trialSettlement', { id: trial.id, passed: true });
    assert.equal(calls.length, length);
    assert.equal(f.trace.filter(e => e === 'issen.trials').length, 1);
    return { run: structuredClone(G), stats: structuredClone(f.views.ST), progress: structuredClone(f.views.TRIAL_PROGRESS),
      unlocks: [...f.views.UNL], records: [...f.records], random: f.runtime.random.state(), visual: visual.state() };
  }
  const on = drive(true), off = drive(false);
  assert.deepEqual(on.run, off.run); assert.deepEqual(on.stats, off.stats); assert.deepEqual(on.progress, off.progress);
  assert.deepEqual(on.unlocks, off.unlocks); assert.deepEqual(on.records, off.records);
  assert.equal(on.random, off.random); assert.notEqual(on.visual, off.visual);
});
