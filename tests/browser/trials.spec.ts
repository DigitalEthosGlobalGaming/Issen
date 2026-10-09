import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function seed(page: Page, wave = 10) {
  await page.addInitScript((roninWave) => {
    if (localStorage.getItem('trial-test-seeded')) return;
    localStorage.setItem('trial-test-seeded', '1');
    localStorage.setItem('issen.stats', JSON.stringify({ roninWave, kills: 91, runs: 8 }));
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({
        schemaVersion: 4,
        bossMilestone: 3,
        revealSeen: 3,
        embers: 777,
        tutorial: 'completed',
        upgrades: { vitality: 3, knife: 3, awakening: 2 },
      }),
    );
    localStorage.setItem(
      'issen.unlocks',
      JSON.stringify(['masamune', 'masamune+', 'yoroi', 'daruma']),
    );
    localStorage.setItem(
      'issen.equip',
      JSON.stringify({ blade: 'masamune', bladeSp: true, robe: 'yoroi', charm: 'daruma' }),
    );
    localStorage.setItem(
      'issen.setup',
      JSON.stringify({ mode: 'rush', diff: 'normal', lives: '3', arrows: false }),
    );
  }, wave);
}

async function saves(page: Page) {
  return page.evaluate(() =>
    Object.fromEntries(
      ['stats', 'meta', 'awakening', 'equip', 'setup', 'best'].map((key) => [
        key,
        localStorage.getItem(`issen.${key}`),
      ]),
    ),
  );
}

// Test-only instrumentation of Vite's response. No debug hooks ship in the game.
async function instrument(page: Page) {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    const body = (
      "import { bossShownDirection } from '/src/game/encounters/boss-openings.ts';\n" +
      (await response.text())
    ).replace(
      'artworkReady = true;',
      `
      window.__trialHarness = { G: foundation.run.G, step: frames.update, swipe: game.onSwipe, tap: game.onTap,
        startBoss: game.startBoss, shownDirection: bossShownDirection,
        stop: () => frames.frameLoop.stop(), getEquipment: () => foundation.profile.profileEquipment.EQ,
        settleScene: async () => {
          while (foundation.run.sceneState.sceneLoading) { frames.render(0); await new Promise(resolve => setTimeout(resolve, 10)); }
        } };
      frames.frameLoop.start();`,
    );
    await route.fulfill({ response, body });
  });
}

test('Mirror accepts opposite displayed directions throughout a chain and rejects matching cuts', async ({
  page,
}) => {
  await seed(page);
  await instrument(page);
  await page.addInitScript(() =>
    localStorage.setItem('issen.guidedLessons', JSON.stringify({ order: true, bossParry: true })),
  );
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#bPlay')).toBeVisible({ timeout: 60000 });
  await page.waitForFunction(() => !!(window as any).__trialHarness);
  await page.evaluate(() => (window as any).__trialHarness.stop());
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await page.evaluate(() => (window as any).__trialHarness.settleScene());
  const result = await page.evaluate(() => {
    const h = (window as any).__trialHarness;
    h.G.bossCount = 5;
    h.startBoss();
    const b = h.G.boss;
    h.G.m.axisCut = 0;
    h.G.m.kage = 0;
    h.G.m.chain = 0;
    h.G.m.bossDmg = 1;
    // A restored legacy timing must not re-enable Mirror's attack feints.
    b.bp.feint = 1;
    b.state = 'idle';
    b.idleT = 0;
    h.step(0.02, 0.02);
    if (b.state !== 'windup') throw new Error('Mirror feinted');
    b.state = 'flash';
    h.tap();
    const hp = b.hp;
    const opposite: Record<string, string> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left',
    };
    const cuts = b.chainLeft;
    for (let cut = 0; cut < cuts; cut++) {
      const shown = h.shownDirection(b);
      h.step(0.02, 0.02);
      if (h.shownDirection(b) !== shown) throw new Error('Mirror cue changed with time');
      h.swipe(opposite[shown]);
      if (b.failed) throw new Error('Opposite counter failed');
    }
    const damage = hp - b.hp;
    b.state = 'flash';
    h.tap();
    h.swipe(h.shownDirection(b));
    return { cuts, damage, wrongState: b.state, failed: b.failed };
  });
  expect(result.cuts).toBeGreaterThanOrEqual(3);
  expect(result.damage).toBe(1);
  expect(result.wrongState).toBe('recover');
  expect(result.failed).toBe(true);
});

test('Trials stay off the title until Ronin wave 10, then fit portrait and landscape', async ({
  page,
}) => {
  test.setTimeout(60000);
  await seed(page, 9);
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('#bTrials')).toBeHidden();
  await page.evaluate(() => {
    const stats = JSON.parse(localStorage.getItem('issen.stats')!);
    stats.roninWave = 10;
    localStorage.setItem('issen.stats', JSON.stringify(stats));
  });
  await page.reload();
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('#bTrials')).toBeVisible();
  await page.locator('#bTrials').click();
  await expect(page.locator('#trialsAccess')).toHaveText('Trials · 0/11 complete');
  await expect(page.locator('.trials-rules')).toHaveText('One hit ends the trial.');
  await expect(page.locator('[data-trial="true-edge"]').locator('..')).toContainText(
    '10 perfect cuts in 12. No hits.',
  );
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.locator('#trials [data-back]')).toBeVisible();
  }
});

test('Live failure, retry and quitting preserve the main profile', async ({ page }) => {
  await seed(page);
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  const before = await saves(page);
  await page.locator('#bTrials').click();
  await page.locator('[data-trial="unbroken"]').click();
  await expect(page.locator('#trialObjective')).toContainText('Unbroken');
  await expect(page.locator('#trialResult')).toContainText('Too slow', { timeout: 10000 });
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await page.keyboard.press('p');
  await expect(page.locator('#trialObjective')).toBeHidden();
  await page.locator('#bEnd').click();
  await expect(page.locator('#trialResult')).toContainText('You ended the attempt');
  expect(await saves(page)).toEqual(before);
  expect(await page.evaluate(() => localStorage.getItem('issen.trials'))).toBeNull();
  await page.getByRole('button', { name: 'Back to title', exact: true }).click();
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#bossbar')).toHaveClass(/on/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('issen.stats')!).runs)).toBe(9);
});

test('All eight encounters complete through combat and persist exclusive rewards without farming', async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  const bindingWarnings: string[] = [];
  page.on('console', (message) => {
    if (/destroyed while still bound|feedback loop|GL_INVALID_OPERATION/i.test(message.text()))
      bindingWarnings.push(message.text());
  });
  await seed(page);
  await instrument(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#bPlay')).toBeVisible({ timeout: 60000 });
  await page.waitForFunction(() => !!(window as any).__trialHarness);
  await page.evaluate(() => (window as any).__trialHarness.stop());
  const before = await saves(page);
  await page.locator('#bTrials').click();
  for (const id of [
    'unbroken',
    'true-edge',
    'still-water',
    'sightless',
    'twin-fang',
    'three-masters',
    'golden-sovereign',
    'broken-reality',
  ]) {
    await page.locator(`[data-trial="${id}"]`).click();
    await page.evaluate(() => (window as any).__trialHarness.settleScene());
    const completed = await page.evaluate(async () => {
      const h = (window as any).__trialHarness;
      if (
        h.G.knives !== 0 ||
        h.G.m.bossDmg !== 1 ||
        h.getEquipment().blade !== 'steel' ||
        h.getEquipment().charm !== 'nocharm'
      )
        throw new Error('Trial inherited player powers');
      for (let step = 0; step < 150000 && h.G.state !== 'title'; step++) {
        h.step(0.02, 0.02);
        if (document.querySelector<HTMLCanvasElement>('#c')!.dataset.sceneState === 'loading')
          await h.settleScene();
        if (h.G.state === 'playing' && h.G.attacker?.p >= 0.82) h.swipe(h.G.attacker.dir);
        const b = h.G.boss;
        if (h.G.state === 'boss' && b?.state === 'flash') h.tap();
        else if (h.G.state === 'boss' && b?.state === 'stagger') h.swipe(b.sdir);
      }
      return h.G.state === 'title';
    });
    expect(completed, id).toBe(true);
    await expect(page.locator('#trialResult')).toContainText('Complete');
    await expect(page.locator('#trialResult')).toContainText('Unlocked:');
  }
  expect(await saves(page)).toEqual(before);
  await expect(page.locator('#trialsAccess')).toContainText('8/11');
  await page.reload();
  await page.waitForFunction(() => !!(window as any).__trialHarness);
  await page.locator('#bTrials').click();
  await expect(page.locator('#trialsAccess')).toContainText('8/11');
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('issen.unlocks')!).filter((id: string) =>
          id.startsWith('trial-'),
        ).length,
    ),
  ).toBe(8);
  await expect(page.locator('#trials')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: testInfo.outputPath('trials-complete.png') });
  await page.locator('#trials [data-back]').click();
  await page.locator('#bArmory').click();
  for (const [tab, name, category, id] of [
    ['Kill effects', 'Still ripples', 'fx', 'trial-ripple'],
    ['Kill effects', 'Comet trail', 'fx', 'trial-comet'],
    ['Seals', 'Platinum', 'seal', 'trial-platinum'],
    ['Seals', 'Burnished copper', 'seal', 'trial-copper'],
    ['Film looks', 'Violet dusk', 'film', 'trial-dusk'],
    ['Film looks', 'Imperial gold', 'film', 'trial-gold'],
    ['Film looks', 'Broken signal', 'film', 'trial-glitch'],
    ['Film looks', 'Pale dawn', 'film', 'trial-dawn'],
  ]) {
    await page.getByRole('tab', { name: new RegExp(`^${tab}`) }).click();
    await page.locator('#armTiles').getByRole('button', { name: name!, exact: true }).click();
    await expect(page.locator('#armInfo')).not.toContainText('Equipped');
    expect(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem('issen.equip')!)[key!],
        category,
      ),
    ).toBe(id);
  }
  await page.reload();
  expect(
    await page.evaluate(() => {
      const eq = JSON.parse(localStorage.getItem('issen.equip')!);
      return [eq.fx, eq.seal, eq.film];
    }),
  ).toEqual(['trial-comet', 'trial-copper', 'trial-dawn']);
  expect(bindingWarnings).toEqual([]);
});

test('A perfect-cut trial ends when its target becomes impossible and seeded retries reproduce the encounter', async ({
  page,
}) => {
  const bindingWarnings: string[] = [];
  page.on('console', (message) => {
    if (/destroyed while still bound|feedback loop|GL_INVALID_OPERATION/i.test(message.text()))
      bindingWarnings.push(message.text());
  });
  await seed(page);
  await instrument(page);
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  await page.waitForFunction(() => !!(window as any).__trialHarness);
  await page.evaluate(() => (window as any).__trialHarness.stop());
  await page.locator('#bTrials').click();
  const sequences: string[][] = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt === 0) await page.locator('[data-trial="true-edge"]').click();
    else await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await page.evaluate(() => (window as any).__trialHarness.settleScene());
    sequences.push(
      await page.evaluate(() => {
        const h = (window as any).__trialHarness;
        const directions: string[] = [];
        for (let step = 0; step < 10000 && h.G.state !== 'title'; step++) {
          h.step(0.02, 0.02);
          if (h.G.state === 'playing' && h.G.attacker?.p >= 0.2) {
            directions.push(h.G.attacker.dir);
            h.swipe(h.G.attacker.dir);
          }
        }
        return directions;
      }),
    );
    await expect(page.locator('#trialResult')).toContainText(
      '10 perfect cuts needed; too many missed.',
    );
  }
  expect(sequences[0]).toHaveLength(3);
  expect(sequences[0]).toEqual(sequences[1]);
  expect(await page.evaluate(() => localStorage.getItem('issen.trials'))).toBeNull();
  expect(bindingWarnings).toEqual([]);
});

test('Broken Reality ends on the first ordinary cut', async ({ page }) => {
  test.setTimeout(60000);
  await seed(page);
  await instrument(page);
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  await page.evaluate(() => (window as any).__trialHarness.stop());
  await page.locator('#bTrials').click();
  await page.locator('[data-trial="broken-reality"]').click();
  await page.evaluate(() => (window as any).__trialHarness.settleScene());
  const cuts = await page.evaluate(() => {
    const h = (window as any).__trialHarness;
    let cuts = 0;
    for (let step = 0; step < 1000 && h.G.state !== 'title'; step++) {
      h.step(0.02, 0.02);
      if (h.G.state === 'playing' && h.G.attacker?.p >= 0.2) {
        h.swipe(h.G.attacker.dir);
        cuts++;
      }
    }
    return cuts;
  });
  expect(cuts).toBe(1);
  await expect(page.locator('#trialResult')).toContainText('1000 perfect cuts needed');
  await expect(page.locator('#trialResult')).toContainText('Failed · Broken Reality');
  await expect(page.locator('#trialResult')).toContainText('1,000 perfect cuts. No mistakes.');
  await expect(page.locator('#trialList')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('issen.trials'))).toBeNull();
  await page.getByRole('button', { name: 'Back to title', exact: true }).click();
  await expect(page.locator('#bTrials')).toBeVisible();
  await page.locator('#bTrials').click();
  await expect(page.locator('#trialResult')).toBeHidden();
  await expect(page.locator('#trialList')).toBeVisible();
});
