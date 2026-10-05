import type { SceneDrawing } from '../scene-drawing.ts';
import { createAssetMaterials } from '../asset-materials.ts';
import { drawMaterialStamp, supportsSceneMaterials } from '../scene-material.ts';
import type { SceneMaterial } from '../scene-frame.ts';
import type { Palette } from '../palette.ts';
import type { BladeStyle } from './types.ts';
import {
  BLADE_RECIPES,
  BLADE_PROFILE_FRAMES,
  HILT_FRAMES,
  GUARD_PARTS,
  SPECIAL_FRAMES,
} from './blade-recipes.ts';
type Family = 'blades' | 'hilts' | 'special';
type MapKind = 'normal' | 'roughness' | 'metallic' | 'ao' | 'emissive';
type SourceKind = Family | MapKind;
type Frame = readonly [number, number, number, number];
const SOURCES = {
  blades: new URL('./assets/blade-pbr/blade-profile-atlas_diffuse.png', import.meta.url).href,
  normal: new URL('./assets/blade-pbr/blade-profile-atlas_normal.png', import.meta.url).href,
  roughness: new URL('./assets/blade-pbr/blade-profile-atlas_roughness.png', import.meta.url).href,
  metallic: new URL('./assets/blade-pbr/blade-profile-atlas_metallic.png', import.meta.url).href,
  ao: new URL('./assets/blade-pbr/blade-profile-atlas_ao.png', import.meta.url).href,
  emissive: new URL('./assets/blade-pbr/blade-profile-atlas_emissive.png', import.meta.url).href,
  hilts: new URL('./assets/handle-guard-atlas.png', import.meta.url).href,
  special: new URL('./assets/special-weapons-atlas.png', import.meta.url).href,
};
/** Instance-owned modular weapon cache. Caller owns effects and local figure transforms. */
export function createInkSwordRenderer(doc: Document) {
  const fittings = createAssetMaterials(doc, { hilts: SOURCES.hilts, special: SOURCES.special });
  const materials = new Map<number, SceneMaterial>();
  const surface = doc.createElement('canvas');
  const images = new Map<SourceKind, HTMLImageElement>(),
    loaded = new Set<SourceKind>(),
    cache = new Map<string, HTMLCanvasElement>(),
    finish = new Set<() => void>();
  let disposed = false,
    pending: Promise<void> | undefined;
  function prepare(): Promise<void> {
    if (pending) return pending;
    if (disposed) return Promise.resolve();
    pending = Promise.all(
      (Object.keys(SOURCES) as SourceKind[]).map(
        (family) =>
          new Promise<void>((resolve) => {
            const im = doc.createElement('img');
            images.set(family, im);
            const done = () => {
              im.onload = null;
              im.onerror = null;
              finish.delete(done);
              resolve();
            };
            finish.add(done);
            im.onload = () => {
              const [w, h] = family === 'special' ? [1774, 887] : [1254, 1254];
              if (!disposed && im.naturalWidth === w && im.naturalHeight === h) loaded.add(family);
              done();
            };
            im.onerror = done;
            im.src = SOURCES[family];
          }),
      ),
    ).then(async () => {
      await fittings.prepare();
      if (
        disposed ||
        !['normal', 'roughness', 'metallic', 'ao', 'emissive'].every((kind) =>
          loaded.has(kind as MapKind),
        )
      )
        return;
      surface.width = surface.height = 1254;
      const g = surface.getContext('2d')!;
      const channels = (['roughness', 'metallic', 'ao'] as const).map((kind) => {
        g.clearRect(0, 0, 1254, 1254);
        g.drawImage(images.get(kind)!, 0, 0);
        return g.getImageData(0, 0, 1254, 1254).data;
      });
      const packed = g.createImageData(1254, 1254);
      for (let i = 0; i < packed.data.length; i += 4) {
        packed.data[i] = channels[0]![i]!;
        packed.data[i + 1] = channels[1]![i]!;
        packed.data[i + 2] = channels[2]![i]!;
        packed.data[i + 3] = 255;
      }
      g.putImageData(packed, 0, 0);
    });
    return pending;
  }
  function fittingStamp(
    g: SceneDrawing,
    family: 'hilts' | 'special',
    frame: Frame,
    source: HTMLCanvasElement,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    const material = fittings.material(family, frame);
    if (material)
      drawMaterialStamp(g, { texture: { source, revision: 0 }, material, x, y, width, height });
    else g.drawImage(source, x, y, width, height);
  }
  function part(family: Family, frame: Frame, tint?: string): HTMLCanvasElement | null {
    const key = family + ':' + frame.join(',') + ':' + (tint || ''),
      prior = cache.get(key);
    if (prior) {
      cache.delete(key);
      cache.set(key, prior);
      return prior;
    }
    const im = images.get(family);
    if (!im) return null;
    const [sx, sy, sw, sh] = frame,
      c = doc.createElement('canvas'),
      s = Math.min(1, (family === 'blades' ? 1024 : 512) / Math.max(sw, sh));
    c.width = Math.max(1, Math.round(sw * s));
    c.height = Math.max(1, Math.round(sh * s));
    const g = c.getContext('2d');
    if (!g) return null;
    g.drawImage(im, sx, sy, sw, sh, 0, 0, c.width, c.height);
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
    if (recipe.special ? !loaded.has('special') : !loaded.has('blades') || !loaded.has('hilts'))
      return false;
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
      if (surface.width === 1254 && supportsSceneMaterials(g)) {
        let material = materials.get(recipe.profile);
        if (!material) {
          material = {
            normal: { source: images.get('normal')!, revision: 0, frame: profile.frame },
            surface: { source: surface, revision: 0, frame: profile.frame },
            emissive: { source: images.get('emissive')!, revision: 0, frame: profile.frame },
            normalY: -1,
            lighting: 1,
            depth: 0,
            fog: 0,
            fogColor: [0.53, 0.51, 0.47],
          };
          materials.set(recipe.profile, material);
        }
        drawMaterialStamp(g, {
          texture: { source: blade, revision: 0 },
          material,
          x,
          y,
          width: profile.frame[2] * s,
          height: profile.frame[3] * s,
        });
      } else g.drawImage(blade, x, y, profile.frame[2] * s, profile.frame[3] * s);
      return true;
    } finally {
      g.restore();
    }
  }
  return {
    prepare,
    draw,
    get ready() {
      return (
        loaded.size === Object.keys(SOURCES).length &&
        surface.width === 1254 &&
        fittings.ready('hilts') &&
        fittings.ready('special')
      );
    },
    snapshot: () => ({
      loaded: [...loaded],
      cachedParts: cache.size,
      pbrReady: surface.width === 1254,
      disposed,
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      fittings.dispose();
      materials.clear();
      surface.width = surface.height = 0;
      for (const im of images.values()) {
        im.onload = null;
        im.onerror = null;
        im.removeAttribute('src');
      }
      for (const f of [...finish]) f();
      for (const c of cache.values()) c.width = c.height = 0;
      cache.clear();
      images.clear();
      loaded.clear();
    },
  };
}
