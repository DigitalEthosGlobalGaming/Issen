import type { Figure } from './types.ts';

type AtlasKey = 'armour' | 'headwear' | 'cloth';
type Frame = readonly [number, number, number, number];
type Attachment = {
  atlas: AtlasKey;
  frame: number;
  x: number;
  y: number;
  width: number;
  tint?: string;
};
type Recipe = {
  required: AtlasKey[];
  body: Attachment[];
  head: Attachment[];
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
/** Explicit supported recipes keep equipment effects separate from presentation. */
export const INK_OUTFIT_RECIPES: Record<string, Recipe> = {
  sumi: { required: [], body: [], head: [] },
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
  armour: new URL('./assets/armour-plates-atlas.png', import.meta.url).href,
  headwear: new URL('./assets/outfit-headwear-atlas.png', import.meta.url).href,
  cloth: new URL('./assets/outfit-cloth-atlas.png', import.meta.url).href,
};
// Updated from each atlas's measured alpha bounds, not nominal grid cell bounds.
const FRAMES: Record<AtlasKey, readonly Frame[]> = {
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
    ).then(() => {});
    return pending;
  }
  function ready(id?: string) {
    return (
      !disposed &&
      supportsInkOutfit(id) &&
      INK_OUTFIT_RECIPES[id!]!.required.every((key) => loaded.has(key))
    );
  }
  function stamp(g: CanvasRenderingContext2D, a: Attachment, lean: number) {
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
    if (a.tint) g.drawImage(source, a.x + lean - a.width / 2, a.y, a.width, h);
    else g.drawImage(source, sx, sy, sw, sh, a.x + lean - a.width / 2, a.y, a.width, h);
  }
  return {
    prepare,
    ready,
    draw(g: CanvasRenderingContext2D, stage: 'body' | 'head', f: Figure) {
      const recipe = INK_OUTFIT_RECIPES[f.robeId!];
      if (!recipe) return;
      for (const a of recipe[stage]) stamp(g, a, (f.lean || 0) * (stage === 'head' ? 1.05 : 0.8));
    },
    drawArm(
      g: CanvasRenderingContext2D,
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
