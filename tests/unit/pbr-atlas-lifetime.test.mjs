import test from 'node:test';
import assert from 'node:assert/strict';
import { createPbrAtlas } from '../../src/rendering/pbr-atlas.ts';
import { observeSceneTextureRetirement } from '../../src/rendering/texture-revision.ts';

const sources = { diffuse: 'colour', normal: 'normal', surface: 'surface', emissive: 'emissive' };
function image() {
  return {
    naturalWidth: 8,
    naturalHeight: 8,
    width: 8,
    height: 8,
    src: '',
    decode: async () => {},
    removeAttribute() {
      this.src = '';
      this.naturalWidth = this.naturalHeight = 0;
    },
  };
}

test('owned PBR images notify all consumers before closing and dispose only once', async () => {
  const images = [];
  const atlas = createPbrAtlas(
    {
      createElement() {
        const source = image();
        images.push(source);
        return source;
      },
    },
    sources,
    8,
  );
  assert.equal(await atlas.prepare(), true);
  const widths = [];
  for (const source of images)
    observeSceneTextureRetirement(source, () => widths.push(source.naturalWidth));
  atlas.dispose();
  atlas.dispose();
  assert.deepEqual(widths, [8, 8, 8, 8]);
  assert.equal(
    images.every(
      (source) => source.width === 0 && source.height === 0 && source.naturalWidth === 0,
    ),
    true,
  );
  assert.equal(atlas.ready, false);
  assert.equal(atlas.diffuse, null);
  assert.equal(atlas.material([0, 0, 8, 8]), null);
  assert.equal(await atlas.prepare(), false);
});

test('leased PBR disposal unpins once and leaves source retirement to its owner', async () => {
  const source = image();
  let releases = 0,
    retirements = 0;
  observeSceneTextureRetirement(source, () => retirements++);
  const images = {
    acquire() {
      return {
        ready: Promise.resolve(source),
        release() {
          releases++;
        },
      };
    },
  };
  const atlas = createPbrAtlas({}, sources, 8, 8, { images });
  assert.equal(await atlas.prepare(), true);
  atlas.dispose();
  atlas.dispose();
  assert.equal(releases, 4);
  assert.equal(retirements, 0);
  assert.equal(source.naturalWidth, 8);
  assert.equal(atlas.ready, false);
});

test('disposing a pending owned PBR atlas prevents late readiness and repeated retirement', async () => {
  const images = [],
    complete = [];
  const atlas = createPbrAtlas(
    {
      createElement() {
        const source = image();
        source.decode = () => new Promise((resolve) => complete.push(resolve));
        images.push(source);
        return source;
      },
    },
    sources,
    8,
  );
  const pending = atlas.prepare();
  let retirements = 0;
  for (const source of images) observeSceneTextureRetirement(source, () => retirements++);
  atlas.dispose();
  complete.forEach((resolve) => resolve());
  assert.equal(await pending, false);
  assert.equal(atlas.ready, false);
  assert.equal(atlas.material([0, 0, 8, 8]), null);
  atlas.dispose();
  assert.equal(retirements, 4);
  assert.equal(
    images.every((source) => !source.src),
    true,
  );
});

test('replaced owned PBR inputs preserve queued native frames before closure', async () => {
  const images = [];
  const atlas = createPbrAtlas(
    {
      createElement() {
        const source = image();
        images.push(source);
        return source;
      },
    },
    sources,
    8,
  );
  assert.equal(await atlas.prepare(), true);
  const retirement = [];
  for (const source of images)
    observeSceneTextureRetirement(source, (preserveFrame) =>
      retirement.push([preserveFrame, source.naturalWidth]),
    );
  atlas.dispose(true);
  assert.deepEqual(retirement, [
    [true, 8],
    [true, 8],
    [true, 8],
    [true, 8],
  ]);
  assert.ok(images.every((source) => source.naturalWidth === 0));
});
