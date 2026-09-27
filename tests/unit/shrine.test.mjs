import test from 'node:test';
import assert from 'node:assert/strict';
import { BLESS } from '../../src/game/content/blessings.ts';
import {
  BOSS_RUSH_BLESSINGS,
  shrineOffers,
  applyBlessing,
} from '../../src/game/shrine/blessings.ts';
import { rng } from '../../src/shared/random.ts';
import { computeModifiers } from '../../src/game/equipment/modifiers.ts';
import { parseMeta, purchaseUpgrade, templateModifiers } from '../../src/game/progression/meta.ts';

test('Offerings ranks persist, retain the extra choice and add rarity to equipment', () => {
  const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3' };
  const meta = parseMeta({ embers: 800 });
  for (let rank = 1; rank <= 3; rank++) {
    assert.equal(purchaseUpgrade(meta, 'offerings'), true);
    assert.equal(parseMeta(meta).upgrades.offerings, rank);
    const base = computeModifiers([templateModifiers(meta, setup)], new Set());
    assert.equal(base.shrineN, 4);
    assert.equal(base.rare, rank >= 2 ? 0.2 : 0);
    assert.equal(base.rareShrine, rank === 3 ? 1 : 0);
    const equipped = computeModifiers(
      [{ shrineN: 5, rare: 0.1, rareShrine: 1 }, templateModifiers(meta, setup)],
      new Set(),
    );
    assert.equal(equipped.shrineN, 6);
    assert.ok(Math.abs(equipped.rare - (rank >= 2 ? 0.3 : 0.1)) < 1e-10);
    assert.equal(equipped.rareShrine, rank === 3 ? 2 : 1);
    const off = computeModifiers(
      [templateModifiers(meta, { ...setup, upgrades: false })],
      new Set(),
    );
    assert.deepEqual([off.shrineN, off.rare, off.rareShrine], [3, 0, 0]);
  }
  assert.equal(meta.embers, 0);
  assert.equal(purchaseUpgrade(meta, 'offerings'), false);
});

test('rare chance improves rolls and guarantees stack without duplicates or exhausted-pool loops', () => {
  const run = state();
  assert.ok(shrineOffers(run, () => 0.4).every((b) => b.t === 0));
  run.m.rare = 0.2;
  assert.ok(shrineOffers(run, () => 0.4).some((b) => b.t === 1));
  run.m.rare = 0;
  run.m.rareShrine = 2;
  for (let seed = 0; seed < 100; seed++) {
    const offers = shrineOffers(run, rng(seed));
    assert.ok(offers.filter((b) => b.t === 1).length >= 2);
    assert.equal(offers.length, 3);
    assert.equal(new Set(offers.map((b) => b.id)).size, offers.length);
  }
  const rares = BLESS.filter((b) => b.t === 1);
  run.bless = new Set(rares.slice(1).map((b) => b.id));
  assert.equal(shrineOffers(run, () => 0.9).filter((b) => b.t === 1).length, 1);
  run.bless.add(rares[0].id);
  assert.equal(shrineOffers(run, () => 0.9).filter((b) => b.t === 1).length, 0);
});

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

test('boss rush only offers duel-relevant effects in every tier', () => {
  const run = state();
  run.rush = true;
  run.bossCount = 3;
  run.m.rare = 0.4;
  run.m.rareShrine = 2;
  for (let seed = 0; seed < 200; seed++) {
    const offers = shrineOffers(run, rng(seed));
    assert.equal(offers.length, 3);
    assert.ok(offers.every((b) => BOSS_RUSH_BLESSINGS.has(b.id)));
    assert.ok(
      offers.every(
        (b) =>
          !['harvest', 'swallow', 'patience', 'stormborn', 'silence', 'haste', 'frenzy'].includes(
            b.id,
          ),
      ),
    );
    assert.ok(offers.filter((b) => b.t === 1).length >= 2);
  }
  const normal = state();
  normal.bless = new Set(BLESS.filter((b) => b.id !== 'harvest').map((b) => b.id));
  assert.deepEqual(
    shrineOffers(normal, rng(1)).map((b) => b.id),
    ['harvest'],
  );
});

test('Twin secondary grants obey boss-rush filter and exhausted rare pools fall back', () => {
  const run = state();
  run.rush = true;
  run.bless.add('twin');
  const extras = applyBlessing(run, 'twin', rng(7));
  assert.equal(extras.length, 2);
  assert.ok(extras.every((b) => BOSS_RUSH_BLESSINGS.has(b.id) && b.t === 0));

  run.m.rareShrine = 3;
  run.bless = new Set(
    BLESS.filter((b) => b.t === 1 && BOSS_RUSH_BLESSINGS.has(b.id)).map((b) => b.id),
  );
  const offers = shrineOffers(run, rng(9));
  assert.ok(offers.length > 0);
  assert.ok(offers.every((b) => b.t !== 1 && BOSS_RUSH_BLESSINGS.has(b.id)));

  run.bless = new Set(
    BLESS.filter((b) => b.t === 0 && BOSS_RUSH_BLESSINGS.has(b.id)).map((b) => b.id),
  );
  assert.ok(shrineOffers(run, rng(9)).every((b) => b.id !== 'twin'));
  assert.deepEqual(applyBlessing(run, 'twin', rng(9)), []);
});
