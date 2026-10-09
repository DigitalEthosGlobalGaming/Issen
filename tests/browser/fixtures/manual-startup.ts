import { expect, type Page } from '@playwright/test';

/** A manual animation clock must also drive paced startup preparation. */
export async function waitForManualStartup(page: Page, advance: () => Promise<unknown>) {
  await expect
    .poll(
      async () => {
        await advance();
        return page.locator('.startup-loading').count();
      },
      { timeout: 30000, intervals: [50] },
    )
    .toBe(0);
}
