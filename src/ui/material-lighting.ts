import { uiTextureCatalog } from './ui-texture-catalog.ts';
import { packedSourceRegion } from '../rendering/packed-source.ts';
import type { UiLease } from './packed-ui.ts';
import type { createLightingRig } from '../rendering/lighting-rig.ts';
import type { PixiScenePainter } from '../rendering/pixi/scene-painter.ts';
import { drawMaterialStamp, setSceneLighting } from '../rendering/scene-material.ts';
import { registerUiTextureRenderer } from './material-textures.ts';

type Frame = readonly [number, number, number, number];
type Pack = (typeof uiTextureCatalog)[number];
type Asset = {
  pack: Pack;
  lease?: UiLease;
  ids: readonly string[];
  loaded: boolean;
  failed: boolean;
  ready: Promise<boolean>;
};
type Job = {
  asset: Asset;
  colour?: HTMLCanvasElement;
  frame: Frame;
  variable: string;
  url?: string;
  version: number;
};

export class UiArtworkLoadError extends Error {
  constructor() {
    super('Required UI artwork could not be loaded');
    this.name = 'UiArtworkLoadError';
  }
}

/** CSS keeps its slices, crops and states; only the aligned colour texture is replaced. */
export function createUiMaterialLighting(
  doc: Document,
  rig: ReturnType<typeof createLightingRig>,
  allowWebGL = true,
) {
  const packs = new Map(uiTextureCatalog.map((pack) => [pack.source, pack]));
  const assets = new Map<string, Asset>();
  const jobs = new Map<string, Job>();
  const images = new Map<HTMLImageElement, { source: string; job: Job; rendered?: string }>();
  const variables = new Map<string, string>();
  const retiredUrls: string[] = [];
  const canvas = doc.createElement('canvas');
  canvas.width = canvas.height = 1;
  let painter: PixiScenePainter | null = null;
  let painterPending: Promise<PixiScenePainter | null> | undefined;
  let renderPending: Promise<void> | undefined;
  let disposed = false,
    scheduled = false,
    rendering = false,
    dirty = false,
    version = 0;
  const preparePainter = () =>
    (painterPending ??= import('../rendering/pixi/scene-painter.ts')
      .then((module) => module.createPixiScenePainter(canvas))
      .then((result) => {
        if (disposed) {
          result.dispose();
          return null;
        }
        painter = result;
        return result;
      })
      .catch(() => null));
  function asset(pack: Pack): Asset {
    let value = assets.get(pack.source);
    if (!value) {
      const owned: Asset = {
        pack,
        ids: [],
        loaded: false,
        failed: false,
        ready: Promise.resolve(false),
      };
      prepareAsset(owned);
      value = owned;
      assets.set(pack.source, value);
    }
    return value;
  }
  function prepareAsset(owned: Asset) {
    owned.failed = false;
    owned.loaded = false;
    owned.lease?.release();
    owned.lease = undefined;
    owned.ready = import('./packed-ui.ts')
      .then(async ({ packedUi }) => {
        if (disposed) return false;
        owned.ids = owned.pack.ids;
        const lease = packedUi(doc).acquire(owned.ids);
        owned.lease = lease;
        await lease.ready;
        if (disposed) {
          lease.release();
          return false;
        }
        owned.loaded = true;
        return true;
      })
      .catch(() => {
        owned.failed = !disposed;
        return false;
      });
  }
  function job(key: string, pack: Pack, colour?: HTMLCanvasElement, frame?: Frame): Job {
    let value = jobs.get(key);
    if (!value) {
      let ownedColour: HTMLCanvasElement | undefined;
      if (colour) {
        ownedColour = doc.createElement('canvas');
        ownedColour.width = colour.width;
        ownedColour.height = colour.height;
        ownedColour.getContext('2d')!.drawImage(colour, 0, 0);
      }
      value = {
        asset: asset(pack),
        colour: ownedColour,
        frame: frame ?? pack.frame ?? [0, 0, ...pack.dimensions],
        variable: `--pbr-ui-${jobs.size}`,
        version: -1,
      };
      variables.set(value.variable, doc.documentElement.style.getPropertyValue(value.variable));
      jobs.set(key, value);
      void value.asset.ready.then(schedule);
    }
    return value;
  }
  function schedule() {
    if (disposed) return;
    dirty = true;
    if (scheduled || rendering) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      void render();
    });
  }
  function render(): Promise<void> {
    return (renderPending ??= renderPass().finally(() => {
      renderPending = undefined;
      if (dirty && !disposed) schedule();
    }));
  }
  async function renderPass() {
    if (disposed || rendering) return;
    rendering = true;
    dirty = false;
    try {
      if (!allowWebGL || !jobs.size) return;
      const target = await preparePainter();
      if (!target || disposed) return;
      for (const value of jobs.values()) {
        if (value.version === version || !value.asset.loaded) continue;
        const [, , width, height] = value.frame;
        canvas.width = width;
        canvas.height = height;
        target.begin();
        setSceneLighting(target, rig.lighting(width, height));
        for (const id of value.asset.ids) {
          const sprite = value.asset.lease?.sprite(id);
          if (!sprite) continue;
          const region = packedSourceRegion(sprite, value.frame);
          if (!region?.material) continue;
          const stamp = { ...region, material: region.material };
          if (value.colour) {
            const scaleX = value.colour.width / width;
            const scaleY = value.colour.height / height;
            drawMaterialStamp(target, {
              ...stamp,
              texture: {
                source: value.colour,
                revision: 0,
                frame: [
                  region.x * scaleX,
                  region.y * scaleY,
                  region.width * scaleX,
                  region.height * scaleY,
                ],
              },
            });
          } else drawMaterialStamp(target, stamp);
        }
        target.flush();
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((result) => {
            if (result) resolve(result);
            else reject(Error('UI texture encoding failed'));
          }),
        );
        if (disposed) return;
        if (value.url) retiredUrls.push(value.url);
        value.url = URL.createObjectURL(blob);
        value.version = version;
        doc.documentElement.style.setProperty(value.variable, `url("${value.url}")`);
      }
      for (const [image, entry] of images) {
        if (!image.isConnected) {
          images.delete(image);
          continue;
        }
        if (entry.job.url && image.src !== entry.job.url) {
          entry.rendered = entry.job.url;
          image.src = entry.job.url;
        }
      }
    } finally {
      retiredUrls.splice(0).forEach((url) => URL.revokeObjectURL(url));
      rendering = false;
    }
  }
  function rewrite(style: CSSStyleDeclaration) {
    // Shorthands containing variables expose empty longhands until substitution.
    // Resolve the stable token itself so borders keep their authored slice/width.
    for (const match of style.cssText.matchAll(/var\((--issen-ui-([a-z0-9-]+))\)/g)) {
      const pack = packs.get(`issen-ui:${match[2]}`);
      if (!pack) continue;
      const alias = match[1]!;
      if (!variables.has(alias))
        variables.set(alias, doc.documentElement.style.getPropertyValue(alias));
      doc.documentElement.style.setProperty(alias, `var(${job(pack.source, pack).variable})`);
    }
  }
  function rules(list: CSSRuleList) {
    for (const rule of Array.from(list)) {
      if ('style' in rule) rewrite((rule as CSSStyleRule).style);
      if ('cssRules' in rule) rules((rule as CSSGroupingRule).cssRules);
    }
  }
  function refresh() {
    if (disposed) return;
    for (const sheet of Array.from(doc.styleSheets)) {
      try {
        rules(sheet.cssRules);
      } catch {
        /* External styles retain their source artwork. */
      }
    }
    for (const element of doc.querySelectorAll<HTMLElement>('[style]')) {
      if (element !== doc.documentElement) rewrite(element.style);
    }
    for (const image of doc.querySelectorAll('img')) {
      const pack = packs.get(image.dataset.uiTexture ?? '');
      if (pack) {
        const next = job(pack.source, pack);
        if (images.get(image)?.job !== next)
          images.set(image, { source: image.getAttribute('src') ?? '', job: next });
      } else {
        const entry = images.get(image);
        if (entry && image.src !== entry.rendered) images.delete(image);
      }
    }
    schedule();
  }
  const unregister = registerUiTextureRenderer(doc, async (key, source, colour, frame) => {
    const pack = packs.get(source);
    if (!pack || disposed) return null;
    const value = job(`custom:${key}`, pack, colour, frame);
    if (!(await value.asset.ready) || disposed) return null;
    schedule();
    return `var(${value.variable}, url("${colour.toDataURL()}"))`;
  });
  const unsubscribe = rig.subscribe(() => {
    version++;
    schedule();
  });
  const observer = new MutationObserver((records) => {
    if (
      records.some(
        (record) => record.target !== doc.documentElement || record.attributeName !== 'style',
      )
    )
      refresh();
  });
  observer.observe(doc.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['src', 'style', 'data-ui-texture'],
  });
  refresh();
  return {
    refresh,
    async prepare() {
      for (const value of assets.values()) if (value.failed) prepareAsset(value);
      const ready = await Promise.all([...assets.values()].map((value) => value.ready));
      if (!disposed && ready.some((value) => !value)) throw new UiArtworkLoadError();
      await render();
      if (dirty) await render();
    },
    snapshot: () => ({
      assets: assets.size,
      rendered: [...jobs.values()].filter((value) => value.url).length,
      jobs: jobs.size,
      available: !!painter,
      disposed,
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      observer.disconnect();
      unsubscribe();
      unregister();
      for (const [image, entry] of images)
        if (image.src === entry.rendered) {
          if (entry.source) image.src = entry.source;
          else image.removeAttribute('src');
        }
      for (const [variable, previous] of variables) {
        if (previous) doc.documentElement.style.setProperty(variable, previous);
        else doc.documentElement.style.removeProperty(variable);
      }
      painter?.dispose();
      for (const value of jobs.values()) {
        if (value.url) URL.revokeObjectURL(value.url);
        if (value.colour) value.colour.width = value.colour.height = 0;
      }
      for (const value of assets.values()) {
        value.lease?.release();
      }
      assets.clear();
      jobs.clear();
      images.clear();
      variables.clear();
      canvas.width = canvas.height = 0;
    },
  };
}
