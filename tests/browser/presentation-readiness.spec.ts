import { test, expect } from '@playwright/test';

test('repeated drawing cannot commit a pending gameplay continuation; orchestration settles once', async ({
  page,
}) => {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        `window.__presentationBoundary = {
        frameLoop, drawScene, preparePresentation, render,
        snapshot: () => JSON.stringify({ G, random: runRandom.state(), saves: Object.entries(localStorage) }),
        queue() {
          sceneLoading = true; sceneReadyToPresent = true;
          sceneContinuation = () => { G.score += 7; };
        },
        score: () => G.score,
      }; artworkReady = true;`,
      ),
    });
  });
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  const result = await page.evaluate(() => {
    const harness = (window as any).__presentationBoundary;
    harness.frameLoop.stop();
    const frame = harness.preparePresentation(0);
    harness.queue();
    const before = harness.snapshot(),
      initialScore = harness.score();
    harness.drawScene(frame);
    harness.drawScene(frame);
    const pure = before === harness.snapshot();
    harness.render(0);
    const settled = harness.score() - initialScore;
    harness.render(0);
    const settledAgain = harness.score() - initialScore;
    return { pure, settled, settledAgain };
  });
  expect(result).toEqual({ pure: true, settled: 7, settledAgain: 7 });
});
