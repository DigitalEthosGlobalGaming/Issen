import test from 'node:test';
import assert from 'node:assert/strict';
import { enemyGlyphCue } from '../../src/rendering/glyphs.ts';

test('entry fades never promote a waiting enemy to next or attacker brightness', () => {
  const waiting = enemyGlyphCue(false, 2);
  const next = enemyGlyphCue(false, 1);
  const attacking = enemyGlyphCue(true, 1);
  for (const entry of [0, 0.2, 0.5, 1, 2]) {
    const arriving = enemyGlyphCue(false, 2, entry);
    assert.equal(arriving.emphasis, 'waiting');
    assert.ok(arriving.alpha <= waiting.alpha);
    assert.ok(arriving.alpha < next.alpha);
    assert.ok(arriving.alpha < attacking.alpha);
  }
});

test('only the actual attacker gets attacking emphasis in ordered and unordered waves', () => {
  for (const rank of [0, 1, 2]) {
    assert.equal(enemyGlyphCue(true, rank).emphasis, 'attacking');
    assert.notEqual(enemyGlyphCue(false, rank).emphasis, 'attacking');
  }
  assert.equal(enemyGlyphCue(false, 0).emphasis, 'waiting');
  assert.equal(enemyGlyphCue(false, 1).emphasis, 'next');
});
