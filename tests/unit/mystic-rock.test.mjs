import { registerMaterialSink } from '../../src/rendering/scene-material.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInkCompanionRenderer,
  INK_COMPANION_FRAMES,
} from '../../src/rendering/figures/ink-companions.ts';
import { assetMaterialCatalog } from '../../src/rendering/asset-material-catalog.ts';

function fixture() {
  const images = [];
  const doc = {
    createElement(tag) {
      if (tag === 'canvas') return { width: 0, height: 0 };
      const image = {
        naturalWidth: 0,
        naturalHeight: 0,
        onload: null,
        onerror: null,
        removeAttribute() {
          delete this.src;
        },
        async decode() {
          const pack = assetMaterialCatalog.find((pack) =>
            Object.values(pack.maps).includes(this.src),
          );
          assert.ok(pack, `Unexpected material URL: ${this.src}`);
          [this.naturalWidth, this.naturalHeight] = pack.dimensions;
        },
      };
      images.push(image);
      return image;
    },
  };
  const pending = new Set();
  let disposed = false;
  const owner = {
    acquire(url) {
      const image = doc.createElement('img');
      image.src = url;
      let released = false;
      const ready = new Promise((resolve, reject) => {
        const finish = (error) => {
          pending.delete(cancel);
          image.onload = image.onerror = null;
          if (error || released || disposed) reject(error ?? Error('Lease released'));
          else resolve(image);
        };
        const cancel = () => finish(Error('Owner disposed'));
        pending.add(cancel);
        image.onload = () => finish();
        image.onerror = () => finish(Error('Decode failed'));
        if (url.includes('/pbr/'))
          queueMicrotask(async () => {
            if (disposed) return;
            await image.decode();
            image.onload?.();
          });
      });
      return {
        ready,
        release: () => {
          released = true;
        },
      };
    },
    snapshot: () => ({}),
    dispose() {
      disposed = true;
      for (const cancel of [...pending]) cancel();
      for (const image of images) image.removeAttribute('src');
    },
  };
  const renderer = createInkCompanionRenderer(doc, owner);
  return { renderer, images };
}
function context() {
  const calls = [];
  let depth = 0;
  const ctx = {
    save() {
      depth++;
    },
    restore() {
      assert.ok(depth > 0);
      depth--;
    },
    translate(...args) {
      calls.push(['translate', ...args]);
    },
    rotate(...args) {
      calls.push(['rotate', ...args]);
    },
    scale(...args) {
      calls.push(['scale', ...args]);
    },
    drawImage(_image, ...args) {
      calls.push(['image', ...args]);
    },
  };
  registerMaterialSink(ctx, {
    lights() {},
    draw({ texture, x, y, width, height }) {
      // Record the native stamp geometry, matching the existing pose assertions.
      if (texture.frame) ctx.drawImage(texture.source, ...texture.frame, x, y, width, height);
      else ctx.drawImage(texture.source, x, y, width, height);
    },
  });
  return { ctx, calls, depth: () => depth };
}
test('each rig composes four native-aspect parts, animates joints and freezes accessibility poses', async () => {
  const { renderer, images } = fixture();
  const pending = renderer.prepare();
  assert.equal(images.filter((i) => !i.src.includes('/pbr/')).length, 2);
  const rock = images.find((i) => i.src.endsWith('mystic-rock.webp'));
  rock.naturalWidth = 1145;
  rock.naturalHeight = 1373;
  rock.onload();
  const parts = images.find((i) => i.src.endsWith('companion-parts-atlas.webp'));
  parts.naturalWidth = parts.naturalHeight = 1254;
  parts.onload();
  await pending;
  for (const type of ['shiba', 'cat', 'crow']) {
    const a = context(),
      b = context(),
      c = context();
    assert.equal(renderer.draw(type, a.ctx, 100, 200, 120, 0, false, true), true);
    renderer.draw(type, b.ctx, 100, 200, 120, 99, true, true);
    assert.deepEqual(a.calls, b.calls, `${type} has a stable reduced-motion pose`);
    renderer.draw(type, c.ctx, 100, 200, 120, 1.1, true);
    assert.notDeepEqual(a.calls, c.calls, `${type} articulates individual parts`);
    const draws = a.calls.filter((c) => c[0] === 'image');
    assert.equal(draws.length, 4);
    assert.equal(new Set(draws.map((c) => `${c[1]},${c[2]}`)).size, 4);
    for (const d of draws) {
      assert.ok(INK_COMPANION_FRAMES.some((f) => f.every((n, i) => n === d[i + 1])));
      assert.equal(d[3] / d[4], d[7] / d[8]);
    }
    assert.equal(a.depth(), 0);
    assert.equal(b.depth(), 0);
    assert.equal(c.depth(), 0);
  }
  assert.equal(renderer.draw('unknown', context().ctx, 0, 0, 100), false);
  renderer.dispose();
  assert.equal(renderer.draw('cat', context().ctx, 0, 0, 100), false);
});
test('disposing during companion loading settles preparation and releases callbacks', async () => {
  const { renderer, images } = fixture();
  const pending = renderer.prepare();
  renderer.dispose();
  await pending;
  assert.equal(renderer.ready, false);
  for (const image of images) {
    assert.equal(image.onload, null);
    assert.equal(image.onerror, null);
    assert.equal(image.src, undefined);
  }
});
test('incorrect atlas geometry never renders incomplete parts', async () => {
  const { renderer, images } = fixture();
  const pending = renderer.prepare();
  images.find((i) => i.src.endsWith('mystic-rock.webp')).onerror();
  const parts = images.find((i) => i.src.endsWith('companion-parts-atlas.webp'));
  parts.naturalWidth = 100;
  parts.naturalHeight = 200;
  parts.onload();
  await pending;
  assert.equal(renderer.ready, false);
  assert.equal(renderer.draw('shiba', context().ctx, 0, 0, 100), false);
});

test('Mystic Rock retains the original floating sprite and freezes with reduced motion', async () => {
  const { renderer, images } = fixture();
  const pending = renderer.prepare();
  const rock = images.find((i) => i.src.endsWith('mystic-rock.webp'));
  rock.naturalWidth = 1145;
  rock.naturalHeight = 1373;
  rock.onload();
  images.find((i) => i.src.endsWith('companion-parts-atlas.webp')).onerror();
  await pending;
  const a = context(),
    b = context();
  assert.equal(renderer.draw('mystic-rock', a.ctx, 100, 200, 120, 0, false, true), true);
  renderer.draw('mystic-rock', b.ctx, 100, 200, 120, 99, true, true);
  assert.deepEqual(a.calls, b.calls);
  assert.equal(a.calls.filter((c) => c[0] === 'image').length, 1);
});
