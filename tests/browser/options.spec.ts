import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta'))
      localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }));
  });
});
const options = (page: import('@playwright/test').Page) => page.locator('#options');

test('legacy mute, live volume controls, persistence and category reset', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.settings')) localStorage.setItem('issen.muted', 'true');
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#mute')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#bOptions').click();
  await options(page)
    .getByRole('button', { name: /^Audio/ })
    .click();
  await expect(page.getByLabel('Master mute')).toBeChecked();
  await page.getByLabel('Master mute').uncheck();
  await expect(page.locator('#mute')).toHaveAttribute('aria-pressed', 'false');
  await page.getByLabel('Sound effects', { exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.settings')!).effectsVolume),
  ).toBe(0.95);
  await page.getByLabel('Ambience', { exact: true }).evaluate((input: HTMLInputElement) => {
    input.value = '35';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.keyboard.press('Escape');
  await expect(options(page).getByRole('button', { name: /^Audio/ })).toContainText('Ambience 35%');
  await options(page).getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('#title')).toHaveClass(/on/);
  await expect(page.locator('#bOptions')).toBeFocused();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#bOptions').click();
  await options(page)
    .getByRole('button', { name: /^Audio/ })
    .click();
  await expect(page.getByLabel('Sound effects', { exact: true })).toHaveValue('95');
  await expect(page.getByLabel('Ambience', { exact: true })).toHaveValue('35');
  await options(page).getByRole('button', { name: 'Restore defaults', exact: true }).click();
  await expect(page.getByLabel('Ambience', { exact: true })).toHaveValue('100');
});

test('Options preserves paused encounter state, checkpoint and return screen', async ({ page }) => {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        'window.__optionsHarness = { G: foundation.run.G, randomState: () => foundation.run.activity.runRandom.state() }; artworkReady = true;',
      ),
    });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  // Freeze an established encounter; pending scene entry intentionally commits
  // its wave/checkpoint while preserving pause (covered by scene-readiness).
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready');
  await expect.poll(() => page.evaluate(() => !!(window as any).__optionsHarness.G.cfg)).toBe(true);
  await page.keyboard.press('p');
  await page.locator('#bPauseOptions').click();
  const snapshot = () =>
    page.evaluate(() => {
      const { G, randomState } = (window as any).__optionsHarness;
      return {
        state: G.state,
        times: G.enemies.map((e: any) => e.t),
        score: G.score,
        random: randomState(),
        checkpoint: localStorage.getItem('issen.runCheckpoint'),
      };
    });
  const before = await snapshot();
  await options(page)
    .getByRole('button', { name: /^Display/ })
    .click();
  await page.getByLabel('Effects quality', { exact: true }).selectOption('low');
  await page.getByLabel('Reduced motion', { exact: true }).selectOption('on');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await page.waitForTimeout(200);
  expect(await snapshot()).toEqual(before);
  await page.keyboard.press('Escape');
  await options(page).getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('#paused')).toHaveClass(/on/);
  expect((await snapshot()).state).toBe('paused');
  await page.locator('#bResume').click();
  await expect.poll(async () => (await snapshot()).state).toBe('playing');
});

test('bindings reject conflicts, cancel capture, survive reload and drive the keyboard adapter', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bOptions').click();
  await options(page)
    .getByRole('button', { name: /^Controls/ })
    .click();
  await page.getByRole('button', { name: 'Change cut up binding' }).click();
  await page.keyboard.press('d');
  await expect(options(page).getByRole('status')).toContainText('already used');
  await page.keyboard.press('Escape');
  await expect(options(page).getByRole('status')).toContainText('cancelled');
  await page.getByRole('button', { name: 'Change cut up binding' }).click();
  await page.keyboard.press('i');
  await page.getByLabel('Swipe sensitivity', { exact: true }).selectOption('high');
  await page.keyboard.press('Escape');
  await options(page).getByRole('button', { name: 'Done', exact: true }).click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  const savedBindings = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('issen.settings')!),
  );
  await page.locator('#bOptions').click();
  await options(page)
    .getByRole('button', { name: /^Controls/ })
    .click();
  await expect(page.getByRole('button', { name: 'Change cut up binding' })).toHaveText('I');
  await expect(page.getByLabel('Swipe sensitivity', { exact: true })).toHaveValue('high');
  await options(page)
    .getByRole('button', { name: 'Restore default bindings', exact: true })
    .click();
  await expect(page.getByRole('button', { name: 'Change cut up binding' })).toHaveText('Up / W');
  await expect(page.getByLabel('Swipe sensitivity', { exact: true })).toHaveValue('high');
  await page.keyboard.press('Escape');
  await options(page).getByRole('button', { name: 'Done', exact: true }).click();
  const emitted = await page.evaluate(async (saved) => {
    const modulePath = '/src/input/keyboard.ts';
    const { bindKeyboard } = await import(modulePath);
    const calls: string[] = [];
    const dispose = bindKeyboard({
      state: () => ({ phase: 'playing', panelOpen: false, overReady: false }),
      bindings: () => saved.bindings,
      closePanel() {},
      titleDirection() {},
      start() {},
      resume() {},
      pause() {
        calls.push('pause');
      },
      swipe(dir: string) {
        calls.push(dir);
      },
      tapDown() {
        return false;
      },
      tap() {
        calls.push('tap');
      },
    });
    for (const key of ['i', 'w', ' ', 'Escape'])
      window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    dispose();
    return calls;
  }, savedBindings);
  expect(emitted).toEqual(['up', 'tap', 'pause']);
});

test('browser and native Back move up one menu level and cancel binding capture', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bOptions').click();
  await options(page)
    .getByRole('button', { name: /^Controls/ })
    .click();
  await page.getByRole('button', { name: 'Change cut left binding' }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('issen:back')));
  await expect(options(page).getByRole('status')).toContainText('cancelled');
  await page.evaluate(() => history.back());
  await expect(options(page).getByRole('heading', { name: 'Options', exact: true })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('issen:back')));
  await expect(options(page)).toBeHidden();
  await expect(page.locator('#title')).toHaveClass(/on/);
});

test('system preferences, Large text and touch controls fit both orientations', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#app')).toHaveClass(/reduced-motion/);
  await page.locator('#bOptions').click();
  await options(page)
    .getByRole('button', { name: /^Display/ })
    .click();
  await page.getByLabel('Interface text', { exact: true }).selectOption('large');
  await page.getByLabel('Reduced motion', { exact: true }).selectOption('off');
  await page.getByLabel('Reduced flashes', { exact: true }).selectOption('off');
  await expect(page.locator('#app')).not.toHaveClass(/reduced-motion/);
  await expect(page.locator('#app')).toHaveAttribute('data-reduced-flashes', 'false');
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport);
    expect(await options(page).evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await options(page)
      .getByRole('button', { name: 'Restore defaults', exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      options(page).getByRole('button', { name: 'Restore defaults', exact: true }),
    ).toBeInViewport();
    await page.getByLabel('Interface text', { exact: true }).selectOption('large');
  }
  await page.keyboard.press('Escape');
  await options(page).getByRole('button', { name: 'Done', exact: true }).click();
  await page.locator('#bArmory').click();
  expect(
    await page.locator('.armWrap').evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await expect(page.locator('.armHead [data-back]')).toBeVisible();
});

test('Options keyboard focus stays inside the menu and restore defaults is category scoped', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bOptions').click();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('#options'))).toBe(true);
  }
  await options(page)
    .getByRole('button', { name: /^Controls/ })
    .click();
  await page.getByLabel('Swipe sensitivity', { exact: true }).selectOption('low');
  await page.keyboard.press('Escape');
  await options(page)
    .getByRole('button', { name: /^Audio/ })
    .click();
  await page.getByLabel('Master mute').check();
  await options(page).getByRole('button', { name: 'Restore defaults', exact: true }).click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.settings')!).sensitivity),
  ).toBe('low');
});

test('testing-profile settings never overwrite player preferences', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('issen.testing', '1');
    localStorage.setItem('issen.muted', 'true');
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bOptions').click();
  await options(page)
    .getByRole('button', { name: /^Audio/ })
    .click();
  await page.getByLabel('Master mute').check();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.testing.settings')!).muted),
  ).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('issen.settings'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('issen.muted'))).toBe('true');
});

test('reopening after browser Forward cannot trap Options in stale history entries', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bOptions').click();
  await options(page).getByRole('button', { name: 'Done', exact: true }).click();
  await expect(options(page)).toBeHidden();
  await page.evaluate(() => history.forward());
  await page.locator('#bOptions').click();
  await options(page).getByRole('button', { name: 'Done', exact: true }).click();
  await expect(options(page)).toBeHidden();
  await expect(page.locator('#title')).toHaveClass(/on/);
});

test('explicit motion overrides control result tallies and setup reveal animation', async ({
  page,
}) => {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        'window.__motionHarness = { runResults: ui.runResults }; artworkReady = true;',
      ),
    });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bOptions').click();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Display/ })
    .click();
  await page.getByLabel('Reduced motion', { exact: true }).selectOption('on');
  await page.evaluate(() =>
    (window as any).__motionHarness.runResults.start(
      { before: 0, gained: 7, after: 7 },
      [],
      () => {},
    ),
  );
  await expect(page.locator('#runResultSequence')).not.toHaveClass(/animating/);
  await expect(page.locator('#resultEmbers')).toHaveText('7');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByLabel('Reduced motion', { exact: true }).selectOption('off');
  await page.evaluate(() =>
    (window as any).__motionHarness.runResults.start(
      { before: 0, gained: 100, after: 100 },
      [],
      () => {},
    ),
  );
  await expect(page.locator('#runResultSequence')).toHaveClass(/animating/);
  const animation = await page.evaluate(() => {
    const card = document.createElement('div');
    card.className = 'setup-reveal';
    document.querySelector('#app')!.append(card);
    const name = getComputedStyle(card).animationName;
    card.remove();
    return name;
  });
  expect(animation).toBe('setup-ink-reveal');
});

test('Scrolls are permanent and survive legacy preferences and Display reset', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#app')).toHaveAttribute('data-menu-style', 'scroll');
  await page.locator('#bOptions').click();
  await options(page)
    .getByRole('button', { name: /^Display/ })
    .click();
  await expect(page.getByLabel('Menus', { exact: true })).toHaveCount(0);
  await expect(page.locator('#app')).toHaveAttribute('data-menu-style', 'scroll');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#app')).toHaveAttribute('data-menu-style', 'scroll');
  await page.locator('#bPlay').click();
  await expect(page.locator('#setup')).toHaveClass(/on/);
  await expect(page.locator('#bBegin')).toBeVisible();
  await page.locator('#setup [data-back]').click();
  await page.locator('#bOptions').click();
  await options(page)
    .getByRole('button', { name: /^Display/ })
    .click();
  await page.getByLabel('Reduced motion', { exact: true }).selectOption('on');
  await page.keyboard.press('Escape');
  await options(page).getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('.scroll-entering, .scroll-leaving')).toHaveCount(0);
  await page.locator('#bOptions').click();
  await options(page)
    .getByRole('button', { name: /^Display/ })
    .click();
  await options(page).getByRole('button', { name: 'Restore defaults', exact: true }).click();
  await expect(page.getByLabel('Menus', { exact: true })).toHaveCount(0);
  await expect(page.locator('#app')).toHaveAttribute('data-menu-style', 'scroll');
});

test('scroll presentation disposes pending rolls and respects reduced motion', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(async () => {
    const path = '/src/ui/scroll-menus.ts';
    const { createScrollMenus } = await import(path);
    const root = document.createElement('div');
    root.innerHTML = '<div class="screen"><div class="box"><button>Choose</button></div></div>';
    document.body.append(root);
    const screen = root.firstElementChild as HTMLElement;
    const menus = createScrollMenus(root);
    const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
    menus.update('scroll', false);
    screen.classList.add('on');
    await flush();
    const enters = screen.classList.contains('scroll-entering');
    screen.classList.remove('on');
    await flush();
    const leaves = screen.classList.contains('scroll-leaving') && screen.inert;
    menus.update('scroll', true);
    const cleared = !screen.inert && !screen.classList.contains('scroll-leaving');
    screen.classList.add('on');
    await flush();
    const still = !screen.classList.contains('scroll-entering');
    menus.update('scroll', false);
    screen.classList.remove('on');
    await flush();
    menus.dispose();
    const disposed =
      !screen.inert && !root.dataset.menuStyle && !screen.classList.contains('scroll-leaving');
    root.remove();
    return { enters, leaves, cleared, still, disposed };
  });
  expect(result).toEqual({
    enters: true,
    leaves: true,
    cleared: true,
    still: true,
    disposed: true,
  });
});
