import type { SceneDrawing } from '../scene-drawing.ts';
import { createAssetMaterials } from '../asset-materials.ts';
import { drawMaterialStamp } from '../scene-material.ts';
import { materialTextureUploads, type TextureUpload } from '../texture-upload.ts';
import { createPreparedFigureAtlas } from './prepared-atlas.ts';
import { assetMaterialCatalog } from '../asset-material-catalog.ts';
import { documentImageBudget, createMainImageOwner } from '../../platform/main-images.ts';
export const INK_COMPANION_SOURCES = {
  parts: new URL('./assets/companion-parts-atlas.webp', import.meta.url).href,
  rock: new URL('./assets/mystic-rock.webp', import.meta.url).href,
} as const;

/** Verified packed windows, with source-pixel joints and native aspect ratios. */
export const INK_COMPANION_FRAMES = [
  [0, 0, 313, 440],
  [313, 0, 314, 440],
  [627, 0, 313, 440],
  [940, 0, 314, 440],
  [0, 440, 313, 300],
  [313, 440, 314, 300],
  [627, 440, 313, 300],
  [940, 440, 314, 300],
  [0, 740, 313, 250],
  [313, 740, 314, 250],
  [627, 740, 313, 250],
  [940, 740, 314, 250],
  [0, 990, 313, 264],
  [313, 990, 314, 264],
  [627, 990, 313, 264],
  [940, 990, 314, 264],
] as const;

/** Owns its source owner; each joint animates without moving the ground anchor. */
export function createInkCompanionRenderer(doc: Document, images = createMainImageOwner(doc)) {
  type Key = 'parts' | 'rock';
  type Frame = readonly [number, number, number, number];
  const compact = documentImageBudget(doc) <= 256 * 1024 * 1024;
  type Kit = {
    image?: HTMLImageElement;
    ready: boolean;
    pending: Promise<boolean>;
    materials?: ReturnType<typeof createAssetMaterials<'atlas'>>;
    lease?: ReturnType<typeof images.acquire>;
    parts?: ReturnType<typeof createPreparedFigureAtlas>;
  };
  const kits = new Map<Key, Kit>();
  const borrowers = new Map<symbol, number>();
  let primary = 0,
    managed = false,
    disposed = false;
  const preparation = new AbortController();
  const mask = (type: string) =>
    type === 'mystic-rock' ? 2 : type === 'crow' || type === 'shiba' || type === 'cat' ? 1 : 0;
  const keys = (selection: number): Key[] => [
    ...(selection & 1 ? ['parts' as const] : []),
    ...(selection & 2 ? ['rock' as const] : []),
  ];
  const dimensions = (key: Key) =>
    key === 'parts' ? ([1254, 1254] as const) : ([1145, 1373] as const);
  function sync() {
    if (disposed) return;
    let selection = primary;
    for (const borrowed of borrowers.values()) selection |= borrowed;
    const required = keys(selection);
    for (const [key, kit] of kits)
      if (!required.includes(key)) {
        kit.parts?.dispose();
        kit.materials?.dispose();
        kit.lease?.release();
        kits.delete(key);
      }
    for (const key of required) {
      if (kits.has(key)) continue;
      const url = INK_COMPANION_SOURCES[key];
      if (compact) {
        const pack = assetMaterialCatalog.find((pack) => pack.source === url)!;
        const [width, height] = dimensions(key);
        const frames: readonly Frame[] =
          key === 'parts' ? INK_COMPANION_FRAMES : [[0, 0, width, height]];
        const parts = createPreparedFigureAtlas(
          doc,
          { ...pack.maps, diffuse: url },
          width,
          height,
          frames,
          true,
          { images, maxSize: key === 'parts' ? 256 : 512 },
        );
        const kit: Kit = { parts, ready: false, pending: Promise.resolve(false) };
        kits.set(key, kit);
        kit.pending = parts.prepare().then((ready) => {
          if (disposed || kits.get(key) !== kit) return false;
          return (kit.ready = ready);
        });
        continue;
      }
      const materials = createAssetMaterials(doc, { atlas: url }, images);
      const lease = images.acquire(url);
      const kit: Kit = { materials, lease, ready: false, pending: Promise.resolve(false) };
      kits.set(key, kit);
      kit.pending = Promise.all([lease.ready, materials.prepare()]).then(
        ([image]) => {
          if (disposed || kits.get(key) !== kit) return false;
          kit.image = image;
          const [width, height] = dimensions(key);
          kit.ready =
            image.naturalWidth === width &&
            image.naturalHeight === height &&
            materials.ready('atlas');
          return kit.ready;
        },
        () => false,
      );
    }
  }
  function ready(selection: number) {
    return !disposed && keys(selection).every((key) => kits.get(key)?.ready === true);
  }
  async function prepared(selection: number) {
    const selected = keys(selection);
    const requested = selected.map((key) => kits.get(key));
    const loaded = await Promise.all(requested.map((kit) => kit?.pending ?? false));
    return (
      !disposed &&
      loaded.every(Boolean) &&
      requested.every((kit, index) => kit === kits.get(selected[index]!))
    );
  }
  function colour(kit: Kit, frame: Frame) {
    return kit.parts
      ? kit.parts.colour(frame)
      : kit.image
        ? { source: kit.image, frame }
        : undefined;
  }
  function material(kit: Kit, frame: Frame) {
    return kit.parts ? kit.parts.material(frame) : kit.materials?.material('atlas', frame);
  }
  function sources(selection: number) {
    const result: TextureUpload['texture']['source'][] = [];
    for (const key of keys(selection)) {
      const kit = kits.get(key);
      if (!kit?.ready) continue;
      if (kit.parts) {
        result.push(...kit.parts.textureSources());
        continue;
      }
      if (!kit.image) continue;
      result.push(kit.image);
      const [width, height] = dimensions(key);
      const maps = material(kit, [0, 0, width, height]);
      for (const texture of [maps?.normal, maps?.surface, maps?.emissive])
        if (texture) result.push(texture.source as HTMLImageElement);
    }
    return result;
  }
  /** Runtime selection owns only the equipped kit; repeated draws do not change pins. */
  function select(type: string) {
    if (disposed) return;
    managed = true;
    const next = mask(type);
    if (primary === next) return;
    primary = next;
    sync();
  }
  /** Explicit standalone preparation retains the whole catalogue until selected/disposed. */
  function prepare(): Promise<boolean> {
    if (disposed) return Promise.resolve(false);
    if (!managed) {
      primary = 3;
      sync();
    }
    let selection = primary;
    for (const borrowed of borrowers.values()) selection |= borrowed;
    return prepared(selection);
  }
  /** Selected artwork uses the same sources and material interpretation as draw(). */
  async function prepareUploads(
    type: string,
    signal: AbortSignal,
  ): Promise<TextureUpload[] | undefined> {
    const lifetime = AbortSignal.any([signal, preparation.signal]);
    if (lifetime.aborted) return;
    select(type);
    const selection = primary;
    if (!(await prepared(selection)) || lifetime.aborted || primary !== selection) return;
    const uploads: TextureUpload[] = [];
    for (const key of keys(selection)) {
      const kit = kits.get(key);
      if (!kit?.ready) return;
      const [width, height] = dimensions(key);
      const frames: readonly Frame[] =
        kit.parts && key === 'parts' ? INK_COMPANION_FRAMES : [[0, 0, width, height]];
      for (const frame of frames) {
        const image = colour(kit, frame);
        if (!image) return;
        uploads.push(
          ...materialTextureUploads(
            { source: image.source, revision: 0, frame: image.frame },
            material(kit, frame),
          ),
        );
      }
    }
    return uploads;
  }
  function borrow() {
    managed = true;
    const id = Symbol('companion preview');
    let selection = 0,
      released = false;
    borrowers.set(id, selection);
    return {
      select(type: string, other = '') {
        if (released || disposed) return false;
        const next = mask(type) | mask(other);
        if (selection === next) return false;
        selection = next;
        borrowers.set(id, selection);
        sync();
        return true;
      },
      async prepare() {
        if (released) return false;
        const expected = selection;
        return (await prepared(expected)) && !released && expected === selection;
      },
      sources: () => sources(selection),
      get ready() {
        return !released && ready(selection);
      },
      dispose() {
        if (released) return;
        released = true;
        borrowers.delete(id);
        sync();
      },
    };
  }

  function draw(
    type: string,
    g: SceneDrawing,
    x: number,
    y: number,
    size: number,
    time = 0,
    active = false,
    reducedMotion = false,
  ): boolean {
    if (
      disposed ||
      !['crow', 'shiba', 'cat', 'mystic-rock'].includes(type) ||
      size <= 0 ||
      ![x, y, size, time].every(Number.isFinite)
    )
      return false;
    if (!managed) void prepare();
    const parts = kits.get('parts'),
      rockKit = kits.get('rock');
    const rockFrame: Frame = [0, 0, 1145, 1373];
    const rock = rockKit && colour(rockKit, rockFrame);
    if (type === 'mystic-rock') {
      if (!rockKit?.ready || !rock) return false;
      const factor = size / 1157;
      const bob = reducedMotion ? 0 : Math.sin(time * 1.4) * size * 0.035;
      g.save();
      try {
        const maps = material(rockKit, rockFrame);
        if (maps)
          drawMaterialStamp(g, {
            texture: { source: rock.source, revision: 0, frame: rock.frame },
            material: maps,
            x: x - 580 * factor,
            y: y - 1350 * factor + bob,
            width: 1145 * factor,
            height: 1373 * factor,
          });
        else
          g.drawImage(
            rock.source,
            ...rock.frame,
            x - 580 * factor,
            y - 1350 * factor + bob,
            1145 * factor,
            1373 * factor,
          );
      } finally {
        g.restore();
      }
      return true;
    }
    if (!parts?.ready) return false;
    const t = reducedMotion ? 0 : time;
    const reaction = active && !reducedMotion;
    const sine = (speed: number, phase = 0) => (reducedMotion ? 0 : Math.sin(t * speed + phase));
    const factor =
      size / (type === 'shiba' ? 225 : type === 'cat' ? 235 : type === 'crow' ? 155 : 205);
    function part(
      index: number,
      pivotX: number,
      pivotY: number,
      ax: number,
      ay: number,
      scale = 1,
      angle = 0,
      stretch = 1,
    ) {
      const frame = INK_COMPANION_FRAMES[index]!;
      const [, , sw, sh] = frame;
      const image = colour(parts!, frame);
      if (!image) return;
      g.save();
      try {
        g.translate(ax, ay);
        g.rotate(angle);
        g.scale(scale, scale * stretch);
        const maps = material(parts!, frame);
        if (maps)
          drawMaterialStamp(g, {
            texture: { source: image.source, revision: 0, frame: image.frame },
            material: maps,
            x: -pivotX,
            y: -pivotY,
            width: sw,
            height: sh,
          });
        else g.drawImage(image.source, ...image.frame, -pivotX, -pivotY, sw, sh);
      } finally {
        g.restore();
      }
    }
    g.save();
    try {
      g.translate(x, y);
      g.scale(factor, factor);
      if (type === 'shiba') {
        const breath = 1 + sine(2.3) * 0.012;
        part(2, 213, 352, -83, -62, 1, sine(reaction ? 8 : 2.2) * (reaction ? 0.24 : 0.07));
        part(0, 216, 361, 0, 0, 1, 0, breath);
        part(3, 138, 238, 15, -130, 1, reaction ? sine(5) * 0.12 : 0);
        part(1, 166, 356, 18, -95 * breath, 0.85, sine(1.6) * 0.035 - (reaction ? 0.08 : 0));
      } else if (type === 'cat') {
        const breath = 1 + sine(2.1, 0.7) * 0.01;
        part(6, 225, 219, -79, -61, 0.9, sine(reaction ? 4 : 1.7) * (reaction ? 0.24 : 0.12));
        part(4, 209, 230, 0, 0, 1, 0, breath);
        part(7, 154, 102, 31, -120, 1, reaction ? sine(4.2) * 0.07 : 0);
        part(5, 182, 225, 34, -111 * breath, 0.8, sine(1.3) * 0.04 - (reaction ? 0.09 : 0));
      } else if (type === 'crow') {
        const flap = sine(reaction ? 10 : 2.4) * (reaction ? 0.22 : 0.025);
        part(11, 88, 87, 5, -95, 0.5, reaction ? -0.8 - flap : 0.4 + flap);
        part(8, 222, 205, 0, 0);
        part(10, 225, 85, 3, -93, 0.65, reaction ? 0.8 + flap : -0.2 - flap);
        part(9, 182, 185, 23, -90, 0.65, sine(1.8) * 0.04);
      }
      return true;
    } finally {
      g.restore();
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    preparation.abort();
    for (const kit of kits.values()) {
      kit.parts?.dispose();
      kit.materials?.dispose();
      kit.lease?.release();
    }
    kits.clear();
    borrowers.clear();
    primary = 0;
    images.dispose();
  }
  return {
    prepare,
    prepareUploads,
    select,
    borrow,
    draw,
    dispose,
    snapshot: () => ({
      selected: [...kits.keys()],
      compact,
      partPixels: [...kits.values()]
        .flatMap((kit) => kit.parts?.textureSources() ?? [])
        .reduce(
          (sum, source) =>
            sum + ('width' in source ? Number(source.width) * Number(source.height) : 0),
          0,
        ),
      equipped: keys(primary),
      borrowed: [...borrowers.values()].filter(Boolean).length,
      ready:
        !disposed && (managed || primary !== 0) && [...kits.values()].every((kit) => kit.ready),
      decodedLoader: images.snapshot(),
    }),
    get ready() {
      return (
        !disposed && (managed || primary !== 0) && [...kits.values()].every((kit) => kit.ready)
      );
    },
  };
}
