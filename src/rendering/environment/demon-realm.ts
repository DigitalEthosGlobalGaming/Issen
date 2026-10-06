import type { SceneDrawing } from '../scene-drawing.ts';
import { packedScenery, sceneryAtlas, type SceneryLease } from './packed-scenery.ts';
import type { PackedSceneryAtlas } from './packed-scene-atlas.ts';
import {
  createCachedMaterials,
  clearCachedMaterial,
  drawCachedImage,
  cachedMaterialContext,
} from '../cached-materials.ts';
import { invalidateSceneTexture } from '../texture-revision.ts';
import { drawAtlasSprite } from './scene-kit.ts';

/** Independently placed atlas props over a procedural sky; no flattened backdrop. */
export function createDemonRealmRenderer(doc: Document) {
  const cachedMaterials = createCachedMaterials();
  let lease: SceneryLease | undefined;
  let landmarks: PackedSceneryAtlas, terrain: PackedSceneryAtlas, mountains: PackedSceneryAtlas;
  let ready = false;
  let preparing: Promise<boolean> | undefined;
  function prepare(): Promise<boolean> {
    if (disposed) return Promise.resolve(false);
    return (preparing ??= (async () => {
      lease = packedScenery(doc).acquireGroup('demon');
      try {
        await lease.ready;
        if (disposed) return false;
        landmarks = sceneryAtlas('demon-landmarks-atlas', lease, cachedMaterials);
        terrain = sceneryAtlas('demon-terrain-atlas', lease, cachedMaterials);
        mountains = sceneryAtlas('mountain-atlas', lease, cachedMaterials);
        ready = true;
        return true;
      } catch {
        lease.release();
        return false;
      }
    })());
  }
  const mountainLayer = doc.createElement('canvas');
  let mountainKey = '';
  let disposed = false;
  function stamp(
    g: SceneDrawing,
    image: PackedSceneryAtlas,
    cell: number,
    x: number,
    base: number,
    width: number,
    alpha = 1,
    distant = false,
  ) {
    if (!image.complete || !image.naturalWidth) return;
    const terrainFrames = [
      [21, 231, 580, 285],
      [650, 240, 586, 285],
      [17, 716, 594, 353],
      [645, 782, 593, 298],
    ] as const;
    const landmarkBases = [550, 552, 528, 533];
    const frame =
      image === terrain
        ? terrainFrames[cell]!
        : [
            ((cell % 2) * image.naturalWidth) / 2,
            (Math.floor(cell / 2) * image.naturalHeight) / 2,
            image.naturalWidth / 2,
            image.naturalHeight / 2,
          ];
    const [sx, sy, sw, sh] = frame;
    const anchor = image === terrain ? (cell === 2 ? 0.94 : 0.93) : landmarkBases[cell]! / 627;
    g.save();
    g.translate(x, base);
    if (distant) g.transform(1, 0, 0.018, 0.98, 0, 0);
    drawAtlasSprite(g, image, cell, 0, 0, width, {
      frame: { x: sx!, y: sy!, width: sw, height: sh },
      anchorY: anchor,
      alpha: image === terrain ? 0.94 : alpha === 1 ? 0.88 : alpha,
      hazeColor: distant ? '#46354d' : '#382b3c',
    });
    g.restore();
  }
  return {
    prepare,
    draw(
      g: SceneDrawing,
      width: number,
      height: number,
      time = 0,
      reducedMotion = false,
      seed = 131304,
    ): boolean {
      if (disposed) return false;
      if (!ready) {
        void prepare();
        return false;
      }
      const variation = (i: number) => {
        const n = Math.sin(seed * 0.731 + i * 12.9898) * 43758.5453;
        return n - Math.floor(n);
      };
      const sky = g.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#110d1a');
      sky.addColorStop(0.48, '#35213c');
      sky.addColorStop(1, '#0e0c10');
      g.fillStyle = sky;
      g.fillRect(0, 0, width, height);
      const moonX = width * (0.42 + variation(0) * 0.35),
        moonY = height * 0.19,
        radius = Math.min(width, height) * 0.075;
      const halo = g.createRadialGradient(moonX, moonY, radius * 0.3, moonX, moonY, radius * 3);
      halo.addColorStop(0, 'rgba(189,155,180,.19)');
      halo.addColorStop(1, 'rgba(100,70,110,0)');
      g.fillStyle = halo;
      g.fillRect(0, 0, width, height * 0.6);
      g.fillStyle = '#958592';
      g.beginPath();
      g.arc(moonX, moonY, radius, 0, Math.PI * 2);
      g.fill();
      if (mountains.complete && mountains.naturalWidth) {
        const key = `${width}:${height}:${seed}`;
        if (mountainKey !== key) {
          clearCachedMaterial(mountainLayer);
          mountainLayer.width = Math.ceil(width);
          mountainLayer.height = Math.ceil(height);
          const nativeContext = mountainLayer.getContext('2d');
          if (nativeContext) {
            const far = cachedMaterialContext(nativeContext);
            const span = Math.max(width * 0.62, height * 0.8);
            const count = Math.ceil(width / (span * 0.7)) + 2;
            for (let i = 0; i < count; i++)
              drawAtlasSprite(
                far,
                mountains,
                (i + Math.floor(variation(6) * 4)) % 4,
                (i - 0.5) * span * 0.7,
                height * (0.59 + variation(i + 20) * 0.025),
                span,
                { flip: i % 2 === 0, fadeFrom: 0.65, alpha: 0.45, hazeColor: '#584052' },
              );
            mountainKey = key;
            invalidateSceneTexture(mountainLayer);
          }
        }
        g.save();
        drawCachedImage(
          g,
          mountainLayer,
          [0, 0, mountainLayer.width, mountainLayer.height],
          0,
          0,
          width,
          height,
        );
        g.restore();
      }
      stamp(
        g,
        landmarks,
        0,
        width * (0.32 + variation(1) * 0.26),
        height * 0.65,
        Math.min(Math.max(width * 1.15, height * 0.67), height * 0.78),
        0.3,
        true,
      );
      stamp(
        g,
        landmarks,
        2,
        width * (0.76 + variation(2) * 0.18),
        height * 0.65,
        Math.min(Math.max(width * 0.5, height * 0.37), height * 0.62),
        0.8,
      );
      stamp(
        g,
        landmarks,
        1,
        width * (0.04 + variation(3) * 0.18),
        height * 0.75,
        Math.min(Math.max(width * 0.36, height * 0.33), height * 0.55),
      );
      stamp(
        g,
        terrain,
        0,
        width * (0.38 + variation(4) * 0.24),
        height * 1.06,
        Math.min(width * 0.9, height * 0.65),
      );
      const bankWidth = Math.min(width * 0.6, height * 0.75);
      stamp(g, terrain, 1, width * 0.04, height * 0.98, bankWidth);
      stamp(g, terrain, 1, width * 0.96, height * 0.98, bankWidth);
      stamp(
        g,
        terrain,
        2,
        width * 0.03,
        height * 0.87,
        Math.min(Math.max(width * 0.33, 130), height * 0.45),
      );
      stamp(
        g,
        terrain,
        3,
        width * 0.92,
        height * 1.02,
        Math.min(Math.max(width * 0.35, 150), height * 0.45),
      );
      stamp(
        g,
        landmarks,
        3,
        width * 1.02,
        height * 0.93,
        Math.min(Math.max(width * 0.4, height * 0.38), height * 0.6),
      );
      const t = reducedMotion ? 0 : time;
      for (let i = 0; i < 5; i++) {
        const y = height * (0.43 + i * 0.074);
        const shift = Math.sin(t * 0.12 + i) * width * 0.05;
        const mist = g.createRadialGradient(
          width * 0.5 + shift,
          y,
          0,
          width * 0.5 + shift,
          y,
          width * 0.6,
        );
        mist.addColorStop(0, 'rgba(146,96,153,.045)');
        mist.addColorStop(1, 'rgba(146,96,153,0)');
        g.fillStyle = mist;
        g.fillRect(0, y - height * 0.06, width, height * 0.12);
      }
      for (let i = 0; i < 18; i++) {
        const rise = (t * 0.04 + i / 18) % 1;
        g.fillStyle = `rgba(210,78,66,${(1 - rise) * 0.28})`;
        g.fillRect((((i * 137) % 997) / 997) * width, height * (0.94 - rise * 0.65), 1.5, 2);
      }
      return (
        landmarks.complete &&
        landmarks.naturalWidth > 0 &&
        terrain.complete &&
        terrain.naturalWidth > 0 &&
        mountains.complete &&
        mountains.naturalWidth > 0
      );
    },
    dispose() {
      lease?.release();
      cachedMaterials.dispose();
      disposed = true;
      mountainLayer.width = mountainLayer.height = 0;
    },
  };
}
