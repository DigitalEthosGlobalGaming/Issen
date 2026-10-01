import { expect, test } from '@playwright/test';

test.use({ hasTouch: true });

test('portrait setup gates special lives until Vitality and hides Arrows until Blade Only', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({ schemaVersion: 4, tutorial: 'skipped', embers: 100 }),
    );
  });
  await page.goto('/');
  await page.locator('#bPlay').click();
  await expect(page.locator('#livesOption')).toBeHidden();
  await expect(page.locator('#setup [data-k="lives"] [data-v="0"]')).toBeHidden();
  await expect(page.locator('#setup [data-k="lives"] [data-v="zen"]')).toBeHidden();
  await expect(page.locator('#arrowsOption')).toBeHidden();
  await page.locator('#setup [data-back]').click();
  await page.locator('#bTemplate').click();
  await page.locator('[data-upgrade="vitality"]').click();
  await page.getByRole('button', { name: 'Donate 100 Embers' }).click();
  await page.locator('#template [data-back]').click();
  await page.locator('#bPlay').click();
  await expect(page.locator('#livesOption')).toBeVisible();
  await expect(page.locator('#setup [data-k="lives"] [data-v="0"]')).toBeVisible();
  await expect(page.locator('#setup [data-k="lives"] [data-v="zen"]')).toBeVisible();
  await expect(page.locator('#arrowsOption')).toBeHidden();
  await page.locator('#setup [data-k="lives"] [data-v="zen"]').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('issen.setup')!).lives)).toBe(
    'zen',
  );
});

test('reduced-motion result tally advances by keyboard without paying twice', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }));
  });
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await page.keyboard.press('p');
  await page.locator('#bEnd').click();
  await expect(page.locator('#runResultSequence')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await expect(page.locator('#resultGain')).toHaveText('+0');
  await page.keyboard.press('Space');
  await expect(page.locator('#runResultSequence')).toBeHidden();
  await expect(page.locator('#bAgain')).toBeEnabled();
  const meta = await page.evaluate(() => JSON.parse(localStorage.getItem('issen.meta')!));
  expect(meta.embers).toBe(0);
  expect(meta.earned).toBe(0);
});

test('Armoury sorts owned gear first and underlines unread gear until its detail is viewed', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }));
    localStorage.setItem('issen.unlocks', JSON.stringify(['kuro']));
    if (!localStorage.getItem('issen.armorySeen'))
      localStorage.setItem(
        'issen.armorySeen',
        JSON.stringify([
          'steel',
          'sumi',
          'nocrest',
          'nopet',
          'nocharm',
          'ink',
          'mono',
          'verm',
          'supporter-print',
        ]),
      );
  });
  await page.goto('/');
  await expect(page.locator('#bArmory .arm-label')).toHaveCSS('text-decoration-line', 'underline');
  await page.locator('#bArmory').click();
  await expect(page.locator('#armTabs [aria-selected="true"] .arm-label')).toHaveCSS(
    'text-decoration-line',
    'underline',
  );
  await expect(page.locator('#armTiles .tile').nth(0)).toContainText('Tamahagane');
  await expect(page.locator('#armTiles .tile').nth(1)).toContainText('Kurogane');
  await expect(page.locator('#armTiles .arm-unread')).toHaveCount(1);
  await expect(page.locator('#armTiles .arm-unread .tn')).toHaveCSS(
    'text-decoration-line',
    'underline',
  );
  await page.locator('#armory [data-back]').click();
  await expect(page.locator('#bArmory')).toHaveClass(/arm-unread/);
  await page.locator('#bArmory').click();
  await page.locator('#armTiles').getByRole('button', { name: 'Kurogane' }).click();
  await expect(page.locator('#armTiles .arm-unread')).toHaveCount(0);
  await expect(page.locator('#armTabs .arm-unread')).toHaveCount(0);
  await page.locator('#armory [data-back]').click();
  await expect(page.locator('#bArmory')).not.toHaveClass(/arm-unread/);
  await page.reload();
  await expect(page.locator('#bArmory')).not.toHaveClass(/arm-unread/);
});

for (const input of ['keyboard', 'touch'] as const) {
  test(`first ordered encounter accepts a safe ${input} cut without a dismissible message`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('issen.testing', '1');
      localStorage.setItem(
        'issen.testing.meta',
        JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }),
      );
      let next = 0,
        time = 0;
      const pending = new Map<number, FrameRequestCallback>();
      window.requestAnimationFrame = (callback) => {
        pending.set(++next, callback);
        return next;
      };
      window.cancelAnimationFrame = (handle) => {
        pending.delete(handle);
      };
      (window as any).advance = (count: number) => {
        if (!time) time = performance.now();
        for (let i = 0; i < count; i++) {
          time += 50;
          const callbacks = [...pending.values()];
          pending.clear();
          for (const callback of callbacks) callback(time);
        }
      };
    });
    await page.goto('/');
    await page.keyboard.press('Control+Shift+A');
    await page.getByLabel('Wave within stage').selectOption('3');
    await page
      .getByRole('button', { name: 'Jump to wave', exact: true })
      .evaluate((button: HTMLButtonElement) => button.click());
    for (
      let i = 0;
      i < 20 && !(await page.getByRole('heading', { name: 'Cut the front enemy' }).isVisible());
      i++
    )
      await page.evaluate(() => (window as any).advance(10));
    await expect(page.getByRole('heading', { name: 'Cut the front enemy' })).toBeVisible();
    await expect(page.locator('.guided-overlay button')).toHaveCount(0);
    await expect(page.locator('#hint')).not.toContainText('They strike in order now');
    await page.evaluate(() => (window as any).advance(80));
    await expect(page.getByRole('heading', { name: 'Cut the front enemy' })).toBeVisible();
    // A touch tap must leave the lesson active while allowing the next gesture to swipe.
    if (input === 'touch') {
      await page.touchscreen.tap(195, 500);
      await expect(page.getByRole('heading', { name: 'Cut the front enemy' })).toBeVisible();
    }
    const touch = input === 'touch' ? await page.context().newCDPSession(page) : null;
    for (const [direction, dx, dy] of [
      ['ArrowUp', 0, -90],
      ['ArrowDown', 0, 90],
      ['ArrowLeft', -90, 0],
      ['ArrowRight', 90, 0],
    ] as const) {
      if (!(await page.locator('.guided-overlay').isVisible())) break;
      if (touch) {
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x: 195, y: 500 }],
        });
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: 195 + dx, y: 500 + dy }],
        });
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else await page.keyboard.press(direction);
    }
    await touch?.detach();
    await expect(page.locator('.guided-overlay')).toBeHidden();
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('issen.testing.guidedLessons')!).order,
      ),
    ).toBe(true);
  });
}

test('first boss holds the glint until the player parries with touch', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('issen.testing', '1');
    localStorage.setItem(
      'issen.testing.meta',
      JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }),
    );
    let next = 0,
      time = 0;
    const pending = new Map<number, FrameRequestCallback>();
    window.requestAnimationFrame = (callback) => {
      pending.set(++next, callback);
      return next;
    };
    window.cancelAnimationFrame = (handle) => {
      pending.delete(handle);
    };
    (window as any).advance = (count: number) => {
      if (!time) time = performance.now();
      for (let i = 0; i < count; i++) {
        time += 50;
        const callbacks = [...pending.values()];
        pending.clear();
        for (const callback of callbacks) callback(time);
      }
    };
  });
  await page.goto('/');
  await page.keyboard.press('Control+Shift+A');
  await page
    .getByRole('button', { name: 'Jump to boss', exact: true })
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByRole('heading', { name: 'Watch for the glint' })).toBeVisible();
  await expect(page.locator('.guided-overlay button')).toHaveCount(0);
  await expect(page.locator('#hint')).not.toContainText('A duel. Wait for the glint');
  for (
    let i = 0;
    i < 60 && !(await page.getByRole('heading', { name: 'Parry now' }).isVisible());
    i++
  )
    await page.evaluate(() => (window as any).advance(10));
  await expect(page.getByRole('heading', { name: 'Parry now' })).toBeVisible();
  await page.evaluate(() => (window as any).advance(100));
  await expect(page.getByRole('heading', { name: 'Parry now' })).toBeVisible();
  await page.touchscreen.tap(195, 500);
  await expect(page.locator('.guided-overlay')).toBeHidden();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('issen.testing.guidedLessons')!).bossParry,
    ),
  ).toBe(true);
});
