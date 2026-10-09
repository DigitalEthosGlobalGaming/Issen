import { test, expect } from '@playwright/test';

test('every converted runtime plane decodes with unchanged placement, alpha and exact data', async ({
  page,
}) => {
  test.setTimeout(300_000);
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const manifest = (await import('/scripts/assets/compaction-manifest.json')).default;
    let count = 0,
      dataCount = 0,
      authoringCount = 0;
    const retiredDrift = new Set(
      ['leaves', 'petals', 'debris', 'fire'].map(
        (family) => `src/rendering/environment/assets/drift-${family}-atlas.webp`,
      ),
    );
    const decode = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed image request ${url}: ${response.status}`);
      return createImageBitmap(await response.blob(), {
        premultiplyAlpha: 'none',
        colorSpaceConversion: 'none',
      });
    };
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: false })!;
    if (!gl) throw new Error('WebGL2 is required for exact raw image sampling');
    const read = (image: ImageBitmap) => {
      const texture = gl.createTexture()!,
        target = gl.createFramebuffer()!;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
        throw new Error('Image readback target incomplete');
      const data = new Uint8Array(image.width * image.height * 4);
      gl.readPixels(0, 0, image.width, image.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
      gl.deleteFramebuffer(target);
      gl.deleteTexture(texture);
      return data;
    };
    for (const record of manifest.files) {
      if (!record.newPath) continue;
      // These historical conversions were replaced by the deliberately resized
      // merged drift pair. Their PNG authoring sources must remain decodable.
      if (retiredDrift.has(record.newPath)) {
        const authoring = await decode('/' + record.originalPath);
        authoring.close();
        authoringCount++;
        continue;
      }
      const runtime = '/' + record.newPath.replace(/^public\//, '');
      const [original, converted] = await Promise.all([
        decode(
          '/' + (record.backupPath ?? 'tmp/asset-compaction/originals/' + record.originalPath),
        ),
        decode(runtime),
      ]);
      if (original.width !== converted.width || original.height !== converted.height)
        throw new Error(`Dimensions changed: ${record.originalPath}`);
      const before = read(original),
        after = read(converted);
      const dataPlane = /_(normal|surface|emissive)\.png$/.test(record.originalPath);
      const sums = [0, 0, 0],
        maxima = [0, 0, 0];
      let visible = 0;
      for (let i = 0; i < before.length; i += 4) {
        if (before[i + 3] !== after[i + 3])
          throw new Error(`Alpha changed: ${record.originalPath} pixel ${i / 4}`);
        if (!dataPlane && before[i + 3] === 0) continue;
        visible++;
        for (let channel = 0; channel < 3; channel++) {
          const delta = Math.abs(before[i + channel] - after[i + channel]);
          sums[channel] += delta;
          maxima[channel] = Math.max(maxima[channel], delta);
        }
      }
      if (
        maxima.some((value) => value > (dataPlane ? 0 : 8)) ||
        sums.some((value) => value / Math.max(1, visible) > (dataPlane ? 0 : 0.5))
      )
        throw new Error(
          `Decoded tolerance failed: ${record.originalPath}, maxima=${maxima}, means=${sums.map((value) => value / Math.max(1, visible))}`,
        );
      original.close();
      converted.close();
      count++;
      if (dataPlane) dataCount++;
    }
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { count, dataCount, authoringCount };
  });
  expect(result.count).toBeGreaterThan(250);
  expect(result.dataCount).toBe(180);
  expect(result.authoringCount).toBe(4);
});
