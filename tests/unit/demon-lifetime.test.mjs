import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemonRealmRenderer } from '../../src/rendering/environment/demon-realm.ts';
import { assetMaterialCatalog } from '../../src/rendering/asset-material-catalog.ts';

test('Demon inputs load only on preparation, share pending work and recover after a failed decode', async () => {
  const images = [];
  let fail = true;
  const doc = {
    createElement(kind) {
      if (kind === 'canvas') return { width: 0, height: 0 };
      const image = {
        width: 0,
        height: 0,
        naturalWidth: 0,
        naturalHeight: 0,
        src: '',
        async decode() {
          if (fail) throw Error('fixture decode failure');
          const pack = assetMaterialCatalog.find(
            (pack) => pack.source === this.src || Object.values(pack.maps).includes(this.src),
          );
          assert.ok(pack);
          [this.naturalWidth, this.naturalHeight] = pack.dimensions;
        },
        removeAttribute() {
          this.src = '';
          this.naturalWidth = this.naturalHeight = 0;
        },
      };
      images.push(image);
      return image;
    },
  };
  const scene = createDemonRealmRenderer(doc);
  assert.equal(images.length, 3);
  assert.ok(
    images.every((image) => image.src === ''),
    'ordinary startup sends no Demon image requests',
  );
  const first = scene.prepare();
  assert.equal(scene.prepare(), first);
  assert.equal(await first, false);
  assert.ok(images.every((image) => image.src === ''));
  fail = false;
  assert.equal(await scene.prepare(), true);
  assert.equal(images.filter((image) => image.naturalWidth > 0).length, 9);
  scene.dispose();
  assert.ok(images.every((image) => image.src === ''));
  assert.equal(await scene.prepare(), false);
});
