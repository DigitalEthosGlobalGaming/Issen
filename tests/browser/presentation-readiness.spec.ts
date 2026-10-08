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
        frameLoop: frames.frameLoop, drawScene: frames.drawScene, preparePresentation: frames.preparePresentation, render: frames.render,
        snapshot: () => JSON.stringify({ G: foundation.run.G, random: foundation.run.activity.runRandom.state(), saves: Object.entries(localStorage) }),
        queue() {
          foundation.run.sceneState.sceneLoading = true; foundation.run.sceneState.sceneReadyToPresent = true;
          foundation.run.sceneState.sceneContinuation = () => { foundation.run.G.score += 7; };
        },
        guardHaptics() {
          let calls = 0;
          foundation.browser.combatHaptics.play = () => { calls++; };
          navigator.vibrate = () => { calls++; return false; };
          return () => calls;
        },
        score: () => foundation.run.G.score,
      }; artworkReady = true;`,
      ),
    });
  });
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  const result = await page.evaluate(() => {
    const harness = (window as any).__presentationBoundary;
    harness.frameLoop.stop();
    const hapticCalls = harness.guardHaptics();
    const frame = harness.preparePresentation(0);
    harness.queue();
    const before = harness.snapshot(),
      initialScore = harness.score();
    const order = [...harness.drawScene.composer.order];
    const extensions: string[] = [];
    const remove = harness.drawScene.composer.insert(
      {
        name: 'test-observer',
        draw: () => extensions.push('observed'),
      },
      { after: 'combat' },
    );
    harness.drawScene(frame);
    harness.drawScene(frame);
    remove();
    const pure = before === harness.snapshot();
    harness.render(0);
    const settled = harness.score() - initialScore;
    harness.render(0);
    const settledAgain = harness.score() - initialScore;
    return { pure, settled, settledAgain, order, extensions, haptics: hapticCalls() };
  });
  expect(result).toEqual({
    pure: true,
    haptics: 0,
    settled: 7,
    settledAgain: 7,
    order: [
      'environment',
      'midground',
      'rear-enemies',
      'combat',
      'foreground',
      'atmosphere',
      'post',
    ],
    extensions: ['observed', 'observed'],
  });
});
