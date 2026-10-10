import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('live gameplay starts with its main-canvas programs already compiled', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }));
    const trace = {
      gameplay: false,
      events: [] as { phase: string; kind: string; time: number }[],
    };
    Object.assign(window, { shaderTrace: trace });
    const nativeMark = performance.mark.bind(performance);
    performance.mark = (name, options) => {
      if (name.startsWith('issen:textures-warmed:false:')) trace.gameplay = true;
      return nativeMark(name, options);
    };
    for (const key of ['compileShader', 'linkProgram'] as const) {
      const native = WebGL2RenderingContext.prototype[key];
      Object.defineProperty(WebGL2RenderingContext.prototype, key, {
        configurable: true,
        value: function (this: WebGL2RenderingContext, value: WebGLShader | WebGLProgram) {
          if (this.canvas instanceof HTMLCanvasElement && this.canvas.id === 'c') {
            const phase = trace.gameplay ? 'gameplay' : 'loading';
            trace.events.push({ phase, kind: key, time: performance.now() });
            performance.mark(`shader:${phase}:${key}`);
          }
          return native.call(this, value);
        },
      });
    }
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Tracing.start', {
    categories: 'blink.user_timing,devtools.timeline',
    transferMode: 'ReturnAsStream',
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 30000 });
  await page.waitForFunction(() =>
    performance
      .getEntriesByType('mark')
      .some((entry) => entry.name.startsWith('issen:first-gameplay-frame:')),
  );
  await page.evaluate(() => {
    (window as any).shaderTrace.gameplay = true;
  });
  await page.waitForTimeout(1000);
  const events = await page.evaluate(
    () => (window as any).shaderTrace.events as { phase: string; kind: string; time: number }[],
  );
  const finished = new Promise<{ stream: string }>((resolve) =>
    cdp.once('Tracing.tracingComplete', resolve),
  );
  await cdp.send('Tracing.end');
  const { stream } = await finished;
  let trace = '';
  while (true) {
    const chunk = await cdp.send('IO.read', { handle: stream });
    trace += chunk.data;
    if (chunk.eof) break;
  }
  await cdp.send('IO.close', { handle: stream });
  const tracePath = testInfo.outputPath('gameplay-shader-trace.json');
  const eventsPath = testInfo.outputPath('gameplay-program-events.json');
  await writeFile(tracePath, trace);
  await writeFile(eventsPath, JSON.stringify(events));
  await testInfo.attach('gameplay-shader-trace.json', {
    path: tracePath,
    contentType: 'application/json',
  });
  await testInfo.attach('gameplay-program-events.json', {
    path: eventsPath,
    contentType: 'application/json',
  });
  expect(events.some((event) => event.phase === 'loading')).toBe(true);
  expect(events.filter((event) => event.phase === 'gameplay')).toEqual([]);
});

for (const parallel of [true, false])
  test(`all scene programs warm before gameplay (parallel ${parallel})`, async ({
    page,
  }, testInfo) => {
    await page.goto('/privacy/index.html');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Tracing.start', {
      categories: 'blink.user_timing,devtools.timeline',
      transferMode: 'ReturnAsStream',
    });
    const result = await page.evaluate(async (parallel) => {
      const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
      const { createDriftRenderer } = await import('/src/rendering/scene/drift-renderer.ts');
      const { createLeafMotion } = await import('/src/rendering/scene/leaf-motion.ts');
      const { drawMaterialStamp, setSceneLighting } =
        await import('/src/rendering/scene-material.ts');
      const { drawInstancedGrass } = await import('/src/rendering/scene-grass.ts');
      const { applyFilm } = await import('/src/rendering/effects/film.ts');
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 96;
      const painter = await createPixiScenePainter(canvas);
      const gl = canvas.getContext('webgl2')!;
      const getExtension = gl.getExtension.bind(gl);
      const extension = getExtension('KHR_parallel_shader_compile');
      if (!parallel)
        gl.getExtension = ((name: string) =>
          name === 'KHR_parallel_shader_compile'
            ? null
            : getExtension(name)) as typeof gl.getExtension;
      let phase = 'loading',
        earlyReflection = 0;
      const events: { phase: string; kind: string; time: number }[] = [];
      const record = (kind: string) => {
        events.push({ phase, kind, time: performance.now() });
        performance.mark(`shader:${phase}:${kind}`);
      };
      const compile = gl.compileShader.bind(gl),
        link = gl.linkProgram.bind(gl),
        parameter = gl.getProgramParameter.bind(gl);
      gl.compileShader = (shader) => {
        record('compile');
        compile(shader);
      };
      gl.linkProgram = (program) => {
        record('link');
        link(program);
      };
      gl.getProgramParameter = (program, name) => {
        if (
          parallel &&
          extension &&
          name !== extension.COMPLETION_STATUS_KHR &&
          !parameter(program, extension.COMPLETION_STATUS_KHR)
        )
          earlyReflection++;
        return parameter(program, name);
      };
      const owner = createDriftRenderer(document, () => painter),
        motion = createLeafMotion();
      const leaf = {
        x: 48,
        y: 48,
        z: 1,
        s: 20,
        rot: 0.7,
        vr: 1,
        fl: 0.3,
        vf: 1,
        vy: 1,
        ph: 1,
        col: '#322321',
        sprite: 'leaves.willow',
      };
      motion.register(leaf);
      const source = document.createElement('canvas');
      source.width = source.height = 8;
      const drawing = source.getContext('2d')!;
      drawing.fillStyle = '#c84';
      drawing.fillRect(0, 0, 8, 8);
      const texture = { source, revision: 0 },
        material = { lighting: 1, depth: 1, fog: 0, fogColor: [0, 0, 0] as const };
      const blades = [{ x: 48, y: 90, h: 25, w: 3, ph: 1, col: '#685' }];
      const modes = [
        'mono',
        'noir',
        'trial-glitch',
        'trial-inferno',
        'supporter-print',
        'trial-gold',
        'trial-dusk',
        'trial-dawn',
        'sepia',
        'silver',
        'cyan',
        'nitrate',
        'ukiyo',
        'koda',
      ];
      function frame(film: string, lighting: string, grass: string) {
        painter.begin();
        canvas.dataset.graphicsLighting = lighting;
        canvas.dataset.graphicsGrass = grass;
        setSceneLighting(painter, {
          ambient: [0.4, 0.4, 0.4],
          directional: [0.2, 0.2, 0.2],
          direction: [0, 0, 1],
          points: [],
        });
        painter.fillStyle = '#123';
        painter.fillRect(0, 0, 96, 96);
        painter.save();
        painter.filter = 'grayscale(.4) blur(2px)';
        drawMaterialStamp(painter, { texture, material, x: 20, y: 20, width: 50, height: 50 });
        painter.restore();
        drawInstancedGrass(painter, { blades, time: 1, wind: 0.5, depth: 2, density: 1 });
        owner.drawLeaves(painter, {
          leaves: [leaf],
          front: false,
          motion,
          spriteMotion: true,
          scale: 1,
          width: 96,
          height: 96,
        });
        applyFilm(painter, 96, 96, canvas, film, 1);
        painter.flush();
      }
      try {
        await owner.prepare(0);
        if (!(await painter.warmSceneShaders(new AbortController().signal)))
          throw Error('Warmup failed');
        phase = 'gameplay';
        for (const film of modes)
          for (const lighting of ['off', 'half', 'full'])
            for (const grass of ['medium', 'high']) frame(film, lighting, grass);
        for (const view of ['g0', 'g1', 'g2', 'diffuse', 'specular']) {
          canvas.dataset.lightingView = view;
          frame('mono', 'full', 'high');
        }
        delete canvas.dataset.lightingView;
        phase = 'restoring';
        const loss = new Promise<void>((resolve) =>
          canvas.addEventListener('webglcontextlost', () => resolve(), { once: true }),
        );
        const lose = gl.getExtension('WEBGL_lose_context')!;
        lose.loseContext();
        await loss;
        await new Promise((resolve) => setTimeout(resolve, 0));
        const restored = new Promise<void>((resolve) =>
          canvas.addEventListener('webglcontextrestored', () => resolve(), { once: true }),
        );
        lose.restoreContext();
        await restored;
        if (!(await painter.recoveryReady)) throw Error('Recovery warmup failed');
        phase = 'gameplay-after-restore';
        for (const film of modes) frame(film, 'full', 'high');
        return {
          events,
          earlyReflection,
          available: Boolean(extension),
          error: gl.getError(),
          state: canvas.dataset.contextState,
        };
      } finally {
        owner.dispose();
        painter.dispose();
      }
    }, parallel);
    const finished = new Promise<{ stream: string }>((resolve) =>
      cdp.once('Tracing.tracingComplete', resolve),
    );
    await cdp.send('Tracing.end');
    const { stream } = await finished;
    let trace = '';
    while (true) {
      const chunk = await cdp.send('IO.read', { handle: stream });
      trace += chunk.data;
      if (chunk.eof) break;
    }
    await cdp.send('IO.close', { handle: stream });
    const tracePath = testInfo.outputPath('shader-trace.json');
    const eventsPath = testInfo.outputPath('program-events.json');
    await writeFile(tracePath, trace);
    await writeFile(eventsPath, JSON.stringify(result));
    await testInfo.attach('shader-trace.json', {
      path: tracePath,
      contentType: 'application/json',
    });
    await testInfo.attach('program-events.json', {
      path: eventsPath,
      contentType: 'application/json',
    });
    expect(result.events.filter((event) => event.phase.startsWith('gameplay'))).toEqual([]);
    expect(
      result.events.filter((event) => event.phase === 'loading' && event.kind === 'link').length,
    ).toBeGreaterThan(10);
    expect(
      result.events.filter((event) => event.phase === 'restoring' && event.kind === 'link').length,
    ).toBeGreaterThan(10);
    expect(result.earlyReflection).toBe(0);
    expect(result.error).toBe(0);
    expect(result.state).toBe('ready');
  });
