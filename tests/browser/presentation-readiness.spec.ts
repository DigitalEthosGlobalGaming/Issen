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
        drawPost: frames.drawPost, nativeScene: foundation.browser.nativeScene, frameLoop: frames.frameLoop, drawScene: frames.drawScene, preparePresentation: frames.preparePresentation, render: frames.render,
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
    const native = harness.nativeScene;
    const geometry = Reflect.get(native, 'geometryBuffer'),
      lights = Reflect.get(native, 'lightBuffer');
    let geometryCalls = 0,
      lightCalls = 0;
    const drawGeometry = geometry.render.bind(geometry),
      drawLights = lights.render.bind(lights);
    geometry.render = (...args: any[]) => {
      geometryCalls++;
      return drawGeometry(...args);
    };
    lights.render = (...args: any[]) => {
      lightCalls++;
      return drawLights(...args);
    };
    const postCalls: string[] = [];
    const removePost = harness.drawPost.composer.insert(
      { name: 'test-post-hook', draw: () => postCalls.push('post') },
      { before: 'letterbox' },
    );
    const removeFilm = harness.drawPost.filmComposer.insert(
      { name: 'test-film-hook', draw: () => postCalls.push('film') },
      { after: 'grade' },
    );
    const snapshots: boolean[] = [];
    const removeTargets = harness.drawScene.composer.insert(
      {
        name: 'test-light-targets',
        draw: (_frame: unknown, views: any) => {
          const targets = views.nativeScene.lightingTargets;
          snapshots.push(
            !!targets &&
              Object.isFrozen(targets) &&
              Object.isFrozen(targets.geometry) &&
              Object.isFrozen(targets.light) &&
              targets.light.guide === targets.geometry.g0,
          );
        },
      },
      { after: 'lights' },
    );
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
    removeTargets();
    removePost();
    removeFilm();
    return {
      pure,
      settled,
      settledAgain,
      order,
      extensions,
      haptics: hapticCalls(),
      geometryCalls,
      lightCalls,
      snapshots,
      postCalls,
    };
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
      'geometry',
      'lights',
      'test-light-targets',
      'forward-composite',
    ],
    extensions: ['observed', 'observed'],
    geometryCalls: 4,
    lightCalls: 4,
    snapshots: [true, true, true, true],
    postCalls: ['film', 'post', 'film', 'post', 'film', 'post', 'film', 'post'],
  });
});
