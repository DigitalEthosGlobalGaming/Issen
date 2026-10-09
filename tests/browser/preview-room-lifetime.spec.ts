import { test, expect } from '@playwright/test';

test('preview rooms load on demand, share decoded inputs and release only unpinned peers', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createArmoryPreview } = await import('/src/rendering/armory-preview.ts');
    const { SceneSurface } = await import('/src/rendering/scene-surface.ts');
    const { trimMainImages } = await import('/src/platform/main-images.ts');
    const original = HTMLImageElement.prototype.decode;
    const rooms: HTMLImageElement[] = [];
    HTMLImageElement.prototype.decode = async function () {
      await original.call(this);
      if (this.naturalWidth === 1536 && this.naturalHeight === 1024) rooms.push(this);
    };
    const canvases = [document.createElement('canvas'), document.createElement('canvas')];
    canvases.forEach((canvas) => {
      canvas.width = 160;
      canvas.height = 120;
    });
    const surfaces = canvases.map((canvas) => new SceneSurface(canvas));
    await Promise.all(surfaces.map((surface) => surface.initialize()));
    const silent = () => {};
    const services = {
      random: () => 0.5,
      now: () => 1000,
      sounds: {
        zap: silent,
        shatter: silent,
        poof: silent,
        crackle: silent,
        popper: silent,
        squeak: silent,
        bonk: silent,
        slice: silent,
        clink: silent,
      },
    };
    const selection = () => ({
      prepare: async () => true,
      select: () => false,
      sources: () => [],
      dispose() {},
    });
    const artwork = {
      inkCharm: { prepare: async () => true },
      inkEnemy: { prepare: async () => true },
      inkSword: { prepare: async () => true },
      inkCompanion: { borrow: selection },
      inkPlayer: { borrow: selection, releaseCanvas() {} },
    };
    const previews = canvases.map((canvas, index) =>
      createArmoryPreview(canvas, services, artwork as any, surfaces[index]),
    );
    try {
      const eagerRooms = rooms.length;
      await Promise.all(previews.map((preview) => preview.prepare()));
      const sharedRoomCount = rooms.length;
      previews[0].suspend();
      trimMainImages(document, 1024 * 1024 * 1024);
      const peerAlive = rooms.every((image) => image.naturalWidth > 0);
      previews[1].suspend();
      trimMainImages(document, 1024 * 1024 * 1024);
      const allClosed = rooms.every((image) => image.naturalWidth === 0);
      await previews[0].prepare();
      return {
        eagerRooms,
        sharedRoomCount,
        peerAlive,
        allClosed,
        reloaded: rooms.length - sharedRoomCount,
      };
    } finally {
      previews.forEach((preview) => preview.dispose());
      surfaces.forEach((surface) => surface.dispose());
      HTMLImageElement.prototype.decode = original;
    }
  });
  expect(result).toEqual({
    eagerRooms: 0,
    sharedRoomCount: 4,
    peerAlive: true,
    allClosed: true,
    reloaded: 4,
  });
});
