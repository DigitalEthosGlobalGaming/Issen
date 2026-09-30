// Captures the compiled game's real screens in temporary browser profiles.
// Start Vite preview on port 4186, then run this script. No real saves are touched.
import { chromium } from '@playwright/test';
import { mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const output = resolve('assets/play-store');
const browser = await chromium.launch({ channel: 'msedge' });
const profiles = [
  { name: 'phone', width: 360, height: 640, scale: 3, touch: true },
  { name: 'tablet-7-inch', width: 640, height: 360, scale: 2, touch: true },
  { name: 'tablet-10-inch', width: 960, height: 540, scale: 2, touch: true },
  { name: 'desktop', width: 1280, height: 720, scale: 1.5, touch: false },
];
const scenes = ['01-title', '02-waves', '03-boss-duel', '04-armoury', '05-temple'];
const manifest = [];
try {
  for (const profile of profiles) {
    const directory = resolve(output, profile.name);
    mkdirSync(directory, { recursive: true });
    for (const scene of scenes) {
      const context = await browser.newContext({
        viewport: { width: profile.width, height: profile.height },
        deviceScaleFactor: profile.scale,
        hasTouch: profile.touch,
        isMobile: profile.touch,
      });
      try {
        await context.addInitScript(() => {
          localStorage.setItem('issen.meta', JSON.stringify({
            schemaVersion: 4, tutorial: 'completed', bossMilestone: 3, revealSeen: 3,
            embers: 450, earned: 900,
            upgrades: { vitality: 1, focus: 1, offerings: 0, awakening: 0, knife: 1, composure: 0, recovery: 0 },
          }));
          localStorage.setItem('issen.unlocks', JSON.stringify(['kuro', 'scarecrow']));
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto('http://127.0.0.1:4186/', { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        if (scene === '04-armoury') {
          await page.locator('#bArmory').click();
          await page.locator('#armTiles').getByRole('button', { name: 'Kurogane', exact: true }).click();
          await page.waitForTimeout(400);
        } else if (scene === '05-temple') {
          await page.locator('#bTemplate').click();
          await page.waitForTimeout(250);
        } else if (scene === '02-waves' || scene === '03-boss-duel') {
          await page.locator('#bPlay').click();
          if (scene === '03-boss-duel') await page.locator('[data-k="mode"] [data-v="rush"]').click();
          await page.locator('#bBegin').click();
          await page.waitForTimeout(scene === '02-waves' ? 1300 : 950);
        }
        if (errors.length) throw new Error(errors.join('\n'));
        const path = resolve(directory, `${scene}.png`);
        await page.screenshot({ path, fullPage: false });
        manifest.push({ file: `${profile.name}/${scene}.png`, width: profile.width * profile.scale, height: profile.height * profile.scale, scene });
        console.log(`${profile.name}/${scene}.png`);
      } finally { await context.close(); }
    }
  }
  mkdirSync(resolve(output, 'pc'), { recursive: true });
  for (const scene of scenes) {
    copyFileSync(resolve(output, 'desktop', `${scene}.png`), resolve(output, 'pc', `${scene}.png`));
    manifest.push({ file: `pc/${scene}.png`, width: 1920, height: 1080, scene });
  }
  writeFileSync(resolve(output, 'screenshots.json'), JSON.stringify({ source: 'Compiled Android web assets rendered in Edge; simulated viewport sizes, not physical-device captures.', screenshots: manifest }, null, 2) + '\n');
} finally { await browser.close(); }
