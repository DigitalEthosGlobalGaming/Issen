import test from 'node:test';
import assert from 'node:assert/strict';
import { bindBossCues } from '../../src/presentation/boss-cues.ts';
import { bindWaveFeedback } from '../../src/presentation/wave-feedback.ts';
import { restorableRng } from '../../src/shared/random.ts';
import { OPP } from '../../src/shared/directions.ts';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { bossPhaseFixture } from './helpers/runtime-boss-phase.mjs';

for (const [kind, count] of [['base', 1], ['twin', 4], ['spear', 5], ['mirror', 6]])
  test(`actual ${kind} duel cues preserve deferred entry, recovery, counter, healing and victory without cosmetics`, () => {
    function drive(enabled) {
      const runtime = runStartSession(9123, { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false });
      const f = bossPhaseFixture(runtime), G = runtime.run, calls = [], values = [], saved = [];
      const visual = restorableRng(66), call = name => (...args) => { visual.next(); calls.push([name, ...args]); };
      const v = { S: 1, banner: call('banner'), setBossLabels: call('labels'), renderHp: call('hp'),
        showBossBar: call('bar'), setScore: call('score'), pop: call('pop'), flash: call('flash'),
        sfx: { drum: call('drum'), glint: call('glint'), deflect: call('deflect'), step: call('step') },
        hint: call('hint'), notifications: { activeHint: 'parry' }, hideHint: call('hide'),
        renderLives: call('lives'), setWaveLabel: call('wave'), lightningFx: call('bolt'), dust: call('dust') };
      const disposers = enabled ? [bindBossCues(runtime.views.events, () => v), bindWaveFeedback(runtime.views.events, () => v)] : [];
      for (const name of ['bossEntered', 'bossHealth', 'bossReady', 'bossTraits', 'bossCue', 'bossOpening', 'livesChanged'])
        runtime.views.events.on(name, e => {
          assert.ok(Object.isFrozen(e));
          assert.ok(Object.values(e).every(value => value === null || typeof value !== 'object'));
          values.push([name, e]);
        });
      for (const key of ['banner', 'renderLives', 'renderHp', 'setBossLabels', 'showBossBar', 'setScore', 'pop', 'flash', 'hint', 'hideHint'])
        f.views[key] = () => assert.fail(`rules must not call cosmetic port ${key}`);
      f.views.sfx = new Proxy({}, { get: (_, name) => () => assert.fail(`rules must not call sound ${String(name)}`) });
      f.views.saveStats = () => saved.push(structuredClone(runtime.views.ST));
      G.bossCount = count - 1;
      G.lives = 1;
      G.bless.add('counter'); G.bless.add('breath'); G.m.kage = 1;
      let begin;
      f.views.deferUntilSceneReady = action => { begin = action; return true; };
      f.phase.startBoss();
      assert.equal(G.boss, null); assert.equal(values.length, 0);
      f.views.deferUntilSceneReady = () => false;
      begin();
      const b = G.boss;
      const entry = values.find(([n]) => n === 'bossEntered')[1];
      assert.equal(entry.name, b.def.n);
      assert.equal(entry.glyph, b.def.k);
      if (enabled) assert.deepEqual(calls.slice(0, 6).map(c => c[0]), ['lives', 'banner', 'labels', 'hp', 'bar', 'drum']);
      // Let the first naturally opened parry/cut window expire into recovery.
      let recovered = false, wrong = false, counter = false;
      for (let tick = 0; tick < 20000 && G.boss; tick++) {
        f.phase.updateBoss(.01);
        if (!G.boss) break;
        if (b.state === 'flash') f.phase.onTapDown(f.views);
        if (b.state === 'stagger') {
          if (!recovered) {
            if (values.some(([n, e]) => n === 'bossCue' && e.kind === 'recovered')) recovered = true;
          } else if (!wrong) {
            f.phase.onSwipe(f.views, OPP[b.sdir]); // Afterimage preserves the window.
            assert.equal(b.state, 'stagger');
            f.phase.onSwipe(f.views, OPP[b.sdir]); // Exhausted protection deflects.
            assert.equal(b.state, 'recover');
            wrong = true;
          } else f.phase.onSwipe(f.views, b.sdir);
        }
        if (values.some(([n, e]) => n === 'bossCue' && e.kind === 'recovered')) recovered = true;
        counter ||= values.some(([n, e]) => n === 'bossCue' && e.kind === 'return');
      }
      assert.equal(G.boss, null, 'natural duel must reach the removal boundary');
      assert.equal(b.hp, 0);
      assert.ok(recovered && wrong && counter);
      assert.equal(G.bossesSlain, 1);
      assert.equal(G.lives, 2);
      assert.equal(runtime.views.ST.duels, 1);
      assert.equal(saved.length, 1);
      assert.equal(values.filter(([n, e]) => n === 'livesChanged' && e.cause === 'breath').length, 1);
      if (enabled) {
        assert.ok(calls.some(c => c[0] === 'flash' && c[1] === .14));
        assert.ok(calls.some(c => c[0] === 'pop' && c[3] === 'Afterimage'));
        assert.ok(calls.some(c => c[0] === 'pop' && c[3] === 'Deflected'));
      }
      const length = calls.length;
      disposers.forEach(off => off());
      runtime.views.events.emit('bossEntered', entry);
      runtime.views.events.emit('bossCue', { kind: 'draw' });
      assert.equal(calls.length, length);
      return { run: structuredClone(G), stats: structuredClone(runtime.views.ST), saved,
        random: runtime.random.state(), visual: visual.state(), hitStop: f.views.hitStop };
    }
    const on = drive(true), off = drive(false);
    assert.deepEqual(on.run, off.run);
    assert.deepEqual(on.stats, off.stats);
    assert.deepEqual(on.saved, off.saved);
    assert.equal(on.random, off.random);
    assert.equal(on.hitStop, off.hitStop);
    assert.notEqual(on.visual, off.visual);
  });
