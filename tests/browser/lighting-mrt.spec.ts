import { expect, test } from '@playwright/test';

test('Pixi WebGL2 renders three explicit GLSL outputs into one native MRT target', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const result = await page.evaluate(async () => {
    const { WebGLRenderer, RenderTarget, Mesh, MeshGeometry, Shader, Container } =
      await import('/tests/helpers/pixi-mrt.ts');
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { stencil: true })!;
    const renderer = new WebGLRenderer();
    await renderer.init({
      context: gl,
      canvas,
      width: 8,
      height: 8,
      resolution: 1,
      antialias: false,
      backgroundAlpha: 0,
    });
    const target = new RenderTarget({ width: 8, height: 8, colorTextures: 3, antialias: false });
    const shader = Shader.from({
      gl: {
        vertex: `#version 300 es
in vec2 aPosition; void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }`,
        fragment: `#version 300 es
precision highp float;
        layout(location = 0) out vec4 g0;
        layout(location = 1) out vec4 g1;
        layout(location = 2) out vec4 g2;
        void main() { g0 = vec4(1,0,0,1); g1 = vec4(0,1,0,1); g2 = vec4(0,0,1,1); }`,
        name: 'issen-mrt-capability-check',
      },
    });
    const geometry = new MeshGeometry({
      positions: new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]),
      uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
    });
    const mesh = new Mesh({ geometry, shader });
    mesh.state.blend = false;
    const root = new Container();
    root.addChild(mesh);
    renderer.render({ container: root, target, clear: true });
    renderer.renderTarget.bind({ target, clear: false });
    const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    const pixels = [0, 1, 2].map((index) => {
      gl.readBuffer(gl.COLOR_ATTACHMENT0 + index);
      const pixel = new Uint8Array(4);
      gl.readPixels(4, 4, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      return Array.from(pixel);
    });
    gl.readBuffer(gl.COLOR_ATTACHMENT0);
    const error = gl.getError();
    const attachments = target.colorTextures.length;
    const limits = [
      gl.getParameter(gl.MAX_DRAW_BUFFERS),
      gl.getParameter(gl.MAX_COLOR_ATTACHMENTS),
    ];
    root.removeChildren();
    mesh.destroy();
    geometry.destroy();
    shader.destroy();
    root.destroy();
    target.destroy();
    renderer.destroy({ removeView: false });
    return { complete, pixels, error, attachments, limits };
  });
  expect(errors).toEqual([]);
  expect(result.complete).toBe(true);
  expect(result.attachments).toBe(3);
  expect(result.limits.every((value) => value >= 3)).toBe(true);
  expect(result.error, JSON.stringify(result)).toBe(0);
  expect(result.pixels).toEqual([
    [255, 0, 0, 255],
    [0, 255, 0, 255],
    [0, 0, 255, 255],
  ]);
});
