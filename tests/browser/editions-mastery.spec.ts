import { expect, test, type Page } from '@playwright/test';

async function prepare(page: Page, edition = 'web') {
  await page.addInitScript(() => {
    if (localStorage.getItem('mastery-seeded')) return;
    localStorage.setItem('mastery-seeded', '1');
    localStorage.setItem(
      'issen.stats',
      JSON.stringify({ roninWave: 10, kills: 1000, duels: 50, bestRunPerfects: 100 }),
    );
    localStorage.setItem(
      'issen.unlocks',
      JSON.stringify(['steel', 'sumi', 'falling-leaves', 'ember-ash', 'ink-wash', 'pilgrims-bead']),
    );
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({
        schemaVersion: 4,
        embers: 2000,
        bossMilestone: 3,
        revealSeen: 3,
        upgrades: { vitality: 1, precision: 3, discernment: 1 },
      }),
    );
    localStorage.setItem('issen.guidedLessons', JSON.stringify({ order: true, bossParry: true }));
    localStorage.setItem(
      'issen.setup',
      JSON.stringify({ mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: true }),
    );
  });
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    let body = await response.text();
    body = body.replace(/const edition = [^;]+;/, `const edition = ${JSON.stringify(edition)};`);
    body = body.replace(
      'frameLoop.start();',
      `window.__mastery = { G, step: update, swipe: onSwipe, tap: onTap,
      stop: () => frameLoop.stop(), runFrames: () => frameLoop.start(), shrine: openShrine, checkpoint: captureCheckpoint,
      equipment: () => EQ, stats: () => ST, modifiers: computeMods, parry, pause, startRun, killEnemy,
      access: premiumAccess, premium, title: () => showScreen('title') }; frameLoop.start();`,
    );
    await route.fulfill({ response, body });
  });
  await page.goto('/');
  await expect(page.locator('#bPlay')).toBeVisible();
  await page.evaluate(() => (window as any).__mastery.stop());
}

for (const edition of ['free', 'premium', 'web']) {
  test(`${edition} enforces its edition gates and keeps earned requirements`, async ({ page }) => {
    await prepare(page, edition);
    const allowed = edition !== 'free';
    await page.locator('#bTemplate').click();
    await page.locator('[data-upgrade="precision"]').click();
    await expect(page.locator('.template-detail')).toContainText(
      allowed ? '15% wider' : 'Requires Premium',
    );
    await page.locator('#template [data-back]').click();
    await page.locator('#bArmory').click();
    await page.getByRole('tab', { name: /^Kill effects/ }).click();
    await page.locator('#armTiles button').filter({ hasText: 'Falling Leaves' }).click();
    if (allowed)
      await expect(
        page.locator('#armTiles button').filter({ hasText: 'Falling Leaves' }),
      ).toHaveAttribute('aria-pressed', 'true');
    else await expect(page.locator('#armInfo')).toContainText('Requires Premium');
    await expect(page.locator('#armInfo')).toContainText('1,000');
    expect(
      await page.evaluate(() => (window as any).__mastery.equipment().fx === 'falling-leaves'),
    ).toBe(allowed);
    await page.locator('#armory [data-back]').click();
    await page.locator('#bTrials').click();
    await expect(page.locator('[data-trial="duel-master"]')).toBeEnabled({ enabled: allowed });
    if (!allowed)
      await expect(page.locator('[data-trial="duel-master"]')).toHaveText('Requires Premium');
    const favicon = await page.locator('link[rel="icon"]').getAttribute('href');
    expect(favicon).toContain('favicon.svg');
    expect((await page.request.get(favicon!, { maxRetries: 2 })).ok()).toBe(true);
  });
}

test('Free verified purchase grants access; revocation suppresses equipment without losing earned ranks', async ({
  page,
}) => {
  await prepare(page, 'free');
  await page.evaluate(() => {
    const h = (window as any).__mastery;
    h.premium.receive({
      entitlements: {
        verification: 'VERIFIED',
        active: { premium: { isActive: true, verification: 'VERIFIED' } },
      },
    });
  });
  await page.locator('#bArmory').click();
  await page.getByRole('tab', { name: /^Charms/ }).click();
  await page.locator('#armTiles button').filter({ hasText: "Pilgrim's Bead" }).click();
  await expect(
    page.locator('#armTiles button').filter({ hasText: "Pilgrim's Bead" }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() =>
    (window as any).__mastery.premium.receive({
      entitlements: { verification: 'VERIFIED', active: {} },
    }),
  );
  await expect(page.locator('#armInfo')).toContainText('Requires Premium');
  expect(await page.evaluate(() => (window as any).__mastery.equipment().charm)).toBe('nocharm');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.meta')!).upgrades.precision),
  ).toBe(3);
});

test('Discernment rerolls once, checkpoints the new offer, and remains spent after reload', async ({
  page,
}) => {
  await prepare(page);
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await page.evaluate(() => {
    const h = (window as any).__mastery;
    h.G.bossesSlain = 1;
    h.shrine();
  });
  await expect(page.locator('#bRerollShrine')).toBeVisible();
  await page.locator('#bRerollShrine').click();
  await expect(page.locator('#bRerollShrine')).toBeHidden();
  const checkpoint = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('issen.runCheckpoint')!),
  );
  expect(checkpoint.run.shrineRerolls).toBe(0);
  expect(checkpoint.offers.length).toBeGreaterThan(0);
  await page.reload();
  await page.locator('#bResume').click();
  await expect(page.locator('#bRerollShrine')).toBeHidden();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.runCheckpoint')!).offers),
  ).toEqual(checkpoint.offers);
});

test('Duel Master completes exactly 20 accelerating exchanges and awards First Strike once', async ({
  page,
}) => {
  await prepare(page);
  const statsBefore = await page.evaluate(() => localStorage.getItem('issen.stats'));
  await page.locator('#bTrials').click();
  await page.locator('[data-trial="duel-master"]').click();
  const result = await page.evaluate(() => {
    const h = (window as any).__mastery;
    const flashes: number[] = [];
    let exchanges = 0;
    for (let i = 0; i < 10000 && h.G.state !== 'title'; i++) {
      h.step(0.02, 0.02);
      const b = h.G.boss;
      if (h.G.state === 'boss' && b?.state === 'flash') {
        flashes.push(b.bp.flash);
        h.tap();
      } else if (h.G.state === 'boss' && b?.state === 'stagger') {
        h.swipe(b.sdir);
        exchanges++;
      }
    }
    return { exchanges, flashes, state: h.G.state };
  });
  expect(result.exchanges).toBe(20);
  expect(result.flashes).toHaveLength(20);
  expect(result.flashes[19]).toBeLessThan(result.flashes[0]!);
  expect(result.state).toBe('title');
  await expect(page.locator('#trialResult')).toContainText('Unlocked: First Strike');
  expect(await page.evaluate(() => localStorage.getItem('issen.stats'))).toBe(statsBefore);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.trials')!).completed),
  ).toEqual(['duel-master']);
  await page.locator('#trials [data-back]').click();
  await page.locator('#bArmory').click();
  await page.getByRole('tab', { name: /^Charms/ }).click();
  await page.locator('#armTiles button').filter({ hasText: 'First Strike' }).click();
  await expect(
    page.locator('#armTiles button').filter({ hasText: 'First Strike' }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('Duel Master pauses without advancing and a wrong counter ends the attempt', async ({
  page,
}) => {
  await prepare(page);
  await page.locator('#bTrials').click();
  await page.locator('[data-trial="duel-master"]').click();
  const unchanged = await page.evaluate(async () => {
    const h = (window as any).__mastery;
    h.pause();
    const t = h.G.boss.t;
    h.runFrames();
    for (let i = 0; i < 10; i++) await new Promise(requestAnimationFrame);
    h.stop();
    return t === h.G.boss.t;
  });
  expect(unchanged).toBe(true);
  await page.locator('#bResume').click();
  await page.evaluate(() => {
    const h = (window as any).__mastery;
    for (let i = 0; i < 1000; i++) {
      h.step(0.02, 0.02);
      if (h.G.boss?.state === 'flash') {
        h.tap();
        break;
      }
    }
    h.swipe(h.G.boss.sdir === 'up' ? 'down' : 'up');
    h.step(0.02, 0.02);
  });
  await expect(page.locator('#trialResult')).toContainText('Failed');
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('issen.trials') ?? '{"completed":[]}').completed,
    ),
  ).toEqual([]);
});

test('Quiet Blade has its own perfect-cut objective and grants Quiet jade', async ({ page }) => {
  await prepare(page);
  await page.locator('#bTrials').click();
  await page.locator('[data-trial="quiet-blade"]').click();
  expect(await page.evaluate(() => (window as any).__mastery.G.blade)).toBe(true);
  await page.evaluate(() => {
    const h = (window as any).__mastery;
    for (let i = 0; i < 15000 && h.G.state !== 'title'; i++) {
      h.step(0.02, 0.02);
      if (h.G.state === 'playing' && h.G.attacker?.p >= 0.82) h.swipe(h.G.attacker.dir);
    }
  });
  await expect(page.locator('#trialResult')).toContainText('Unlocked: Quiet jade');
});

test('First Strike uses speed points while late slashes still count as perfect; mastery effects dissolve live enemies', async ({
  page,
}) => {
  await prepare(page);
  const result = await page.evaluate(() => {
    const h = (window as any).__mastery;
    const source = structuredClone(h.G.enemies[0]);
    h.startRun();
    h.equipment().charm = 'first-strike';
    h.modifiers();
    const cut = (elapsed: number, perfect: boolean) => {
      const e = structuredClone(source);
      e.state = perfect ? 'attack' : 'idle';
      e.life = 0.9 + elapsed;
      e.t = elapsed;
      e.T = 1;
      e.p = elapsed;
      h.G.enemies = [e];
      h.G.attacker = perfect ? e : null;
      h.G.combo = 0;
      h.G.score = 0;
      h.G.pStreak = 0;
      h.swipe(e.dir);
      return { points: h.G.score, style: e.deathType };
    };
    const early = cut(0, false),
      late = cut(0.95, true);
    h.equipment().fx = 'ember-ash';
    const ash = cut(0, false);
    return { early, late, ash, perfects: h.G.perfects };
  });
  expect(result.early.points).toBeGreaterThan(result.late.points);
  expect(result.perfects).toBe(1);
  expect(result.ash.style).toBe('dissolve');
});

test('Premium locks and cosmetic previews fit both viewport orientations', async ({
  page,
}, testInfo) => {
  await prepare(page, 'free');
  await page.locator('#bArmory').click();
  await page.getByRole('tab', { name: /^Kill effects/ }).click();
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => (window as any).__mastery.runFrames());
    for (const effect of ['Falling Leaves', 'Ember Ash', 'Ink Wash']) {
      await page.locator('#armTiles button').filter({ hasText: effect }).click();
      await expect(page.locator('#armInfo')).toContainText('Requires Premium');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: testInfo.outputPath(`mastery-${effect.replaceAll(' ', '-')}-${viewport.width}.png`),
      });
    }
    await page.evaluate(() => (window as any).__mastery.stop());
  }
});
