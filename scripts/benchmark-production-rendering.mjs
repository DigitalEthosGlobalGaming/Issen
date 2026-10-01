import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { stripTypeScriptTypes } from 'node:module';
const origin = process.argv[2] || 'http://127.0.0.1:5183';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  const baseline = process.argv.find(
    (arg) => arg === '--baseline' || arg.startsWith('--baseline='),
  );
  if (baseline) {
    const ref = baseline.includes('=') ? baseline.slice('--baseline='.length) : 'HEAD';
    const original = execFileSync(
      'git',
      [
        '-c',
        `safe.directory=${process.cwd().replaceAll('\\', '/')}`,
        'show',
        `${ref}:src/rendering/figures/ink-enemy.ts`,
      ],
      { encoding: 'utf8' },
    );
    if (!original.includes('cache.size > 96'))
      throw new Error('Selected revision is not the original 96-entry baseline');
    const body = stripTypeScriptTypes(original);
    await page.route('**/src/rendering/figures/ink-enemy.ts', (route) =>
      route.fulfill({ contentType: 'text/javascript', body }),
    );
  }
  await page.goto(`${origin}/privacy/index.html`);
  if (await page.locator('#app, script[src*="main.ts"]').count())
    throw new Error('Benchmark must run without the application render loop');
  console.log(
    JSON.stringify(
      await page.evaluate(async () => {
        const imports = await Promise.all(
          [
            'figures/figure',
            'figures/model',
            'figures/ink-player',
            'figures/ink-enemy',
            'figures/ink-sword',
            'figures/ink-charms',
            'figures/ink-companions',
            'palette',
            'environment/index',
          ].map((name) => import(`/src/rendering/${name}.ts`)),
        );
        const [
          figureModule,
          model,
          playerModule,
          enemyModule,
          swordModule,
          charmModule,
          companionModule,
          paletteModule,
          sceneModule,
        ] = imports;
        const hooks = {
          inkPlayer: playerModule.createInkPlayerRenderer(document),
          inkEnemy: enemyModule.createInkEnemyRenderer(document),
          inkSword: swordModule.createInkSwordRenderer(document),
          inkCharm: charmModule.createInkCharmRenderer(document),
          inkCompanion: companionModule.createInkCompanionRenderer(document),
        };
        await Promise.all(Object.values(hooks).map((hook) => hook.prepare()));
        const scene = sceneModule.createEnvironmentRenderer(document);
        for (let stage = 0; stage < 9; stage++) await scene.prepare(stage);
        const palette = paletteModule.createPalette();
        const canvas = document.createElement('canvas');
        document.body.replaceChildren(canvas);
        const ctx = canvas.getContext('2d');
        const next = () => new Promise(requestAnimationFrame);
        const stats = (values) => {
          values.sort((a, b) => a - b);
          return {
            median: +values[Math.floor(values.length / 2)].toFixed(2),
            p95: +values[Math.floor(values.length * 0.95)].toFixed(2),
          };
        };
        const results = [];
        for (const [width, height] of [
          [1440, 900],
          [1024, 768],
        ]) {
          canvas.width = width;
          canvas.height = height;
          for (const count of [100, 500])
            for (const switches of [false, true]) {
              const figures = Array.from({ length: count }, (_, i) => ({
                x: (i * 137) % width,
                y: 140 + ((i * 83) % (height - 140)),
                h: 110,
                fog: (i % 5) * 0.1,
                d: model.makeFig(i + 1),
                pose: { ...model.EPOSE.left },
                back: i % 10 === 0,
                varied: true,
                robeId: ['sumi', 'hai', 'shiro', 'tanuki', 'yoroi'][Math.floor(i / 10) % 5],
                bladeId: 'steel',
                blade: {
                  len: 0.52,
                  aura:
                    i % 7 === 0
                      ? { c: '215,208,255', mode: ['bolt', 'frost', 'petal', 'glow'][i % 4] }
                      : null,
                },
                charm: i % 10 === 0 ? 'suzu' : undefined,
                charmId: i % 10 === 0 ? 'suzu' : undefined,
                pet: i % 10 === 0 ? 'crow' : undefined,
              }));
              const command = [],
                frames = [];
              let allocations = 0,
                reads = 0,
                draws = 0;
              const create = document.createElement.bind(document);
              const drawImage = CanvasRenderingContext2D.prototype.drawImage;
              const read = CanvasRenderingContext2D.prototype.getImageData;
              document.createElement = (...args) => {
                if (args[0] === 'canvas') allocations++;
                return create(...args);
              };
              CanvasRenderingContext2D.prototype.drawImage = function (...args) {
                draws++;
                return drawImage.apply(this, args);
              };
              CanvasRenderingContext2D.prototype.getImageData = function (...args) {
                reads++;
                return read.apply(this, args);
              };
              let last = await next();
              for (let frame = 0; frame < 28; frame++) {
                const stage = switches ? frame % 9 : 0;
                await scene.prepare(stage);
                const start = performance.now();
                const env = {
                  ...hooks,
                  time: frame / 60,
                  wind: 0.2,
                  petActive: true,
                  width,
                  height,
                  palette: (fog) => palette.fog(fog, [100, 110, 120]),
                  random: () => 0.5,
                  effectDensity: 1,
                  reducedMotion: false,
                  reducedFlashes: false,
                };
                const sceneFrame = {
                  width,
                  height,
                  dpr: 1,
                  time: frame / 60,
                  stage,
                  reducedMotion: false,
                  reducedFlashes: false,
                  lowQuality: false,
                };
                scene.draw(ctx, sceneFrame);
                for (const f of figures) {
                  // Match runtime's per-figure facade construction, with changing poses/effects.
                  f.pose.ang = Math.sin(frame * 0.1 + f.d.seed) * 0.3;
                  figureModule.createFigureRenderer(ctx, env).drawFigure(f);
                }
                const figureRenderer = figureModule.createFigureRenderer(ctx, env);
                figureRenderer.drawPetAt('shiba', width * 0.1, height * 0.9, 75);
                figureRenderer.drawPetAt('cat', width * 0.2, height * 0.9, 65);
                scene.drawForeground(ctx, sceneFrame);
                const elapsed = performance.now() - start;
                const now = await next();
                if (frame >= 8) {
                  command.push(elapsed);
                  frames.push(now - last);
                }
                last = now;
              }
              document.createElement = create;
              CanvasRenderingContext2D.prototype.drawImage = drawImage;
              CanvasRenderingContext2D.prototype.getImageData = read;
              results.push({
                width,
                height,
                count,
                switches,
                commandMs: stats(command),
                frameIntervalMs: stats(frames),
                allocationsAcross28Frames: allocations,
                pixelReads: reads,
                spriteDrawCalls: draws,
                environment: scene.snapshot(),
                enemy: hooks.inkEnemy.snapshot(),
              });
            }
        }
        scene.dispose();
        Object.values(hooks).forEach((hook) => hook.dispose());
        return { userAgent: navigator.userAgent, results };
      }),
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
