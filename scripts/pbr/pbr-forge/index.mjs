import { chromium } from '@playwright/test';
import { SETTINGS } from './settings.mjs';

/** Browser ownership lives here; the CLI owns input discovery and output files. */
export async function createPbrForge({ channel = 'msedge', headed = false } = {}) {
  const browser = await chromium.launch({ channel, headless: !headed });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 1000 },
  });
  return {
    async convert(source, destination, preset, failureScreenshot) {
      const page = await context.newPage();
      page.setDefaultTimeout(60_000);
      try {
        await page.goto('https://www.pbrforge.com/', { waitUntil: 'domcontentloaded' });
        const deny = page.getByRole('button', { name: 'Deny', exact: true });
        if (await deny.isVisible()) await deny.click();
        await page.locator('#fileInput').setInputFiles(source);
        await page.waitForFunction(
          () => document.getElementById('downloadPBRBtn')?.disabled === false,
        );
        // First import opens Files after 300ms; do not let it cover Export later.
        await page.locator('#panel-files[data-active="true"]').waitFor();
        const sprite = page.getByRole('button', { name: 'Sprite Transparent edges', exact: true });
        if (preset.mode !== 'auto')
          await page
            .getByRole('button', {
              name:
                preset.mode === 'sprite' ? 'Sprite Transparent edges' : 'Texture Opaque surfaces',
              exact: true,
            })
            .click();
        const mode = (await sprite.getAttribute('data-active')) === 'true' ? 'sprite' : 'texture';
        const applied = {},
          skipped = [];
        let activeTab = '';
        // Iterate in UI order even when the JSON file lists settings differently.
        for (const [key, rule] of Object.entries(SETTINGS)) {
          if (!Object.hasOwn(preset.settings, key)) continue;
          if (rule.spriteOnly && mode !== 'sprite') {
            skipped.push(key);
            continue;
          }
          if (activeTab !== rule.tab) {
            await page.getByRole('button', { name: rule.tab, exact: true }).first().click();
            activeTab = rule.tab;
          }
          const input = page.locator(`#${rule.id}`),
            value = preset.settings[key];
          await input.fill(String(value));
          const actual = Number(await input.inputValue());
          if (actual !== value)
            throw new Error(`PBR Forge changed ${key} from ${value} to ${actual}.`);
          applied[key] = actual;
        }
        if (Object.hasOwn(preset.settings, 'roughnessBase')) {
          await page.getByRole('button', { name: 'Roughness', exact: true }).first().click();
          await page.locator('#param-roughness-invert').uncheck();
        }
        await page.getByRole('button', { name: 'Open export panel', exact: true }).click();
        await page
          .getByRole('button', {
            name: preset.engine === 'opengl' ? 'OpenGL' : 'DirectX',
            exact: true,
          })
          .click();
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 180_000 }),
          page.locator('#downloadPBRBtn').click(),
        ]);
        await download.saveAs(destination);
        const failure = await download.failure();
        if (failure) throw new Error(failure);
        return { mode, engine: preset.engine, applied, skipped };
      } catch (error) {
        if (failureScreenshot)
          await page.screenshot({ path: failureScreenshot, fullPage: true }).catch(() => {});
        throw error;
      } finally {
        await page.close();
      }
    },
    close: () => browser.close(),
  };
}
