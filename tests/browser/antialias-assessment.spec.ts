import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('context MSAA assessment compares the real back-buffer pipeline against a direct WebGL control', async ({
  page,
}, testInfo) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawInstancedGrass } = await import('/src/rendering/scene-grass.ts');
    const { setSceneLighting } = await import('/src/rendering/scene-material.ts');
    const { applyFilm } = await import('/src/rendering/effects/film.ts');
    const copy = document.createElement('canvas');
    const read = copy.getContext('2d', { willReadFrequently: true })!;
    function pixels(canvas: HTMLCanvasElement) {
      copy.width = canvas.width;
      copy.height = canvas.height;
      read.drawImage(canvas, 0, 0);
      return read.getImageData(0, 0, copy.width, copy.height).data.slice();
    }
    function diff(a: Uint8ClampedArray, b: Uint8ClampedArray) {
      let channels = 0,
        maximum = 0;
      for (let i = 0; i < a.length; i++) {
        const distance = Math.abs(a[i]! - b[i]!);
        if (distance) channels++;
        maximum = Math.max(maximum, distance);
      }
      return { channels, maximum };
    }
    function direct(antialias: boolean) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 128;
      const gl = canvas.getContext('webgl2', { antialias, preserveDrawingBuffer: true })!;
      const program = gl.createProgram()!;
      const vertex = gl.createShader(gl.VERTEX_SHADER)!;
      const fragment = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(
        vertex,
        '#version 300 es\nin vec2 p; void main(){gl_Position=vec4(p,0.,1.);}',
      );
      gl.shaderSource(
        fragment,
        '#version 300 es\nprecision highp float;out vec4 c;void main(){c=vec4(1.,1.,1.,1.);}',
      );
      gl.compileShader(vertex);
      gl.compileShader(fragment);
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-0.91, -0.88, 0.86, -0.63, -0.47, 0.93]),
        gl.STATIC_DRAW,
      );
      const location = gl.getAttribLocation(program, 'p');
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
      gl.viewport(0, 0, 128, 128);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const samples = gl.getParameter(gl.SAMPLES),
        enabled = gl.getContextAttributes()!.antialias;
      const output = pixels(canvas);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return { output, samples, enabled };
    }
    const directOn = direct(true),
      directOff = direct(false);
    const combinations = [
      [true, true],
      [true, false],
      [false, true],
      [false, false],
    ];
    const canvases = combinations.map(() => document.createElement('canvas'));
    for (const canvas of canvases) {
      canvas.width = 256;
      canvas.height = 144;
    }
    const painters = await Promise.all(
      canvases.map((canvas, index) =>
        createPixiScenePainter(canvas, {
          antialias: combinations[index]![0],
          contextAntialias: combinations[index]![1],
        }),
      ),
    );
    const actualContexts = canvases.map(
      (canvas) => canvas.getContext('webgl2')!.getContextAttributes()!.antialias,
    );
    const blades = Array.from({ length: 18 }, (_, index) => ({
      x: 110 + index * 5,
      y: 135,
      h: 35 + (index % 4) * 9,
      w: 2.3,
      ph: index * 0.7,
      col: '#788756',
    }));
    const rows = [];
    document.body.replaceChildren();
    document.body.style.cssText = 'margin:0;background:#ddd;color:#222;display:flex;gap:12px';
    try {
      for (const dpr of [1, 2])
        for (const lighting of ['off', 'half', 'full'])
          for (const grass of ['medium', 'high'])
            for (const film of ['', 'noir']) {
              const outputs = [];
              for (let i = 0; i < painters.length; i++) {
                const canvas = canvases[i]!,
                  g = painters[i]!;
                canvas.width = 256 * dpr;
                canvas.height = 144 * dpr;
                canvas.dataset.graphicsGrass = grass;
                g.begin();
                g.setTransform(dpr, 0, 0, dpr, 0, 0);
                setSceneLighting(g, {
                  ambient: [0.4, 0.4, 0.4],
                  directional: [0.5, 0.5, 0.5],
                  direction: [0.3, -0.5, 0.8],
                  points: [],
                  lightResolution: lighting === 'half' ? 0.5 : 1,
                  materialLighting: lighting === 'off' ? 0 : 1,
                });
                g.fillStyle = '#292724';
                g.fillRect(0, 0, 256, 144);
                g.save();
                g.translate(50.2, 35.7);
                g.rotate(0.31);
                g.fillStyle = '#eadcc1';
                g.fillRect(-22, -12, 55, 25);
                g.strokeStyle = '#d28964';
                g.lineWidth = 1.3;
                g.beginPath();
                g.moveTo(-25, 32);
                g.lineTo(60, -17);
                g.stroke();
                g.restore();
                g.fillStyle = '#b5baa6';
                g.beginPath();
                g.arc(80.7, 95.1, 18.3, 0, Math.PI * 2);
                g.fill();
                g.filter = 'blur(2px) grayscale(40%)';
                g.fillRect(8, 110, 32, 12);
                g.filter = 'none';
                g.fillStyle = '#ddd3bb';
                g.font = '13px serif';
                g.fillText('Issen', 150.3, 23.2);
                drawInstancedGrass(g, { blades, time: 1.7, wind: 0.6, depth: 0, density: 1 });
                if (film) applyFilm(g, 256, 144, canvas, film, 1.7, {});
                g.flush();
                outputs.push(pixels(canvas));
                if (dpr === 1 && lighting === 'full' && grass === 'high' && film === 'noir') {
                  const image = document.createElement('img');
                  image.src = copy.toDataURL();
                  image.alt = i === 0 ? 'MSAA on' : 'MSAA off';
                  document.body.append(image);
                }
              }
              rows.push({
                dpr,
                lighting,
                grass,
                film,
                rendererDifference: diff(outputs[0]!, outputs[2]!),
                contextOnDifference: diff(outputs[0]!, outputs[1]!),
                contextOffDifference: diff(outputs[2]!, outputs[3]!),
              });
            }
      return {
        direct: {
          ...diff(directOn.output, directOff.output),
          samples: directOn.samples,
          enabled: directOn.enabled,
        },
        actualContexts,
        rows,
      };
    } finally {
      for (const painter of painters) painter.dispose();
    }
  });
  await writeFile(
    testInfo.outputPath('antialias-assessment.json'),
    JSON.stringify(result, null, 2),
  );
  await page.screenshot({ path: testInfo.outputPath('antialias-on-off.png') });
  expect(result.actualContexts).toEqual([true, false, true, false]);
  expect(result.direct.enabled).toBe(true);
  expect(result.direct.samples).toBeGreaterThan(0);
  expect(result.direct.channels).toBeGreaterThan(0);
  for (const row of result.rows) {
    expect(row.contextOnDifference.channels, JSON.stringify(row)).toBe(0);
    expect(row.contextOffDifference.channels, JSON.stringify(row)).toBe(0);
    if (row.film === '') expect(row.rendererDifference.channels).toBeGreaterThan(0);
  }
});
