import test from 'node:test';
import assert from 'node:assert/strict';
import { BLESS } from '../../src/game/content/blessings.ts';
import { shrineOffers, applyBlessing } from '../../src/game/shrine/blessings.ts';
import { rng } from '../../src/shared/random.ts';

const state = () => ({
  bless: new Set(),
  zen: false,
  hard: false,
  lives: 3,
  maxLives: 3,
  runWards: 0,
  bossCount: 0,
  m: { noShrine: 0, shrineN: 3, rare: 0, rareShrine: 0 },
});

test('shrine offers are deterministic, unique, and exclude owned or mode-ineligible blessings', () => {
  for (const mode of ['zen', 'hard']) {
    const run = state();
    run[mode] = true;
    run.bless.add('wind');
    run.lives = 1;
    for (let seed = 0; seed < 100; seed++) {
      const offers = shrineOffers(run, rng(seed));
      assert.deepEqual(offers, shrineOffers(run, rng(seed)));
      assert.equal(offers.length, 3);
      assert.equal(new Set(offers.map((b) => b.id)).size, 3);
      assert.ok(offers.every((b) => !b.lives && b.id !== 'wind' && b.id !== 'blood'));
    }
    assert.deepEqual([...run.bless], ['wind']);
  }
});

test('rare guarantee replaces an offer; curses start after two bosses; exhausted pools terminate', () => {
  const run = state();
  run.m.rareShrine = 1;
  for (let seed = 0; seed < 100; seed++) {
    const offers = shrineOffers(run, rng(seed));
    assert.equal(offers.length, 3);
    assert.ok(offers.some((b) => b.t === 1));
    assert.ok(offers.every((b) => b.t !== 2));
  }
  run.bossCount = 2;
  assert.ok(shrineOffers(run, () => 0).some((b) => b.t === 2));
  run.bless = new Set(BLESS.map((b) => b.id));
  assert.deepEqual(shrineOffers(run, rng(1)), []);
  run.bless.delete('wind');
  assert.deepEqual(
    shrineOffers(run, rng(1)).map((b) => b.id),
    ['wind'],
  );
  run.m.noShrine = 1;
  assert.deepEqual(shrineOffers(run, rng(1)), []);
});

test('immediate blessings preserve life and ward rules and Twin applies its extra picks', () => {
  const run = state();
  applyBlessing(run, 'iron');
  assert.deepEqual([run.lives, run.maxLives], [4, 4]);
  applyBlessing(run, 'blood');
  assert.equal(run.lives, 3);
  applyBlessing(run, 'glass');
  assert.deepEqual([run.lives, run.maxLives], [1, 1]);
  applyBlessing(run, 'blood');
  assert.equal(run.lives, 1);
  applyBlessing(run, 'paperward');
  assert.equal(run.runWards, 2);
  run.bless = new Set(BLESS.filter((b) => !['iron', 'paperward'].includes(b.id)).map((b) => b.id));
  const extras = applyBlessing(run, 'twin', rng(4));
  assert.equal(extras.length, 2);
  assert.deepEqual([run.lives, run.maxLives, run.runWards], [2, 2, 4]);
  assert.ok(run.bless.has('iron') && run.bless.has('paperward'));
  assert.deepEqual(applyBlessing(run, 'twin', rng(4)), []);
  run.zen = true;
  applyBlessing(run, 'iron');
  applyBlessing(run, 'glass');
  assert.deepEqual([run.lives, run.maxLives], [2, 2]);
});
