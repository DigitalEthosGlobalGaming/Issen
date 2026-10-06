import type { SceneDrawing } from '../scene-drawing.ts';
import { drawMaterialStamp } from '../scene-material.ts';
import { packedSpritePlacement } from '../packed-assets.ts';
import type { FigureLease } from './packed-figures.ts';
import type { Palette } from '../palette.ts';
import type { BladeStyle } from './types.ts';
import {
  BLADE_RECIPES,
  BLADE_PROFILE_FRAMES,
  HILT_FRAMES,
  GUARD_PARTS,
  SPECIAL_FRAMES,
  weaponSpriteId,
} from './blade-recipes.ts';
type Family = 'blades' | 'hilts' | 'special';
type Frame = readonly [number, number, number, number];
/** Instance-owned modular weapon cache. Caller owns effects and local figure transforms. */
export function createInkSwordRenderer(doc: Document) {
  let lease: FigureLease | undefined;
  const cache = new Map<string, HTMLCanvasElement>();
  let disposed = false,
    prepared = false,
    pending: Promise<void> | undefined;
  const pbrReady = () => prepared && !disposed;
  function prepare(): Promise<void> {
    if (pending) return pending;
    if (disposed) return Promise.resolve();
    pending = (async () => {
      try {
        const { packedFigures } = await import('./packed-figures.ts');
        if (disposed) return;
        const acquired = packedFigures(doc).acquireGroup('weapons');
        lease = acquired;
        await acquired.ready;
        prepared = !disposed;
      } catch {
        lease?.release();
        lease = undefined;
      }
    })();
    return pending;
  }
  function resolve(family: Family, frame: Frame) {
    const id = weaponSpriteId(family, frame);
    return id ? lease?.sprite(id) : null;
  }
  function fittingStamp(
    g: SceneDrawing,
    family: Family,
    frame: Frame,
    source: HTMLCanvasElement,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    const packed = resolve(family, frame);
    if (!packed || packed.metadata.empty) return;
    const [sw, sh] = packed.metadata.logicalSize;
    const [tx, ty] = packed.metadata.trim;
    const [, , pw, ph] = packed.metadata.frame;
    const crop = [
      (tx * source.width) / sw,
      (ty * source.height) / sh,
      (pw * source.width) / sw,
      (ph * source.height) / sh,
    ] as const;
    const placed = packedSpritePlacement(packed.metadata, x, y, width, height);
    if (packed.material)
      drawMaterialStamp(g, {
        texture: { source, revision: 0, frame: crop },
        material: packed.material,
        ...placed,
      });
    else g.drawImage(source, ...crop, placed.x, placed.y, placed.width, placed.height);
  }
  function part(family: Family, frame: Frame, tint?: string): HTMLCanvasElement | null {
    const key = family + ':' + frame.join(',') + ':' + (tint || ''),
      prior = cache.get(key);
    if (prior) {
      cache.delete(key);
      cache.set(key, prior);
      return prior;
    }
    const packed = resolve(family, frame);
    if (!packed) return null;
    const [sx, sy, sw, sh] = frame,
      c = doc.createElement('canvas'),
      s = Math.min(1, (family === 'blades' ? 1024 : 512) / Math.max(sw, sh));
    c.width = Math.max(1, Math.round(sw * s));
    c.height = Math.max(1, Math.round(sh * s));
    const g = c.getContext('2d');
    if (!g) return null;
    const [px, py, pw, ph] = packed.metadata.frame;
    const [tx, ty] = packed.metadata.trim;
    g.drawImage(
      packed.colour,
      px,
      py,
      pw,
      ph,
      (tx * c.width) / sw,
      (ty * c.height) / sh,
      (pw * c.width) / sw,
      (ph * c.height) / sh,
    );
    const data = g.getImageData(0, 0, c.width, c.height);
    // The originals retain near-transparent generator fringe. Clean only bounded cached cutouts.
    for (let i = 3; i < data.data.length; i += 4) if (data.data[i]! <= 16) data.data[i] = 0;
    g.putImageData(data, 0, 0);
    if (tint) {
      g.globalCompositeOperation = 'source-atop';
      g.globalAlpha = 0.48;
      g.fillStyle = tint;
      g.fillRect(0, 0, c.width, c.height);
    }
    cache.set(key, c);
    if (cache.size > 80) {
      const first = cache.keys().next().value!,
        old = cache.get(first)!;
      old.width = old.height = 0;
      cache.delete(first);
    }
    return c;
  }
  function draw(
    g: SceneDrawing,
    gx: number,
    gy: number,
    ang: number,
    _C: Palette,
    bs?: BladeStyle | null,
    id = 'steel',
  ): boolean {
    const recipe = BLADE_RECIPES[id],
      length = bs?.len ?? 0.52;
    if (disposed || !recipe || ![gx, gy, ang, length].every(Number.isFinite) || length <= 0)
      return false;
    void prepare();
    if (!prepared) return false;
    // Resolve all required stamps before touching the caller's context.
    if (recipe.special) {
      const frame = SPECIAL_FRAMES[recipe.special],
        im = part('special', frame, recipe.special === 'pan' && bs?.gold ? '#c8a650' : undefined);
      if (!im) return false;
      g.save();
      try {
        g.translate(gx, gy);
        g.rotate(ang);
        if (bs?.alpha !== undefined) g.globalAlpha *= Math.max(0, Math.min(1, bs.alpha));
        if (recipe.special === 'beam') {
          const sx = 0.18 / (1400 - 331),
            sy = 0.045 / 195;
          fittingStamp(
            g,
            'special',
            frame,
            im,
            0.016 - (1400 - frame[0]) * sx,
            -(194 - frame[1]) * sy,
            frame[2] * sx,
            frame[3] * sy,
          );
        } else {
          const s = length / (1681 - 500);
          fittingStamp(
            g,
            'special',
            frame,
            im,
            -(500 - frame[0]) * s,
            -(584 - frame[1]) * s,
            frame[2] * s,
            frame[3] * s,
          );
        }
        return true;
      } finally {
        g.restore();
      }
    }
    const profile = BLADE_PROFILE_FRAMES[recipe.profile]!,
      hiltFrame = HILT_FRAMES[recipe.hilt]!,
      guard = GUARD_PARTS[recipe.guard]!;
    const blade = part('blades', profile.frame, recipe.tint),
      hilt = part('hilts', hiltFrame, recipe.hiltTint),
      tsuba = part('hilts', guard.frame);
    if (!blade || !hilt || !tsuba) return false;
    g.save();
    try {
      g.translate(gx, gy);
      g.rotate(ang);
      if (bs?.alpha !== undefined) g.globalAlpha *= Math.max(0, Math.min(1, bs.alpha));
      fittingStamp(g, 'hilts', hiltFrame, hilt, -0.15, -0.016, 0.158, 0.032);
      const scale = 0.062 / guard.frame[3];
      fittingStamp(
        g,
        'hilts',
        guard.frame,
        tsuba,
        0.008 - (guard.pivot[0] - guard.frame[0]) * scale,
        -(guard.pivot[1] - guard.frame[1]) * scale,
        guard.frame[2] * scale,
        guard.frame[3] * scale,
      );
      const dx = profile.tip[0] - profile.root[0],
        dy = profile.tip[1] - profile.root[1],
        tx = length - 0.016,
        ty = -length * 0.05,
        s = Math.hypot(tx, ty) / Math.hypot(dx, dy);
      g.translate(0.016, 0);
      g.rotate(Math.atan2(ty, tx) - Math.atan2(dy, dx));
      const x = -(profile.root[0] - profile.frame[0]) * s,
        y = -(profile.root[1] - profile.frame[1]) * s;
      fittingStamp(
        g,
        'blades',
        profile.frame,
        blade,
        x,
        y,
        profile.frame[2] * s,
        profile.frame[3] * s,
      );
      return true;
    } finally {
      g.restore();
    }
  }
  return {
    prepare,
    draw,
    get ready() {
      return pbrReady();
    },
    snapshot: () => ({
      loaded: prepared ? ['blades', 'hilts', 'special', 'normal', 'surface'] : [],
      cachedParts: cache.size,
      pbrReady: pbrReady(),
      disposed,
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      prepared = false;
      lease?.release();
      lease = undefined;
      for (const c of cache.values()) c.width = c.height = 0;
      cache.clear();
    },
  };
}
