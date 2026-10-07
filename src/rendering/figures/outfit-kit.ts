import type { SceneDrawing } from '../scene-drawing.ts';
import type { Figure } from './types.ts';
import { createAssetMaterials } from '../asset-materials.ts';
import { drawMaterialStamp } from '../scene-material.ts';

type AtlasKey = 'armour' | 'headwear' | 'cloth' | 'masks' | 'special';
type Frame = readonly [number, number, number, number];
type Attachment = {
  atlas: AtlasKey;
  frame: number;
  x: number;
  y: number;
  width: number;
  tint?: string;
  anchorX?: number;
  anchorY?: number;
};
type Recipe = {
  required: AtlasKey[];
  body: Attachment[];
  head: Attachment[];
  replaceHead?: boolean;
  tone?: string;
  shoulders?: boolean;
  bracers?: boolean;
};
const piece = (
  atlas: AtlasKey,
  frame: number,
  x: number,
  y: number,
  width: number,
  tint?: string,
): Attachment => ({ atlas, frame, x, y, width, tint });
const anchored = (
  atlas: AtlasKey,
  frame: number,
  width: number,
  ax: number,
  ay: number,
  x = 0,
  y = -0.815,
): Attachment => ({ ...piece(atlas, frame, x, y, width), anchorX: ax, anchorY: ay });
/** Explicit supported recipes keep equipment effects separate from presentation. */
export const INK_OUTFIT_RECIPES: Record<string, Recipe> = {
  sumi: { required: [], body: [], head: [] },
  hai: { required: [], body: [], head: [], tone: 'hai' },
  aka: { required: [], body: [], head: [] },
  shiro: { required: [], body: [], head: [], tone: 'shiro' },
  kasa: { required: ['headwear'], body: [], head: [piece('headwear', 1, 0, -1, 0.31)] },
  monk: {
    required: ['headwear'],
    body: [piece('headwear', 3, 0, -0.845, 0.2, '#bdb6a6')],
    head: [piece('headwear', 2, 0, -0.98, 0.16, '#aaa393')],
    replaceHead: true,
  },
  oni: {
    required: ['masks'],
    body: [],
    head: [anchored('masks', 0, 0.16, 215 / 436, 500 / 535)],
    replaceHead: true,
  },
  tengu: {
    required: ['masks'],
    body: [],
    head: [anchored('masks', 1, 0.19, 209 / 525, 461 / 497)],
    replaceHead: true,
  },
  kitsune: {
    required: ['masks'],
    body: [],
    head: [anchored('masks', 2, 0.16, 222 / 458, 516 / 555)],
    replaceHead: true,
  },
  noh: {
    required: ['masks'],
    body: [],
    head: [anchored('masks', 3, 0.135, 198 / 381, 461 / 497)],
    replaceHead: true,
  },
  komuso: {
    required: ['special'],
    body: [],
    head: [anchored('special', 0, 0.15, 179 / 357, 460 / 501)],
    replaceHead: true,
  },
  kabuki: {
    required: ['special'],
    body: [],
    head: [anchored('special', 1, 0.22, 240 / 494, 455 / 507)],
    replaceHead: true,
  },
  tanuki: {
    required: ['special'],
    body: [anchored('special', 3, 0.3, 30 / 526, 77 / 369, 0.1, -0.35)],
    head: [anchored('special', 2, 0.19, 229 / 458, 356 / 411)],
    replaceHead: true,
    tone: 'tanuki',
  },
  rags: { required: [], body: [], head: [], tone: 'rags' },
  scarecrow: {
    required: ['cloth', 'headwear'],
    body: [piece('cloth', 2, 0, -0.82, 0.43, '#998152')],
    head: [piece('headwear', 1, 0, -1, 0.31, '#998152')],
    tone: 'scarecrow',
  },
  yoroi: {
    required: ['armour', 'headwear'],
    body: [
      piece('armour', 0, 0, -0.815, 0.32, '#693e38'),
      piece('armour', 3, 0, -0.51, 0.32, '#693e38'),
    ],
    head: [piece('headwear', 0, 0, -1.01, 0.22)],
    shoulders: true,
  },
  helm: {
    required: ['armour', 'headwear'],
    body: [piece('armour', 0, 0, -0.815, 0.28)],
    head: [piece('headwear', 0, 0, -1.01, 0.22)],
    shoulders: true,
  },
  shinobi: {
    replaceHead: true,
    required: ['headwear', 'cloth'],
    body: [piece('headwear', 3, 0, -0.845, 0.2)],
    head: [piece('headwear', 2, 0, -0.97, 0.16)],
    bracers: true,
  },
  jinbaori: {
    required: ['cloth'],
    body: [piece('cloth', 0, -0.09, -0.81, 0.22), piece('cloth', 1, 0.09, -0.81, 0.22)],
    head: [],
  },
  mino: {
    required: ['cloth', 'headwear'],
    body: [piece('cloth', 2, 0, -0.82, 0.46)],
    head: [piece('headwear', 1, 0, -1.0, 0.31)],
  },
};
export function supportsInkOutfit(id?: string): boolean {
  return !!id && Object.hasOwn(INK_OUTFIT_RECIPES, id);
}

const SOURCES = {
  masks: new URL('./assets/player-mask-atlas.png', import.meta.url).href,
  special: new URL('./assets/player-special-headwear-atlas.png', import.meta.url).href,
  armour: new URL('./assets/armour-plates-atlas.png', import.meta.url).href,
  headwear: new URL('./assets/outfit-headwear-atlas.png', import.meta.url).href,
  cloth: new URL('./assets/outfit-cloth-atlas.png', import.meta.url).href,
};
// Updated from each atlas's measured alpha bounds, not nominal grid cell bounds.
const FRAMES: Record<AtlasKey, readonly Frame[]> = {
  masks: [
    [150, 40, 436, 535],
    [692, 79, 525, 497],
    [144, 589, 458, 555],
    [733, 654, 381, 497],
  ],
  special: [
    [147, 92, 357, 501],
    [703, 85, 494, 507],
    [101, 702, 458, 411],
    [690, 783, 526, 369],
  ],
  armour: [
    [77, 72, 588, 538],
    [847, 114, 349, 476],
    [62, 693, 380, 484],
    [620, 729, 584, 412],
  ],
  headwear: [
    [85, 126, 488, 450],
    [630, 204, 605, 322],
    [141, 653, 399, 522],
    [747, 872, 399, 220],
  ],
  cloth: [
    [146, 53, 408, 551],
    [718, 53, 394, 552],
    [64, 663, 746, 532],
    [927, 692, 208, 481],
  ],
};
export function createOutfitKit(doc: Document) {
  const materials = createAssetMaterials(doc, SOURCES);
  const images = new Map<AtlasKey, HTMLImageElement>();
  const loaded = new Set<AtlasKey>();
  const tinted = new Map<string, HTMLCanvasElement>();
  const finish = new Set<() => void>();
  let disposed = false,
    pending: Promise<void> | undefined;
  function prepare() {
    if (pending) return pending;
    if (disposed) return Promise.resolve();
    pending = Promise.all(
      (Object.keys(SOURCES) as AtlasKey[]).map(
        (key) =>
          new Promise<void>((resolve) => {
            const image = doc.createElement('img');
            images.set(key, image);
            const done = () => {
              finish.delete(done);
              image.onload = null;
              image.onerror = null;
              resolve();
            };
            finish.add(done);
            image.onload = () => {
              if (!disposed && image.naturalWidth === 1254 && image.naturalHeight === 1254)
                loaded.add(key);
              done();
            };
            image.onerror = done;
            image.src = SOURCES[key];
          }),
      ),
    ).then(async () => {
      await materials.prepare();
    });
    return pending;
  }
  function ready(id?: string) {
    return (
      !disposed &&
      supportsInkOutfit(id) &&
      INK_OUTFIT_RECIPES[id!]!.required.every((key) => loaded.has(key) && materials.ready(key))
    );
  }
  function stamp(g: SceneDrawing, a: Attachment, lean: number) {
    const image = images.get(a.atlas),
      frame = FRAMES[a.atlas][a.frame];
    if (!image || !frame) return;
    const [sx, sy, sw, sh] = frame;
    let source: CanvasImageSource = image;
    if (a.tint) {
      const key = a.atlas + ':' + a.frame + ':' + a.tint;
      let c = tinted.get(key);
      if (!c) {
        c = doc.createElement('canvas');
        c.width = sw;
        c.height = sh;
        const cg = c.getContext('2d');
        if (!cg) return;
        cg.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
        cg.globalCompositeOperation = 'source-atop';
        cg.globalAlpha = 0.38;
        cg.fillStyle = a.tint;
        cg.fillRect(0, 0, sw, sh);
        tinted.set(key, c);
      }
      source = c;
    }
    const h = (a.width * sh) / sw;
    const x = a.x + lean - a.width * (a.anchorX ?? 0.5),
      y = a.y - h * (a.anchorY ?? 0);
    const material = materials.material(a.atlas, frame);
    if (material)
      drawMaterialStamp(g, {
        texture: { source, revision: 0, frame: a.tint ? undefined : frame },
        material,
        x,
        y,
        width: a.width,
        height: h,
      });
    else if (a.tint) g.drawImage(source, x, y, a.width, h);
    else g.drawImage(source, sx, sy, sw, sh, x, y, a.width, h);
  }
  return {
    prepare,
    ready,
    recipe: (id?: string) => (id ? INK_OUTFIT_RECIPES[id] : undefined),
    draw(g: SceneDrawing, stage: 'body' | 'head', f: Figure) {
      const recipe = INK_OUTFIT_RECIPES[f.robeId!];
      if (!recipe) return;
      for (const a of recipe[stage]) {
        g.save();
        if (stage === 'body' && a.atlas === 'cloth') {
          g.translate(a.x, a.y);
          g.rotate((f.secondary?.cloth ?? 0) * (a.x < 0 ? 0.7 : 1));
          g.translate(-a.x, -a.y);
        }
        stamp(g, a, (f.lean || 0) * (stage === 'head' ? 1.05 : 0.8));
        g.restore();
      }
      if (stage === 'body') {
        const l = f.lean || 0;
        if (f.robeId === 'aka') {
          g.fillStyle = '#86352c';
          g.beginPath();
          g.moveTo(-0.115 + l * 0.5, -0.54);
          g.lineTo(0.115 + l * 0.5, -0.535);
          g.lineTo(0.11 + l * 0.5, -0.502);
          g.lineTo(-0.11 + l * 0.5, -0.505);
          g.closePath();
          g.fill();
        }
        if (f.robeId === 'rags') {
          g.fillStyle = '#625b4c';
          for (const [x, y, w, h] of [
            [-0.09, -0.71, 0.055, 0.06],
            [0.045, -0.35, 0.07, 0.09],
            [-0.18, -0.14, 0.055, 0.06],
          ]) {
            g.save();
            g.translate(x! + l * 0.5, y!);
            g.rotate(0.12);
            g.fillRect(0, 0, w!, h!);
            g.strokeStyle = '#aaa08a';
            g.lineWidth = 0.003;
            g.strokeRect(0.005, 0.005, w! - 0.01, h! - 0.01);
            g.restore();
          }
        }
        if (f.robeId === 'scarecrow') {
          g.strokeStyle = '#9b895b';
          g.lineWidth = 0.007;
          for (let i = 0; i < 7; i++) {
            const x = (i - 3) * 0.048;
            g.beginPath();
            g.moveTo(x, -0.075);
            g.lineTo(x + (i - 3) * 0.006, 0.012 + (i % 2) * 0.02);
            g.stroke();
          }
        }
      }
    },
    drawArm(
      g: SceneDrawing,
      f: Figure,
      index: number,
      shoulder: [number, number],
      elbow: [number, number],
      hand: [number, number],
    ) {
      const recipe = INK_OUTFIT_RECIPES[f.robeId!];
      if (!recipe) return;
      if (recipe.shoulders)
        stamp(
          g,
          piece(
            'armour',
            index ? 1 : 2,
            shoulder[0],
            shoulder[1] - 0.035,
            0.145,
            f.robeId === 'yoroi' ? '#693e38' : undefined,
          ),
          0,
        );
      if (recipe.bracers) {
        g.save();
        g.translate(elbow[0], elbow[1]);
        g.rotate(Math.atan2(hand[1] - elbow[1], hand[0] - elbow[0]) - Math.PI / 2);
        stamp(g, piece('cloth', 3, 0, 0, 0.062), 0);
        g.restore();
      }
    },
    snapshot: () => ({
      loaded: [...loaded],
      tints: tinted.size,
      outfits: Object.keys(INK_OUTFIT_RECIPES).filter(ready),
    }),
    dispose() {
      materials.dispose();
      disposed = true;
      for (const im of images.values()) {
        im.onload = null;
        im.onerror = null;
        im.removeAttribute('src');
      }
      for (const fn of [...finish]) fn();
      for (const c of tinted.values()) {
        c.width = 0;
        c.height = 0;
      }
      images.clear();
      loaded.clear();
      tinted.clear();
    },
  };
}
