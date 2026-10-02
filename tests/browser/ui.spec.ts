import { expect, test } from '@playwright/test';

// These regressions exercise established gameplay; onboarding has dedicated coverage.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta')) {
      localStorage.setItem(
        'issen.meta',
        JSON.stringify({
          tutorial: 'skipped',
          bossMilestone: 3,
          revealSeen: 3,
        }),
      );
    }
  });
});

test('HUD handles life modes, combo scoring, and exclusive screen navigation', async ({ page }) => {
  await page.goto('/');
  await page.locator('#app').waitFor();
  const result = await page.evaluate(async () => {
    const hudPath = '/src/ui/hud.ts',
      statePath = '/src/game/run-state.ts';
    const { createHud } = await import(hudPath);
    const { createRunState } = await import(statePath);
    const root = document.querySelector('#app')!.cloneNode(true) as HTMLElement;
    const hud = createHud(root),
      run = createRunState();
    run.maxLives = 4;
    run.lives = 2;
    run.combo = 5;
    run.score = 123;
    hud.render(run, true);
    hud.renderScore(run);
    const normal = {
      lives: root.querySelectorAll('#lives i').length,
      gone: root.querySelectorAll('#lives .gone').length,
      score: root.querySelector('#score')!.textContent,
      combo: root.querySelector('#combo')!.textContent,
    };
    run.zen = true;
    run.maxCombo = 12;
    hud.render(run, true);
    hud.renderScore(run);
    const endless = {
      lives: root.querySelectorAll('#lives i').length,
      score: root.querySelector('#score')!.textContent,
      combo: root.querySelector('#combo')!.textContent,
    };
    run.zen = false;
    run.hard = true;
    hud.renderLives(run);
    if (root.querySelector('#lives')!.childElementCount)
      throw new Error('No-lives mode shows lives');
    hud.renderBossHealth({ maxHp: 5, hp: 3 });
    if (root.querySelectorAll('#bossHp .gone').length !== 2) throw new Error('Wrong boss health');
    hud.showScreen('armory');
    hud.showScreen('stats');
    if (hud.activeScreen !== 'stats' || root.querySelectorAll('.screen.on').length !== 1)
      throw new Error('Screens overlap');
    hud.showScreen(null);
    return { normal, endless, screen: hud.activeScreen };
  });
  expect(result).toEqual({
    normal: { lives: 4, gone: 2, score: '123', combo: '5 連  ×1.5' },
    endless: { lives: 0, score: '5 連', combo: 'Longest 12' },
    screen: null,
  });
});

test('life display outlines an available ward and clears it when spent', async ({ page }) => {
  await page.goto('/');
  await page.locator('#app').waitFor();
  const states = await page.evaluate(async () => {
    const { createHud } = await import('/src/ui/hud.ts');
    const { createRunState } = await import('/src/game/run-state.ts');
    const root = document.querySelector('#app')!.cloneNode(true) as HTMLElement;
    const hud = createHud(root);
    const run = createRunState();
    run.lives = 2;
    hud.renderLives(run);
    const before = root.querySelector('#lives')!.classList.contains('warded');
    run.blessingTriggers.flourishWard = true;
    hud.renderLives(run);
    const protectedState = {
      outlined: root.querySelector('#lives')!.classList.contains('warded'),
      label: root.querySelector('#lives')!.getAttribute('aria-label'),
    };
    run.blessingTriggers.flourishWard = false;
    hud.renderLives(run);
    return {
      before,
      protectedState,
      after: root.querySelector('#lives')!.classList.contains('warded'),
    };
  });
  expect(states).toEqual({
    before: false,
    protectedState: { outlined: true, label: '2 lives, 1 ward ready' },
    after: false,
  });
});

test('armory preserves locked equipment and toggles awakened blades only on repeat selection', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#app').waitFor();
  const result = await page.evaluate(async () => {
    const armoryPath = '/src/ui/screens/armory.ts';
    const savesPath = '/src/platform/saves.ts';
    const itemsPath = '/src/game/content/items.ts';
    const { createArmoryScreen } = await import(armoryPath);
    const { DEFAULT_EQUIPMENT, parseStatistics } = await import(savesPath);
    const { createItems } = await import(itemsPath);
    const root = document.querySelector('#armory')!.cloneNode(true) as HTMLElement;
    const equipment = { ...DEFAULT_EQUIPMENT };
    const unlocks = new Set(['steel', 'kuro', 'kuro+', 'ink']);
    let saves = 0,
      awakenings = 0,
      previews = 0;
    const controller = createArmoryScreen(root, {
      items: createItems(() => unlocks),
      equipment,
      unlocks,
      statistics: parseStatistics({}),
      seals: {},
      charms: {},
      awakeningAccess: () => true,
      events: { equipped: () => saves++, awaken: () => awakenings++, preview: () => previews++ },
    });
    const click = (selector: string) => root.querySelector<HTMLButtonElement>(selector)!.click();
    controller.render();
    click('[aria-label="Beni (locked)"]');
    if (equipment.blade !== 'steel' || saves !== 0) throw new Error('Locked item equipped');
    if (!root.querySelector('#armInfo')!.textContent!.includes('Locked'))
      throw new Error('Missing locked details');
    click('[aria-label="Kurogane"]');
    if (equipment.blade !== 'kuro' || equipment.bladeSp)
      throw new Error('First selection must equip normally');
    click('[aria-label="Kurogane"]');
    if (!equipment.bladeSp || !root.querySelector('.awake'))
      throw new Error('Repeat selection did not awaken');
    click('[aria-label="Kurogane"]');
    if (equipment.bladeSp) throw new Error('Repeat selection did not restore normal blade');
    const tab = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find((el) =>
      el.textContent!.startsWith('Kill effects'),
    )!;
    tab.click();
    click('#prevC');
    if (controller.tab !== 'fx' || previews !== 1) throw new Error('Preview tab not routed');
    controller.dispose();
    click('#prevC');
    return {
      saves,
      awakenings,
      previews,
      remainingTiles: root.querySelector('#armTiles')!.childElementCount,
    };
  });
  expect(result).toEqual({ saves: 3, awakenings: 1, previews: 1, remainingTiles: 0 });
});

test('shrine screen replaces old offers and dispatches the chosen blessing once', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#app').waitFor();
  await page.evaluate(async () => {
    const screenPath = '/src/ui/screens/shrine.ts';
    const contentPath = '/src/game/content/blessings.ts';
    const { renderShrine } = await import(screenPath);
    const { BLESS } = await import(contentPath);
    const list = document.createElement('div');
    list.id = 'testShrine';
    list.style.cssText = 'position:fixed;inset:0;z-index:9999;background:white;pointer-events:auto';
    document.body.append(list);
    const choose = (blessing: { id: string }) => {
      list.dataset.selected = blessing.id;
      list.dataset.count = String(Number(list.dataset.count || 0) + 1);
    };
    renderShrine(list, BLESS.slice(0, 4), choose);
    renderShrine(list, BLESS.slice(0, 2), choose);
  });
  await expect(page.locator('#testShrine button')).toHaveCount(2);
  await page.locator('#testShrine button').first().click();
  await expect(page.locator('#testShrine')).toHaveAttribute('data-selected', 'wind');
  await expect(page.locator('#testShrine')).toHaveAttribute('data-count', '1');
});

test('statistics show saved records as text and can be reopened', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem(
      'issen.stats',
      JSON.stringify({
        time: 3661,
        furthestStage: 2.5,
        deaths: { '<img src=x onerror=alert(1)>': 4 },
        rec: { 'ronin-blade-zen-rush': { score: 100, combo: 42, wave: 3 } },
      }),
    );
  });
  await page.goto('/');
  await page.locator('#app').waitFor();
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'Stats', exact: true }).click();
    await expect(page.locator('#statGrid')).toContainText('1h 1m');
    await expect(page.locator('#statGrid')).toContainText('42 連');
    await expect(page.locator('#statGrid')).toContainText('Boss rush, Ronin, blade only, endless');
    await expect(page.locator('#statGrid')).toContainText('<img src=x onerror=alert(1)>');
    await expect(page.locator('#statGrid img')).toHaveCount(0);
    await page.locator('#stats').getByRole('button', { name: 'Back', exact: true }).click();
  }
  expect(errors).toEqual([]);
});

test('notifications preserve queue timing and dispose all pending work', async ({ page }) => {
  await page.goto('/');
  await page.locator('#app').waitFor();
  await page.clock.install();
  await page.evaluate(async () => {
    const path = '/src/ui/notifications.ts';
    const { createNotifications } = await import(path);
    const hint = document.createElement('div');
    hint.id = 'testHint';
    const toast = document.createElement('div');
    toast.id = 'testToast';
    document.body.append(hint, toast);
    const controller = createNotifications(hint, toast, () => {});
    controller.hint('first', 'First hint', 100);
    controller.hint('second', 'Second hint', 100);
    controller.toast({ k: '一', msg: '<b>First toast</b>' });
    controller.toast({ k: '二', msg: 'Second toast' });
    document.addEventListener('test-dispose', () => controller.dispose(), { once: true });
  });
  await expect(page.locator('#testHint')).toHaveText('First hint');
  await expect(page.locator('#testToast b')).toHaveCount(0);
  await page.clock.runFor(550);
  await expect(page.locator('#testHint')).toHaveText('Second hint');
  await page.evaluate(() => document.dispatchEvent(new Event('test-dispose')));
  await page.clock.runFor(5000);
  await expect(page.locator('#testHint')).not.toHaveClass(/on/);
  await expect(page.locator('#testToast')).not.toHaveClass(/on/);
  await expect(page.locator('#testToast')).not.toContainText('Second toast');
});
