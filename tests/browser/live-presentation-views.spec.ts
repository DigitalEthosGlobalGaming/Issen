import { expect, test } from '@playwright/test';

test('cached drawing views retain identity and forward equipment, geometry, clocks and scene replacements', async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const factories: Record<string, string> = {
    '/src/presentation/figures.ts': 'createFiguresPresentation',
    '/src/presentation/player-figures.ts': 'createPlayerFigures',
    '/src/presentation/cues.ts': 'createCuePresentation',
    '/src/presentation/equipment.ts': 'createEquipmentPresentation',
    '/src/presentation/environment.ts': 'createEnvironmentPresentation',
    '/src/presentation/environment-artwork.ts': 'createEnvironmentArtwork',
    '/src/presentation/feedback.ts': 'createFeedbackPresentation',
    '/src/presentation/post-preparation.ts': 'createPostPreparation',
    '/src/presentation/post.ts': 'createPostPresentation',
    '/src/presentation/scene.ts': 'createRuntimeScene',
    '/src/runtime/frame-simulation.ts': 'createFrameSimulation',
    '/src/game/equipment/active.ts': 'createActiveEquipment',
  };
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
  await page.route('**/src/**/*.ts*', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const factory = factories[pathname];
    if (!factory && pathname !== '/src/game.ts') return route.continue();
    const response = await route.fetch();
    let body = await response.text();
    if (factory) {
      const pattern = new RegExp(`function ${factory}\\([\\s\\S]*?\\)\\s*\\{`);
      expect(body).toMatch(pattern);
      body = body.replace(
        pattern,
        (match) => `${match}\n(window.__viewReaders ??= {})['${factory}'] = readViews;`,
      );
    } else {
      body = body.replace(
        'artworkReady = true;',
        'window.__livePresentation = { foundation, presentation, controls, frames, game }; artworkReady = true;',
      );
    }
    await route.fulfill({ response, body });
  });
  await page.goto('/');
  await page.waitForFunction(() => !!(window as any).__livePresentation);
  const result = await page.evaluate(() => {
    const {
      foundation: f,
      presentation: p,
      controls,
      frames,
      game,
    } = (window as any).__livePresentation;
    frames.frameLoop.stop();
    const readers = (window as any).__viewReaders as Record<string, () => any>;
    const views = Object.fromEntries(Object.entries(readers).map(([name, read]) => [name, read()]));
    const original = Object.getOwnPropertyDescriptors;
    let constructions = 0;
    Object.getOwnPropertyDescriptors = (...args: Parameters<typeof original>) => {
      constructions++;
      return original(...args);
    };
    let stable = true;
    try {
      for (let i = 0; i < 100; i++)
        for (const [name, read] of Object.entries(readers)) stable &&= read() === views[name];
    } finally {
      Object.getOwnPropertyDescriptors = original;
    }
    f.profile.profileEquipment.EQ = {
      ...f.profile.profileEquipment.EQ,
      robe: 'iron',
      blade: 'steel',
      pet: 'cat',
    };
    f.view.geometry.W = 731;
    f.view.geometry.H = 419;
    f.view.geometry.L = { ...f.view.geometry.L, player: { x: 34, y: 56, h: 78 } };
    f.view.sealState.SEAL = 'changed-seal';
    f.view.presentationState.time = 123;
    f.view.presentationState.wind = 4.5;
    f.view.presentationState.zoom = 2;
    f.view.presentationState.lb = 0.4;
    p.environmentState.leaves = [];
    p.environmentState.mistSprite = document.createElement('canvas');
    f.run.activity.activeTrial = { id: 'live-view-test' };
    controls.cinematic.open();
    const figure = views.createFiguresPresentation,
      player = views.createPlayerFigures;
    const scene = views.createRuntimeScene,
      environment = views.createEnvironmentPresentation;
    const feedback = views.createFeedbackPresentation;
    const observed = [
      figure.EQ === f.profile.profileEquipment.EQ,
      player.EQ === f.profile.profileEquipment.EQ,
      player.L === f.view.geometry.L,
      figure.W === 731,
      figure.H === 419,
      figure.SEAL === 'changed-seal',
      figure.time === 123,
      figure.wind === 4.5,
      scene.time === 123,
      scene.zoom === 2,
      scene.mistSprite === p.environmentState.mistSprite,
      environment.activeTrial === f.run.activity.activeTrial,
      environment.cinematic.active,
      environment.leaves === p.environmentState.leaves,
      feedback.leaves === p.environmentState.leaves,
      feedback.mistSprite === p.environmentState.mistSprite,
      feedback.time === 123,
      views.createPostPresentation.lb === 0.4,
      player.isRobeSp() === game.isRobeSp(),
      JSON.stringify(player.bladeStyle()) === JSON.stringify(p.bladeStyle()),
    ];
    return { count: Object.keys(readers).length, stable, constructions, observed };
  });
  expect(result.count).toBe(12);
  expect(result.stable).toBe(true);
  expect(result.constructions).toBe(0);
  result.observed.forEach((value, index) => expect(value, `live field ${index}`).toBe(true));
  expect(errors).toEqual([]);
});
