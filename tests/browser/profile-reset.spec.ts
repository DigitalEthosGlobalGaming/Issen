import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ body: '', contentType: 'text/css' }),
  );
});

for (const testing of [false, true]) {
  test(`Profile Management reset confirms and clears only the ${testing ? 'test' : 'player'} profile`, async ({
    page,
  }, info) => {
    await page.addInitScript((testing) => {
      if (sessionStorage.getItem('resetFixtureSeeded')) return;
      sessionStorage.setItem('resetFixtureSeeded', '1');
      sessionStorage.setItem('issen.testing', testing ? '1' : '0');
      for (const prefix of ['issen.', 'issen.testing.']) {
        localStorage.setItem(
          prefix + 'meta',
          JSON.stringify({
            schemaVersion: 3,
            embers: 999,
            earned: 999,
            tutorial: 'completed',
            bossMilestone: 3,
            revealSeen: 3,
            upgrades: { vitality: 3, offerings: 3, awakening: 2 },
          }),
        );
        localStorage.setItem(prefix + 'stats', JSON.stringify({ runs: 12, bestScore: 12345 }));
        localStorage.setItem(prefix + 'best', '12345');
        localStorage.setItem(
          prefix + 'unlocks',
          JSON.stringify(['steel', 'sumi', 'kuro', 'steel+', 'sumi+']),
        );
        localStorage.setItem(prefix + 'equip', JSON.stringify({ blade: 'kuro' }));
        localStorage.setItem(
          prefix + 'awakening',
          JSON.stringify({
            version: 1,
            blades: { steel: { k: 999 } },
            robes: { sumi: { k: 999 } },
          }),
        );
        localStorage.setItem(prefix + 'future', 'old');
      }
      localStorage.setItem('unrelated', 'keep');
    }, testing);
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#app')).toHaveCount(1);
    await expect(page.locator('.startup-loading')).toHaveCount(0);
    const snapshot = () => page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
    const before = await snapshot();
    await page.locator('#bOptions').click();
    await page.getByRole('button', { name: /^Profile Management/ }).click();
    await page.getByRole('button', { name: 'Reset profile', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: /^Reset / });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('cannot be undone');
    await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
    expect(await snapshot()).toEqual(before);
    await page.screenshot({ path: info.outputPath('reset-confirmation.png') });
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    expect(await snapshot()).toEqual(before);
    await page.getByRole('button', { name: 'Reset profile', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    expect(await snapshot()).toEqual(before);
    await page.getByRole('button', { name: 'Reset profile', exact: true }).click();
    await dialog.getByRole('button', { name: 'Delete all progress', exact: true }).click();
    await expect(page.locator('#title')).toHaveClass(/on/);
    await expect(dialog).not.toBeVisible();
    await expect(page.locator('.startup-loading')).toHaveCount(0);
    const after = await snapshot();
    const prefix = testing ? 'issen.testing.' : 'issen.';
    const meta = JSON.parse(after[prefix + 'meta']!);
    expect(meta.embers).toBe(0);
    expect(meta.bossMilestone).toBe(0);
    expect(meta.tutorial).toBe('new');
    expect(Object.values(meta.upgrades).every((value) => value === 0)).toBe(true);
    for (const key of ['best', 'stats', 'equip', 'future'])
      expect(after[prefix + key]).toBeUndefined();
    expect(after.unrelated).toBe('keep');
    for (const [key, value] of Object.entries(before)) {
      if (testing ? !key.startsWith(prefix) : key.startsWith('issen.testing.'))
        expect(after[key]).toBe(value);
    }
    await page.locator('#bPlay').click();
    await page.locator('#bBegin').click();
    await expect(page.locator('.tutorial-overlay')).toBeHidden();
    await expect(page.locator('#hud')).toHaveClass(/on/);
  });
}
