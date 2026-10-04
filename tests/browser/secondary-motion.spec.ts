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
        'window.__cloth = {P, apparelMotion, swingPlayer, update, render, frameLoop}; frameLoop.start();',
      ),
    });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  const result = await page.evaluate(() => {
    const h = (window as any).__cloth;
    h.frameLoop.stop();
    h.swingPlayer('right');
    for (let i = 0; i < 4; i++) h.update(0.02, 0.02);
    const motion = h.apparelMotion.sample();
    const pose = { ...h.P.pose };
    h.render(0.016);
    return { motion, unchanged: JSON.stringify(pose) === JSON.stringify(h.P.pose) };
  });
  expect(result.motion.cloth).toBeGreaterThan(0);
  expect(result.motion.charm).toBeGreaterThan(0);
  expect(result.unchanged).toBe(true);
  await page.screenshot({ path: info.outputPath('cut-with-sway.png') });
});
