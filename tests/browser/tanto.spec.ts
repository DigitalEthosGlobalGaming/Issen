import { expect, test } from '@playwright/test';
import type { RunState } from '../../src/game/run-state.ts';
import type { Enemy } from '../../src/game/combat/enemy.ts';
import type { Boss } from '../../src/game/encounters/boss.ts';

declare global {
  interface Window {
    __tanto: {
      G: RunState;
      frameLoop: { stop(): void };
      playerDie(e: Enemy | Boss | null, reason: string): void;
      startBoss(): void;
      startStandoff(n: number, changed: boolean): void;
    };
  }
}

test('Tanto intercepts attacks, exhausts charges and preserves the boss victory on reload', async ({
  page,
}) => {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      'artworkReady = true;',
      'window.__tanto = { G: foundation.run.G, frameLoop, playerDie, startBoss, startStandoff }; artworkReady = true;',
    );
    await route.fulfill({ response, body });
  });
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta'))
      localStorage.setItem(
        'issen.meta',
        JSON.stringify({ schemaVersion: 4, tutorial: 'skipped', upgrades: { tanto: 3 } }),
      );
    localStorage.setItem('issen.guidedLessons', JSON.stringify({ order: true, bossParry: true }));
  });
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect.poll(() => page.evaluate(() => window.__tanto.G.enemies.length)).toBeGreaterThan(0);
  expect(
    await page.evaluate(() => {
      const { G, frameLoop, playerDie, startStandoff, startBoss } = window.__tanto;
      frameLoop.stop();
      const lives = G.lives;
      const enemy = G.enemies[0]!;
      enemy.state = 'attack';
      enemy.p = 1;
      G.attacker = enemy;
      playerDie(enemy, 'late');
      const ordinary = {
        state: enemy.state,
        charges: G.tanto,
        lives: G.lives,
        perfect: G.perfects,
      };
      startStandoff(2, false);
      const challenger = G.so!.e;
      playerDie(challenger, 'late');
      const standoff = {
        state: challenger.state,
        done: G.so!.done,
        charges: G.tanto,
        lives: G.lives,
      };
      startBoss();
      const boss = G.boss!;
      boss.state = 'flash';
      boss.hp = 2;
      playerDie(boss, 'lateBoss');
      const bossHit = {
        state: boss.state,
        hp: boss.hp,
        charges: G.tanto,
        failed: boss.failed,
        lives: G.lives,
      };
      boss.state = 'flash';
      playerDie(boss, 'lateBoss');
      const exhausted = { charges: G.tanto, lives: G.lives };
      return { lives, ordinary, standoff, bossHit, exhausted };
    }),
  ).toMatchObject({
    lives: 2,
    ordinary: { state: 'dying', charges: 2, lives: 2 },
    standoff: { state: 'dying', done: true, charges: 1, lives: 2 },
    bossHit: { state: 'hurt', hp: 1, charges: 0, failed: true, lives: 2 },
    exhausted: { charges: 0, lives: 1 },
  });
  // A final saved strike can also finish a duel and resume its transition.
  await page.evaluate(() => {
    const { G, playerDie } = window.__tanto;
    G.tanto = 1;
    G.state = 'boss';
    G.boss!.state = 'flash';
    G.boss!.hp = 1;
    playerDie(G.boss, 'lateBoss');
  });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('issen.runCheckpoint')!));
  expect(saved.run).toMatchObject({
    tanto: 0,
    state: 'between',
    afterBoss: true,
    boss: { hp: 0, state: 'dying' },
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__tanto);
  await expect(page.locator('#paused')).toHaveClass(/on/);
  expect(
    await page.evaluate(() => {
      window.__tanto.frameLoop.stop();
      return {
        tanto: window.__tanto.G.tanto,
        state: window.__tanto.G.state,
        from: window.__tanto.G.pausedFrom,
      };
    }),
  ).toEqual({ tanto: 0, state: 'paused', from: 'between' });
  await page.locator('#bResume').click();
  expect(await page.evaluate(() => window.__tanto.G.state)).toBe('between');
});

test('Tanto Temple emblem and compact scroll Armoury fit portrait and landscape', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({ schemaVersion: 4, tutorial: 'skipped', embers: 1000 }),
    );
    localStorage.setItem('issen.settings', JSON.stringify({ version: 1, menuStyle: 'scroll' }));
  });
  await page.goto('/');
  await page.locator('#bTemplate').click();
  await page.locator('[data-upgrade="tanto"]').click();
  await expect(page.locator('.template-detail')).toContainText(
    '1 automatic defensive strike per run',
  );
  await page.getByRole('button', { name: 'Donate 175 Embers', exact: true }).click();
  await page.getByRole('button', { name: 'Yes -175 Embers', exact: true }).click();
  await expect(page.locator('.template-detail')).toContainText(
    '2 automatic defensive strikes per run',
  );
  await page.screenshot({ path: info.outputPath('tanto-temple.png') });
  await page.locator('#template [data-back]').click();
  await page.locator('#bArmory').click();
  await expect(page.locator('.scroll-leaving')).toHaveCount(0);
  await expect(page.locator('.scroll-entering')).toHaveCount(0);
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('#prevC')).toBeVisible();
    await expect(page.locator('.armWrap')).toHaveCSS('padding-top', '8px');
    const tileWidth = await page
      .locator('.tile')
      .first()
      .evaluate((node) => node.getBoundingClientRect().width);
    expect(tileWidth).toBeGreaterThanOrEqual(44);
    expect(tileWidth).toBeLessThanOrEqual(
      await page.locator('#armTiles').evaluate((node) => node.clientWidth / 3 + 1),
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath(`compact-armoury-${viewport.width}.png`) });
  }
});
