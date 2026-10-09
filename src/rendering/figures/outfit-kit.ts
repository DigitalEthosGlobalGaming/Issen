import type { SceneDrawing } from '../scene-drawing.ts';
import type { Figure } from './types.ts';
import { createAssetMaterials } from '../asset-materials.ts';
import { drawMaterialStamp } from '../scene-material.ts';
import { retireSceneTexture } from '../texture-revision.ts';
import { createMainImageOwner } from '../../platform/main-images.ts';
import type { PixiScenePainter } from '../pixi/scene-painter.ts';

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

export const INK_OUTFIT_SOURCES = {
  masks: new URL('./assets/player-mask-atlas.webp', import.meta.url).href,
  special: new URL('./assets/player-special-headwear-atlas.webp', import.meta.url).href,
  armour: new URL('./assets/armour-plates-atlas.webp', import.meta.url).href,
  headwear: new URL('./assets/outfit-headwear-atlas.webp', import.meta.url).href,
  cloth: new URL('./assets/outfit-cloth-atlas.webp', import.meta.url).href,
};
const SOURCES = INK_OUTFIT_SOURCES;
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
  const owner = createMainImageOwner(doc);
  type Kit = {
    lease: ReturnType<typeof owner.acquire>;
    materials: ReturnType<typeof createAssetMaterials<'atlas'>>;
    pending: Promise<boolean>;
  };
  const kits = new Map<AtlasKey, Kit>();
  const images = new Map<AtlasKey, HTMLImageElement>();
  const loaded = new Set<AtlasKey>();
  const tinted = new Map<string, HTMLCanvasElement>();
  const consumers = new Set<SceneDrawing>();
  const borrowers = new Map<symbol, readonly AtlasKey[]>();
  let disposed = false,
    managed = false;
  let pending: Promise<boolean> | undefined;
  let primary: readonly AtlasKey[] = [];
  const required = (id?: string): readonly AtlasKey[] =>
    INK_OUTFIT_RECIPES[id ?? '']?.required ?? [];
  function sources(key: AtlasKey, kit: Kit) {
    const material = kit.materials.material('atlas', [0, 0, 1254, 1254]);
    return [
      images.get(key),
      material?.normal?.source,
      material?.surface?.source,
      material?.emissive?.source,
    ].filter((source) => !!source);
  }
  function releaseCanvas(g: SceneDrawing) {
    if ('releaseTextureSources' in g)
      (g as SceneDrawing & Pick<PixiScenePainter, 'releaseTextureSources'>).releaseTextureSources(
        [...kits].flatMap(([key, kit]) => sources(key, kit)),
      );
    consumers.delete(g);
  }
  function release(key: AtlasKey, kit: Kit, preserveFrame = true) {
    for (const g of consumers)
      if ('releaseTextureSources' in g)
        (g as SceneDrawing & Pick<PixiScenePainter, 'releaseTextureSources'>).releaseTextureSources(
          sources(key, kit),
          preserveFrame,
        );
    for (const [id, canvas] of tinted)
      if (id.startsWith(key + ':')) {
        retireSceneTexture(canvas, preserveFrame);
        canvas.width = canvas.height = 0;
        tinted.delete(id);
      }
    kit.materials.dispose();
    kit.lease.release();
    kits.delete(key);
    images.delete(key);
    loaded.delete(key);
  }
  function sync() {
    if (disposed) return;
    pending = undefined;
    const selection = new Set(primary);
    for (const keys of borrowers.values()) for (const key of keys) selection.add(key);
    for (const [key, kit] of kits) if (!selection.has(key)) release(key, kit);
    for (const key of selection) {
      if (kits.has(key)) continue;
      const lease = owner.acquire(SOURCES[key]);
      const materials = createAssetMaterials(doc, { atlas: SOURCES[key] }, owner);
      const kit: Kit = { lease, materials, pending: Promise.resolve(false) };
      kits.set(key, kit);
      kit.pending = Promise.all([lease.ready, materials.prepare()]).then(
        ([image, maps]) => {
          if (disposed || kits.get(key) !== kit) return false;
          if (image.naturalWidth !== 1254 || image.naturalHeight !== 1254 || !maps.every(Boolean))
            return false;
          images.set(key, image);
          loaded.add(key);
          return true;
        },
        () => false,
      );
    }
  }
  async function prepared(keys: readonly AtlasKey[]) {
    const expected = keys.map((key) => kits.get(key));
    const ready = await Promise.all(expected.map((kit) => kit?.pending ?? false));
    return (
      !disposed && ready.every(Boolean) && expected.every((kit, i) => kit === kits.get(keys[i]!))
    );
  }
  function prepare() {
    if (disposed) return Promise.resolve(false);
    // Standalone catalogue consumers can prepare everything; runtime and previews select first.
    if (!managed && !pending) {
      primary = Object.keys(SOURCES) as AtlasKey[];
      sync();
    }
    return (pending ??= prepared([...kits.keys()]));
  }
  function select(id?: string) {
    if (disposed) return false;
    managed = true;
    const next = required(id);
    if (next.length === primary.length && next.every((key) => primary.includes(key))) return false;
    primary = next;
    sync();
    return true;
  }
  function borrow() {
    managed = true;
    const id = Symbol('outfit preview');
    let selection: readonly AtlasKey[] = [],
      released = false;
    borrowers.set(id, selection);
    return {
      select(robe?: string) {
        if (released || disposed) return false;
        const next = required(robe);
        if (next.length === selection.length && next.every((key) => selection.includes(key)))
          return false;
        selection = next;
        borrowers.set(id, selection);
        sync();
        return true;
      },
      async prepare() {
        const expected = selection;
        return !released && (await prepared(expected)) && !released && expected === selection;
      },
      dispose() {
        if (released) return;
        released = true;
        borrowers.delete(id);
        sync();
      },
    };
  }
  function ready(id?: string) {
    return (
      !disposed &&
      supportsInkOutfit(id) &&
      INK_OUTFIT_RECIPES[id!]!.required.every((key) => loaded.has(key))
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
    const material = kits.get(a.atlas)?.materials.material('atlas', frame);
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
    select,
    borrow,
    releaseCanvas,
    ready,
    recipe: (id?: string) => (id ? INK_OUTFIT_RECIPES[id] : undefined),
    draw(g: SceneDrawing, stage: 'body' | 'head', f: Figure) {
      consumers.add(g);
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
      consumers.add(g);
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
      equipped: [...primary],
      borrowed: [...borrowers.values()].filter((keys) => keys.length > 0).length,
      decodedLoader: owner.snapshot(),
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const [key, kit] of kits) release(key, kit, false);
      owner.dispose();
      for (const c of tinted.values()) {
        retireSceneTexture(c);
        c.width = 0;
        c.height = 0;
      }
      images.clear();
      loaded.clear();
      tinted.clear();
      consumers.clear();
      borrowers.clear();
    },
  };
}
