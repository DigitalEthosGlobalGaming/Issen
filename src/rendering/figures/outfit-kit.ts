import type { SceneDrawing } from '../scene-drawing.ts';
import type { Figure } from './types.ts';
import { OUTFIT_FRAMES as FRAMES, OUTFIT_SOURCE_STEMS } from './outfit-catalog.ts';
import { packedSpritePlacement } from '../packed-assets.ts';
import type { FigureLease } from './packed-figures.ts';
import { drawMaterialStamp } from '../scene-material.ts';

type AtlasKey = 'armour' | 'headwear' | 'cloth' | 'masks' | 'special';
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

export function createOutfitKit(doc: Document) {
  let lease: FigureLease | undefined;
  const loaded = new Set<AtlasKey>();
  const tinted = new Map<string, HTMLCanvasElement>();

  let disposed = false,
    pending: Promise<void> | undefined;
  function prepare() {
    if (pending) return pending;
    if (disposed) return Promise.resolve();
    pending = (async () => {
      try {
        const { packedFigures } = await import('./packed-figures.ts');
        if (disposed) return;
        const acquired = packedFigures(doc).acquireGroup('outfits');
        lease = acquired;
        await acquired.ready;
        if (!disposed)
          for (const key of Object.keys(OUTFIT_SOURCE_STEMS) as AtlasKey[]) loaded.add(key);
      } catch {
        lease?.release();
        lease = undefined;
      }
    })();
    return pending;
  }
  function ready(id?: string) {
    return (
      !disposed &&
      supportsInkOutfit(id) &&
      INK_OUTFIT_RECIPES[id!]!.required.every((key) => loaded.has(key))
    );
  }
  function stamp(g: SceneDrawing, a: Attachment, lean: number) {
    const frame = FRAMES[a.atlas][a.frame];
    const packed = lease?.sprite(`outfit.${a.atlas}.${a.frame}`);
    if (!packed || !frame || packed.metadata.empty) return;
    const [sw, sh] = packed.metadata.logicalSize;
    const [sx, sy, pw, ph] = packed.metadata.frame;
    const [tx, ty] = packed.metadata.trim;
    let source = packed.colour as HTMLImageElement | ImageBitmap | HTMLCanvasElement;
    if (a.tint) {
      const key = a.atlas + ':' + a.frame + ':' + a.tint;
      let c = tinted.get(key);
      if (!c) {
        c = doc.createElement('canvas');
        c.width = sw;
        c.height = sh;
        const cg = c.getContext('2d');
        if (!cg) return;
        cg.drawImage(packed.colour, sx, sy, pw, ph, tx, ty, pw, ph);
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
    const material = packed.material;
    const placed = packedSpritePlacement(packed.metadata, x, y, a.width, h);
    const crop = a.tint ? ([tx, ty, pw, ph] as const) : packed.metadata.frame;
    if (material)
      drawMaterialStamp(g, {
        texture: { source, revision: 0, frame: crop },
        material,
        ...placed,
      });
    else g.drawImage(source, ...crop, placed.x, placed.y, placed.width, placed.height);
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
      disposed = true;
      lease?.release();
      lease = undefined;
      for (const c of tinted.values()) {
        c.width = 0;
        c.height = 0;
      }
      loaded.clear();
      tinted.clear();
    },
  };
}
