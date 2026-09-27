import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
const packageInfo = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);

test('portrait title and setup fit while Temple uses compact top-centred details', async ({
  page,
}, info) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({ schemaVersion: 3, bossMilestone: 3, revealSeen: 3, tutorial: 'skipped' }),
    ),
  );
  for (const size of [
    { width: 390, height: 844 },
    { width: 360, height: 640 },
  ]) {
    await page.setViewportSize(size);
    await page.goto('/');
    await expect(page.locator('#bTemplate')).toHaveText('Temple');
    await expect(page.locator('#title .title-version')).toHaveText(`v${packageInfo.version}`);
    const fits = async (id: string) =>
      page.locator(id).evaluate((el) => ({
        height: el.scrollHeight <= el.clientHeight + 1,
        width: el.scrollWidth <= el.clientWidth + 1,
      }));
    expect(await fits('#title')).toEqual({ height: true, width: true });
    await page.locator('#bPlay').click();
    await expect(page.locator('#setup')).toHaveCSS('opacity', '1');
    await page.screenshot({ path: info.outputPath(`setup-${size.width}.png`) });
    expect(
      await fits('#setup'),
      JSON.stringify(
        await page.locator('#setup').evaluate((el) => ({
          height: el.clientHeight,
          scroll: el.scrollHeight,
          children: [...el.querySelectorAll('.box > *')].map((e) => ({
            name: e.className,
            height: e.getBoundingClientRect().height,
          })),
        })),
      ),
    ).toEqual({ height: true, width: true });
    await page.locator('#setup [data-back]').click();
    await page.locator('#bTemplate').click();
    await expect(page.locator('#template')).toHaveCSS('opacity', '1');
    await expect(page.locator('#template h2')).toHaveText('Temple');
    await expect(page.locator('#template')).not.toContainText(
      /earned through play|suppresses|challenge modes|Need .* more|Choose a blessing/,
    );
    await expect(page.locator('[data-upgrade="vitality"] span').last()).toHaveText('100');
    const icon = await page.locator('.template-detail svg').boundingBox();
    const heading = await page.locator('.template-detail h3').boundingBox();
    expect(icon!.y + icon!.height).toBeLessThanOrEqual(heading!.y);
    const done = page.locator('#template [data-back]');
    await expect(done).toHaveText('Done');
    const doneBox = await done.boundingBox();
    const titleBox = await page.locator('#template h2').boundingBox();
    expect(doneBox!.x).toBeGreaterThan(titleBox!.x + titleBox!.width);
    expect(doneBox!.y).toBeLessThan(60);
    const tiles = await page.locator('.upgrade-tile').evaluateAll((nodes) =>
      nodes.map((node) => ({
        x: node.getBoundingClientRect().x,
        y: node.getBoundingClientRect().y,
        bottom: node.getBoundingClientRect().bottom,
      })),
    );
    expect(tiles[0]!.y).toBe(tiles[2]!.y);
    expect(tiles[5]!.bottom).toBeLessThan(size.height);
    await page.screenshot({ path: info.outputPath(`temple-${size.width}.png`) });
  }
});

test('Temple rank one unlocks only weapons; rank two reveals outfit challenges', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta'))
      localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 3, embers: 500 }));
  });
  await page.goto('/');
  await page.locator('#bTemplate').click();
  await page.locator('[data-upgrade="awakening"]').click();
  await page.getByRole('button', { name: 'Donate 200 Embers' }).click();
  await page.locator('#template [data-back]').click();
  await page.locator('#bArmory').click();
  await expect(page.locator('#armInfo')).toContainText('Cut down');
  await page.getByRole('tab', { name: /^Outfits/ }).click();
  await expect(page.locator('#armInfo')).not.toContainText('Cut down');
  await page.locator('#armory [data-back]').click();
  await page.locator('#bTemplate').click();
  await page.getByRole('button', { name: 'Donate 300 Embers' }).click();
  await page.locator('#template [data-back]').click();
  await page.locator('#bArmory').click();
  await page.getByRole('tab', { name: /^Outfits/ }).click();
  await expect(page.locator('#armInfo')).toContainText('Cut down 120 foes');
  await page.reload();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.meta')!).upgrades.awakening),
  ).toBe(2);
});

test('admin clear requires confirmation and resets only test profile', async ({ page }) => {
  await page.goto('/');
  const player = await page.evaluate(() =>
    Object.fromEntries(
      Object.entries(localStorage).filter(([key]) => !key.startsWith('issen.testing.')),
    ),
  );
  await page.keyboard.press('Control+Shift+A');
  await page.getByRole('button', { name: 'Enter test profile', exact: true }).click();
  await expect(page.locator('#testBadge')).toBeVisible();
  await page.keyboard.press('Control+Shift+A');
  await page.getByRole('button', { name: 'Set Embers', exact: true }).click();
  await page.getByRole('button', { name: 'Clear test profile', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.testing.meta')!).embers),
  ).toBe(1000);
  await page.getByRole('button', { name: 'Clear test profile', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm clear test profile', exact: true }).click();
  await expect(page.locator('#title')).toHaveClass(/on/);
  await expect(page.locator('#testBadge')).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.testing.meta')!).embers),
  ).toBe(0);
  expect(
    await page.evaluate(() =>
      Object.fromEntries(
        Object.entries(localStorage).filter(([key]) => !key.startsWith('issen.testing.')),
      ),
    ),
  ).toEqual(player);
});
