import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '../..');
const catalog = JSON.parse(await readFile(path.join(root, 'scripts/pbr/asset-packs.json'), 'utf8'));
const browser = await chromium.launch({
  channel: process.env.PBR_BROWSER_CHANNEL ?? 'msedge',
  headless: true,
});
try {
  const page = await browser.newPage();
  const jobs = [...catalog.assets, ...(catalog.installed ?? [])];
  for (const job of jobs) {
    const directory = path.resolve(root, job.output);
    if (!directory.startsWith(root + path.sep))
      throw Error('Pack output must stay in the repository');
    const stem = path.basename(job.source, '.png');
    const channels = await Promise.all(
      ['roughness', 'metallic', 'ao'].map(
        async (kind) =>
          'data:image/png;base64,' +
          (await readFile(path.join(directory, `${stem}_${kind}.png`))).toString('base64'),
      ),
    );
    // Match the existing Canvas readback semantics, including transparent data
    // pixels. This work runs once in the asset tool rather than on scene changes.
    const png = await page.evaluate(async (urls) => {
      const images = await Promise.all(
        urls.map(async (url) => {
          const image = new Image();
          image.src = url;
          await image.decode();
          return image;
        }),
      );
      const [width, height] = [images[0].naturalWidth, images[0].naturalHeight];
      if (images.some((image) => image.naturalWidth !== width || image.naturalHeight !== height))
        throw Error('Surface channel dimensions differ');
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const g = canvas.getContext('2d', { willReadFrequently: true });
      const channels = images.map((image) => {
        g.clearRect(0, 0, width, height);
        g.drawImage(image, 0, 0);
        return g.getImageData(0, 0, width, height).data;
      });
      const packed = g.createImageData(width, height);
      for (let i = 0; i < packed.data.length; i += 4) {
        packed.data[i] = channels[0][i];
        packed.data[i + 1] = channels[1][i];
        packed.data[i + 2] = channels[2][i];
        packed.data[i + 3] = 255;
      }
      g.putImageData(packed, 0, 0);
      const png = canvas.toDataURL();
      const decoded = new Image();
      decoded.src = png;
      await decoded.decode();
      g.clearRect(0, 0, width, height);
      g.drawImage(decoded, 0, 0);
      const actual = g.getImageData(0, 0, width, height).data;
      if (actual.some((value, index) => value !== packed.data[index]))
        throw Error('Packed PNG differs from runtime surface data');
      canvas.width = canvas.height = 0;
      for (const image of [...images, decoded]) image.removeAttribute('src');
      return png.slice(png.indexOf(',') + 1);
    }, channels);
    await writeFile(path.join(directory, `${stem}_surface.png`), Buffer.from(png, 'base64'));
  }
  console.log(`Packed and verified ${jobs.length} runtime surface textures.`);
} finally {
  await browser.close();
}
