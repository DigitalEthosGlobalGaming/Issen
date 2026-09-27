import { expect, test } from '@playwright/test';

test('fresh journey starts skippable tutorial, persists skip and hides locked modes', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.locator('#bPlay').click();
  for (const selector of ['[data-v="rush"]', '[data-v="ronin"]', '[data-k="arrows"] [data-v="0"]'])
    await expect(page.locator('#setup ' + selector)).toBeHidden();
  await page.locator('#bBegin').click();
  await expect(page.locator('.tutorial-overlay')).toBeVisible();
  await page.getByRole('button', { name: 'Skip tutorial' }).click();
  await expect(page.locator('.tutorial-overlay')).toBeHidden();
  await expect(page.locator('#hud')).toHaveClass(/on/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('issen.meta')!).tutorial)).toBe(
    'skipped',
  );
  await page.reload();
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('.tutorial-overlay')).toBeHidden();
  expect(errors).toEqual([]);
});

test('Template donations persist and apply only to standard runs', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta'))
      localStorage.setItem(
        'issen.meta',
        JSON.stringify({ tutorial: 'skipped', bossMilestone: 3, revealSeen: 3, embers: 800 }),
      );
  });
  await page.goto('/');
  await page.locator('#bTemplate').click();
  await expect(page.locator('#template')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: '.verification-build-next-features/template-portrait.png' });
  await page.locator('[data-upgrade="vitality"]').click();
  await page.getByRole('button', { name: 'Donate 100 Embers' }).click();
  await expect(page.locator('#templateContent')).toContainText('700 Embers');
  await page.getByRole('button', { name: 'Donate 200 Embers' }).click();
  await page.getByRole('button', { name: 'Donate 350 Embers' }).click();
  await expect(page.locator('#templateContent')).toContainText('150 Embers');
  await expect(page.getByRole('button', { name: 'Fully donated' })).toBeDisabled();
  await page.reload();
  await page.locator('#bTemplate').click();
  await expect(page.locator('#templateContent')).toContainText('Vitality · 3/3');
  await page.locator('#template [data-back]').click();
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#lives i')).toHaveCount(5);
  await page.reload();
  await page.locator('#bPlay').click();
  await page.locator('[data-v="rush"]').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#lives i')).toHaveCount(2);
});

test('testing tools isolate profile, jump encounters and repair removed equipment', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta'))
      localStorage.setItem('issen.meta', JSON.stringify({ tutorial: 'skipped', embers: 42 }));
    localStorage.setItem(
      'issen.testing.guidedLessons',
      JSON.stringify({ order: true, bossParry: true }),
    );
  });
  await page.goto('/');
  const original = await page.evaluate(() => localStorage.getItem('issen.meta'));
  await page.keyboard.press('Control+Shift+A');
  await expect(page.locator('#admin')).toHaveClass(/on/);
  await page.getByRole('button', { name: 'Enter test profile', exact: true }).click();
  await expect(page.locator('#testBadge')).toBeVisible();
  await page.keyboard.press('Control+Shift+A');
  await page.getByRole('button', { name: 'Set Embers', exact: true }).click();
  await expect(page.locator('#admin')).toHaveCSS('opacity', '1');
  await page.locator('#admin').evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.screenshot({ path: '.verification-build-next-features/admin-portrait.png' });
  await page.getByLabel('Item or awakening').selectOption('kuro');
  await page.getByRole('button', { name: 'Equip item', exact: true }).click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.testing.equip')!).blade),
  ).toBe('kuro');
  await page.getByRole('button', { name: 'Remove item', exact: true }).click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.testing.equip')!).blade),
  ).toBe('steel');
  await page.getByLabel('Stage', { exact: true }).selectOption('2');
  await page.getByRole('button', { name: 'Jump to boss', exact: true }).click();
  await expect(page.locator('#bossbar')).toHaveClass(/on/);
  await page.keyboard.press('Control+Shift+A');
  await page.getByRole('spinbutton', { name: 'Lives', exact: true }).fill('9');
  await page.getByRole('button', { name: 'Set lives', exact: true }).click();
  await expect(page.locator('#lives i')).toHaveCount(9);
  await page.getByRole('button', { name: 'Return to player profile', exact: true }).click();
  await expect(page.locator('#testBadge')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('issen.meta'))).toBe(original);
  expect(await page.evaluate(() => localStorage.getItem('issen.stats'))).toBeNull();
});

test('boss victory waits until run end to award Embers and reveal Boss Rush once', async ({
  page,
}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('issen.testing', '1');
    if (!localStorage.getItem('issen.testing.meta'))
      localStorage.setItem('issen.testing.meta', JSON.stringify({ tutorial: 'skipped' }));
    localStorage.setItem(
      'issen.testing.guidedLessons',
      JSON.stringify({ order: true, bossParry: true }),
    );
    Math.random = () => 0.5;
    let next = 0,
      time = 0;
    const pending = new Map<number, FrameRequestCallback>();
    window.requestAnimationFrame = (cb) => {
      pending.set(++next, cb);
      return next;
    };
    window.cancelAnimationFrame = (id) => {
      pending.delete(id);
    };
    (window as any).advance = (count: number) => {
      if (!time) time = performance.now();
      for (let i = 0; i < count; i++) {
        time += 50;
        const callbacks = [...pending.values()];
        pending.clear();
        for (const cb of callbacks) cb(time);
      }
    };
  });
  await page.goto('/');
  await page.keyboard.press('Control+Shift+A');
  await page
    .getByRole('button', { name: 'Jump to boss', exact: true })
    .evaluate((b: HTMLButtonElement) => b.click());
  const advance = (n: number) => page.evaluate((n) => (window as any).advance(n), n);
  const cut = () =>
    page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    });
  await advance(77);
  await cut();
  await advance(54);
  await cut();
  await advance(54);
  await cut();
  const pending = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('issen.testing.meta')!),
  );
  expect(pending.bossMilestone).toBe(0);
  expect(pending.embers).toBe(0);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.testing.unlocks') || '[]')),
  ).not.toContain('kuro');
  await page.keyboard.press('p');
  await page.locator('#bEnd').evaluate((button: HTMLButtonElement) => button.click());
  const meta = await page.evaluate(() => JSON.parse(localStorage.getItem('issen.testing.meta')!));
  expect(meta.bossMilestone).toBe(1);
  expect(meta.embers).toBe(12);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.testing.unlocks')!)),
  ).toContain('kuro');
  await expect(page.locator('#runResultSequence')).toContainText('Embers gathered');
  await expect(page.locator('#resultGain')).not.toHaveAttribute('hidden', '');
  await expect(page.locator('#resultGain')).toHaveCSS('animation-name', 'ember-feed');
  await expect(page.locator('#resultEmbers')).toHaveCSS('animation-name', 'ember-ignite');
  await advance(30);
  await expect(page.locator('#resultEmbers')).toHaveText('12');
  await expect(page.locator('#resultGain')).toBeHidden();
  await page.locator('#runResultSequence').evaluate((el: HTMLElement) => el.click());
  await page.locator('#runResultSequence').evaluate((el: HTMLElement) => el.click());
  await expect(page.locator('#runResultSequence')).toContainText('Boss Rush');
  await page.locator('#runResultSequence').evaluate((el: HTMLElement) => el.click());
  await page.locator('#runResultSequence').evaluate((el: HTMLElement) => el.click());
  await expect(page.locator('#oEmberGain')).toHaveText('+12 Embers');
  await expect(page.locator('#oEmberTotal')).toHaveText('12 total');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.testing.meta')!).embers),
  ).toBe(12);
  await page.reload();
  await page.locator('#bPlay').evaluate((b: HTMLButtonElement) => b.click());
  await expect(page.locator('#setupReveals')).toBeHidden();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.testing.meta')!).revealSeen),
  ).toBe(1);
  await expect(page.locator('[data-v="rush"]')).not.toHaveAttribute('hidden', '');
});
