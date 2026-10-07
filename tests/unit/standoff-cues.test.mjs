import test from 'node:test';
import assert from 'node:assert/strict';
import { bindStandoffCues } from '../../src/presentation/standoff-cues.ts';
import { restorableRng } from '../../src/shared/random.ts';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { standoffPhaseFixture } from './helpers/runtime-standoff-phase.mjs';

test('actual deferred challenger entry, twitch, draw, cut and exit preserve combat without cosmetic cues', () => {
  function drive(enabled) {
    const runtime = runStartSession(6512, { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false });
    const f = standoffPhaseFixture(runtime), calls = [], values = [], visual = restorableRng(71);
    const call = name => (...args) => { visual.next(); calls.push([name, ...args]); };
    const v = { banner: call('banner'), setWaveLabel: call('label'), letterbox: call('box'),
      clearLetterbox: call('clear'), hint: call('hint'), flash: call('flash'),
      sfx: { drum: call('drum'), step: call('step'), glint: call('glint') } };
    for (const name of ['standoffStarted', 'standoffCue']) runtime.views.events.on(name, event => {
      assert.ok(Object.isFrozen(event));
      assert.ok(Object.values(event).every(value => value === null || typeof value !== 'object'));
      values.push([name, event]);
    });
    const off = enabled ? bindStandoffCues(runtime.views.events, () => v) : () => {};
    let begin;
    f.views.deferUntilSceneReady = action => { begin = action; return true; };
    f.phase.startStandoff(2, true);
    assert.equal(runtime.run.so, null);
    assert.equal(values.length, 0);
    f.views.deferUntilSceneReady = () => false;
    begin();
    assert.deepEqual(values[0], ['standoffStarted', { stage: runtime.run.stage, changed: true }]);
    for (let tick = 0; tick < 1000 && !runtime.run.so.fired; tick++) f.phase.update(f.views, .01);
    assert.ok(runtime.run.so.fired);
    assert.ok(values.some(([, e]) => e.kind === 'step'));
    assert.ok(values.some(([, e]) => e.kind === 'draw'));
    f.phase.onSwipe(f.views, runtime.run.so.e.dir);
    f.phase.update(f.views, 1.41);
    assert.equal(runtime.run.so, null);
    assert.deepEqual(f.trace.at(-1), ['wave', 2, true]);
    assert.equal(values.at(-1)[1].kind, 'exit');
    if (enabled) {
      assert.deepEqual(calls.slice(0, 5).map(c => c[0]), ['banner', 'label', 'box', 'drum', 'hint']);
      assert.deepEqual(calls.find(c => c[0] === 'flash'), ['flash', .2]);
      assert.equal(calls.at(-1)[0], 'clear');
    }
    const count = calls.length;
    off();
    runtime.views.events.emit('standoffStarted', values[0][1]);
    runtime.views.events.emit('standoffCue', { kind: 'draw' });
    assert.equal(calls.length, count);
    return { run: structuredClone(runtime.run), stats: structuredClone(runtime.views.ST), random: runtime.random.state(), visual: visual.state(), calls };
  }
  const on = drive(true), off = drive(false);
  assert.deepEqual(on.run, off.run);
  assert.deepEqual(on.stats, off.stats);
  assert.equal(on.random, off.random);
  assert.notEqual(on.visual, off.visual);
  assert.equal(off.calls.length, 0);
});
