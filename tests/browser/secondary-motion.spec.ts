import { expect, test } from '@playwright/test';

test('player cuts move existing cloth and charm sprites without changing the simulation pose during drawing', async ({
  page,
}, info) => {
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ body: '', contentType: 'text/css' }),
  );
  await page.addInitScript(() => {
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }));
    localStorage.setItem('issen.unlocks', JSON.stringify(['suzu']));
    localStorage.setItem('issen.equip', JSON.stringify({ charm: 'suzu' }));
  });
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'frameLoop.start();',
        'window.__cloth = {P, G, killEnemy, apparelMotion, swingPlayer, update, render, frameLoop}; frameLoop.start();',
      ),
    });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  const result = await page.evaluate(() => {
    const h = (window as any).__cloth;
    h.frameLoop.stop();
    h.swingPlayer('right');
    for (let i = 0; i < 4; i++) h.update(0.02, 0.02);
    const motion = h.apparelMotion.sample();
    const pose = { ...h.P.pose };
    h.render(0.016);
    const unchanged = JSON.stringify(pose) === JSON.stringify(h.P.pose);
    for (let i = 0; i < 150 && !h.G.enemies.length; i++) h.update(0.02, 0.02);
    const template = h.G.enemies[0];
    if (!template) throw new Error('Expected a wave enemy');
    const cut = (progress: number) => {
      h.apparelMotion.reset();
      const enemy = { ...template, state: 'attack', p: progress, dir: 'right' };
      h.G.enemies = [enemy];
      h.G.attacker = enemy;
      const before = h.G.perfects;
      h.killEnemy(enemy, 'right');
      for (let i = 0; i < 10; i++) h.apparelMotion.update(1 / 120);
      return { ...h.apparelMotion.sample(), perfects: h.G.perfects - before };
    };
    const ordinary = cut(0.5),
      perfect = cut(0.95);
    h.render(0.016);
    return { motion, unchanged, ordinary, perfect };
  });
  expect(result.motion.cloth).toBeGreaterThan(0);
  expect(result.motion.charm).toBeGreaterThan(0);
  expect(result.unchanged).toBe(true);
  expect(result.ordinary.perfects).toBe(0);
  expect(result.perfect.perfects).toBe(1);
  expect(result.perfect.cloth).toBeGreaterThan(result.ordinary.cloth * 2);
  expect(result.perfect.charm).toBeGreaterThan(result.ordinary.charm * 2);
  await page.screenshot({ path: info.outputPath('cut-with-sway.png') });
});
