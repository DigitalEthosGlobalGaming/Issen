import test from 'node:test';
import assert from 'node:assert/strict';
import { createScreenAnimation, SCREEN_ANIMATION } from '../../src/ui/screen-animation.ts';

test('every snapshot screen settles, with independent Armoury presentation', () => {
  for (const [screen, policy] of Object.entries(SCREEN_ANIMATION)) {
    let now = 0;
    const animation = createScreenAnimation(() => now, 'title');
    animation.show(screen);
    assert.equal(animation.demand().render, true);
    now = 451;
    assert.deepEqual(animation.demand(), {
      update: policy.scene === 'animated',
      render: policy.scene === 'animated',
      afterRender: !!policy.preview,
    });
    animation.invalidate();
    assert.equal(animation.demand().render, true);
    now += 451;
    animation.show(null);
    assert.equal(animation.demand().update, true);
  }
});

test('covered Armoury keeps only its preview active; return restores the scene', () => {
  let now = 0;
  const animation = createScreenAnimation(() => now, 'armory');
  assert.deepEqual(animation.demand(true), { update: false, render: false, afterRender: true });
  now = 5000;
  animation.invalidate();
  now = 10000;
  assert.equal(animation.demand(true).render, false);
  assert.equal(animation.demand().render, true);
  assert.equal(animation.demand().render, false);
  animation.show('title');
  assert.deepEqual(animation.demand(), { update: true, render: true, afterRender: false });
});
