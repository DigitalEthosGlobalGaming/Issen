import { reportGraphicsError } from '../rendering/graphics-error.ts';
import { assetMaterialCatalog } from '../rendering/asset-material-catalog.ts';
import { createPbrAtlas } from '../rendering/pbr-atlas.ts';
import type { createLightingRig } from '../rendering/lighting-rig.ts';
import type { PixiScenePainter } from '../rendering/pixi/scene-painter.ts';
import { drawMaterialStamp, setSceneLighting } from '../rendering/scene-material.ts';
import { registerUiTextureRenderer } from './material-textures.ts';
import { createMainImageOwner } from '../platform/main-images.ts';
import { observeAssetBackground } from '../platform/asset-background.ts';

type Frame = readonly [number, number, number, number];
type Pack = (typeof assetMaterialCatalog)[number];
type Job = {
  asset: Pack;
  colour?: HTMLCanvasElement;
  frame: Frame;
  variable: string;
  url?: string;
  version: number;
};
type Replacement = { original: string; value: string; priority: string };

/** CSS keeps its slices, crops and states; only the aligned colour texture is replaced. */
export function createUiMaterialLighting(doc: Document, rig: ReturnType<typeof createLightingRig>) {
  const packs = new Map(assetMaterialCatalog.map((pack) => [pack.source, pack]));
  const assets = new Map<string, Pack>();
  const decodedImages = createMainImageOwner(doc);
  let quiet = false,
    foregroundRequests = 0,
    wake: (() => void) | undefined;
  const allowed = () => foregroundRequests > 0 || (quiet && !doc.hidden);
  const resume = () => {
    if (allowed()) wake?.();
  };
  const stopBackground = observeAssetBackground((_stage, settled, work, budget) => {
    quiet = settled && work <= budget * 0.75;
    resume();
  });
  doc.addEventListener('visibilitychange', resume);
  async function grant() {
    while (!allowed() && !disposed) {
      await new Promise<void>((resolve) => {
        wake = resolve;
      });
      wake = undefined;
    }
  }
  const jobs = new Map<string, Job>();
  const styles = new Map<CSSStyleDeclaration, Map<string, Replacement>>();
  const images = new Map<HTMLImageElement, { source: string; job: Job; rendered?: string }>();
  const variables = new Map<string, string>();
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
      .catch(() => {
        if (!disposed) reportGraphicsError(canvas);
        return null;
      }));
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
        asset: pack,
        colour: ownedColour,
        frame: frame ?? [0, 0, ...pack.dimensions],
        variable: `--pbr-ui-${jobs.size}`,
        version: -1,
      };
      variables.set(value.variable, doc.documentElement.style.getPropertyValue(value.variable));
      jobs.set(key, value);
      assets.set(pack.source, pack);
      schedule();
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
      if (!jobs.size) return;
      await grant();
      if (disposed) return;
      const target = await preparePainter();
      if (!target || disposed) return;
      for (const value of jobs.values()) {
        if (value.version === version) continue;
        await grant();
        if (disposed) return;
        const pack = value.asset;
        const lease = decodedImages.acquire(pack.source);
        const atlas = createPbrAtlas(doc, pack.maps, ...pack.dimensions, {
          colour: false,
          images: decodedImages,
        });
        try {
          const [source, maps] = await Promise.allSettled([lease.ready, atlas.prepare()]);
          if (
            disposed ||
            source.status !== 'fulfilled' ||
            maps.status !== 'fulfilled' ||
            !maps.value
          )
            continue;
          const material = atlas.material(value.frame);
          if (!material) continue;
          await grant();
          if (disposed) return;
          const [, , width, height] = value.frame;
          canvas.width = width;
          canvas.height = height;
          target.begin();
          setSceneLighting(target, rig.lighting(width, height));
          drawMaterialStamp(target, {
            texture: {
              source: value.colour ?? source.value,
              revision: 0,
              frame: value.colour ? undefined : value.frame,
            },
            material,
            x: 0,
            y: 0,
            width,
            height,
          });
          target.flush();
          value.url = canvas.toDataURL();
          value.version = version;
          doc.documentElement.style.setProperty(value.variable, `url("${value.url}")`);
          target.releaseTextureSources([
            value.colour ?? source.value,
            ...[material.normal, material.surface, material.emissive].flatMap((map) =>
              map ? [map.source] : [],
            ),
          ]);
        } finally {
          atlas.dispose();
          lease.release();
        }
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
      rendering = false;
    }
  }
  function rewrite(style: CSSStyleDeclaration, base: string) {
    for (const property of Array.from(style)) {
      const original = style.getPropertyValue(property);
      if (original.includes('--pbr-ui-')) continue;
      const value = original.replace(
        /url\(\s*["']?([^"')]+)["']?\s*\)/g,
        (match, source: string) => {
          let pack: Pack | undefined;
          try {
            pack = packs.get(new URL(source.trim(), base).href);
          } catch {
            return match;
          }
          return pack ? `var(${job(pack.source, pack).variable}, ${match})` : match;
        },
      );
      if (value === original) continue;
      let records = styles.get(style);
      if (!records) {
        records = new Map();
        styles.set(style, records);
      }
      const priority = style.getPropertyPriority(property);
      records.set(property, { original, value, priority });
      style.setProperty(property, value, priority);
    }
  }
  function rules(list: CSSRuleList, base: string) {
    for (const rule of Array.from(list)) {
      if ('style' in rule) rewrite((rule as CSSStyleRule).style, base);
      if ('cssRules' in rule) rules((rule as CSSGroupingRule).cssRules, base);
    }
  }
  function refresh() {
    if (disposed) return;
    for (const sheet of Array.from(doc.styleSheets)) {
      try {
        rules(sheet.cssRules, sheet.href ?? doc.baseURI);
      } catch {
        /* External styles retain their source artwork. */
      }
    }
    for (const element of doc.querySelectorAll<HTMLElement>('[style]')) {
      if (element !== doc.documentElement) rewrite(element.style, doc.baseURI);
    }
    for (const image of doc.querySelectorAll('img')) {
      const pack = packs.get(image.src);
      if (pack) images.set(image, { source: image.src, job: job(pack.source, pack) });
      else {
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
    schedule();
    await prepare();
    if (disposed || !value.url) return null;
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
    attributeFilter: ['src', 'style'],
  });
  refresh();
  async function prepare() {
    foregroundRequests++;
    resume();
    try {
      await render();
      if (dirty) await render();
    } finally {
      foregroundRequests--;
    }
  }
  return {
    refresh,
    prepare,
    snapshot: () => ({
      assets: assets.size,
      rendered: [...jobs.values()].filter((value) => value.url).length,
      jobs: jobs.size,
      available: !!painter,
      disposed,
      decodedLoader: decodedImages.snapshot(),
      sourceTextures: painter?.sourceTextureCount ?? 0,
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      stopBackground();
      doc.removeEventListener('visibilitychange', resume);
      wake?.();
      observer.disconnect();
      unsubscribe();
      unregister();
      for (const [style, records] of styles)
        for (const [property, replacement] of records)
          if (style.getPropertyValue(property) === replacement.value)
            style.setProperty(property, replacement.original, replacement.priority);
      for (const [image, entry] of images)
        if (image.src === entry.rendered) image.src = entry.source;
      for (const [variable, previous] of variables) {
        if (previous) doc.documentElement.style.setProperty(variable, previous);
        else doc.documentElement.style.removeProperty(variable);
      }
      painter?.dispose();
      for (const value of jobs.values())
        if (value.colour) value.colour.width = value.colour.height = 0;
      decodedImages.dispose();
      assets.clear();
      jobs.clear();
      styles.clear();
      images.clear();
      variables.clear();
      canvas.width = canvas.height = 0;
    },
  };
}
