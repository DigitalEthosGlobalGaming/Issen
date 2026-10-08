import test from 'node:test';
import assert from 'node:assert/strict';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { bindRunStartFeedback } from '../../src/ui/wiring/run-start-feedback.ts';
import { restorableRng } from '../../src/shared/random.ts';
import { DEFAULT_EQUIPMENT } from '../../src/platform/saves.ts';
import { TRIALS } from '../../src/game/content/trials.ts';
const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
for (const mode of ['normal', 'ronin', 'blade', 'zen', 'rush', 'daily', 'trial'])
  test(`actual ${mode} entry preserves profile/player/weather/gameplay RNG without cosmetic listeners`, () => {
    function drive(enabled) {
      const options = {
        ...setup,
        ...(mode === 'ronin' ? { diff: 'ronin' } : {}),
        ...(mode === 'blade' ? { arrows: false } : {}),
        ...(mode === 'zen' ? { lives: 'zen' } : {}),
        ...(mode === 'rush' ? { mode: 'rush' } : {}),
      };
      const f = runStartSession(
        123456,
        options,
        { ...DEFAULT_EQUIPMENT, charm: 'omikuji' },
        false,
        false,
      );
      const calls = [],
        values = [],
        visual = restorableRng(91);
      const call =
        (name) =>
        (...args) => {
          calls.push([name, ...args]);
          visual.next();
        };
      const ui = {
        $: () => ({ classList: { remove: call('bossbar') } }),
        apparelMotion: { reset: call('motion') },
        presentationState: { lbT: 4 },
        clearEffects: call('effects'),
        clearHints: call('clearHints'),
        hint: call('hint'),
        hud: call('hud'),
        setScore: call('score'),
        showScreen: call('screen'),
        toast: call('toast'),
        applySeal: call('seal'),
        audioInit: call('audio'),
        buildLeaves: call('leaves'),
      };
      for (const name of ['runStartCue', 'runModeHint', 'runFortune'])
        f.views.events.on(name, (event) => {
          assert.ok(Object.isFrozen(event));
          values.push([name, event]);
        });
      const off = enabled ? bindRunStartFeedback(f.views.events, () => ui) : () => {};
      for (const name of [
        'clearEffects',
        'clearHints',
        'hint',
        'hud',
        'setScore',
        'showScreen',
        'toast',
        'applySeal',
        'audioInit',
        'buildLeaves',
      ])
        f.views[name] = () => assert.fail(`rules must not call ${name}`);
      f.views.apparelMotion = { reset: () => assert.fail('rules must emit motion reset') };
      if (mode === 'daily') f.flow.startDaily();
      else if (mode === 'trial') f.flow.startTrial(TRIALS[0].id);
      else f.flow.startRun();
      if (mode === 'daily' || mode === 'trial') assert.notEqual(f.views.ST, f.views.playerStats);
      else assert.equal(f.views.ST, f.views.playerStats);
      const outcome = structuredClone({
        run: f.run,
        stats: f.views.ST,
        profile: f.views.playerStats,
        equipment: f.views.EQ,
        player: f.views.P,
        weather: f.weather,
        ledger: f.views.rewardLedger,
        random:
          mode === 'trial' ? [f.views.combatRandom(), f.views.combatRandom()] : f.random.state(),
        timeScale: f.views.timeScale,
        hitStop: f.views.hitStop,
        setup: f.views.SETUP,
      });
      assert.ok(values.some(([name, event]) => name === 'runStartCue' && event.kind === 'screen'));
      if (['rush', 'blade', 'zen'].includes(mode))
        assert.ok(values.some(([name, event]) => name === 'runModeHint' && event.mode === mode));
      const fortune = values.find(([name]) => name === 'runFortune')?.[1];
      if (fortune) {
        const original = { ...fortune };
        f.run.fortune = null;
        assert.deepEqual(fortune, original);
      }
      if (enabled) {
        assert.equal(ui.presentationState.lbT, 0);
        assert.ok(calls.find((x) => x[0] === 'score'));
        assert.ok(calls.find((x) => x[0] === 'screen'));
        assert.ok(calls.find((x) => x[0] === 'motion'));
      } else assert.equal(calls.length, 0);
      off();
      const before = calls.length;
      f.views.events.emit('runStartCue', { kind: 'effects' });
      f.views.events.emit('runModeHint', { mode: 'zen' });
      f.views.events.emit('runFortune', { glyph: '吉', name: 'Later', description: 'Disposed' });
      assert.equal(calls.length, before);
      return outcome;
    }
    assert.deepEqual(drive(true), drive(false));
  });
