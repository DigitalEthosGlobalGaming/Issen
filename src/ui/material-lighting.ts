import { reportGraphicsError } from '../rendering/graphics-error.ts';
import { assetMaterialCatalog } from '../rendering/asset-material-catalog.ts';
import { createPbrAtlas } from '../rendering/pbr-atlas.ts';
import type { createLightingRig } from '../rendering/lighting-rig.ts';
import type { PixiScenePainter } from '../rendering/pixi/scene-painter.ts';
import { drawMaterialStamp, setSceneLighting } from '../rendering/scene-material.ts';
import { registerUiTextureRenderer } from './material-textures.ts';

type Frame = readonly [number, number, number, number];
type Pack = (typeof assetMaterialCatalog)[number];
type Asset = {
  pack: Pack;
  image: HTMLImageElement;
  atlas: ReturnType<typeof createPbrAtlas>;
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
type Replacement = { original: string; value: string; priority: string };

/** CSS keeps its slices, crops and states; only the aligned colour texture is replaced. */
export function createUiMaterialLighting(doc: Document, rig: ReturnType<typeof createLightingRig>) {
  const packs = new Map(assetMaterialCatalog.map((pack) => [pack.source, pack]));
  const assets = new Map<string, Asset>();
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
  function asset(pack: Pack): Asset {
    let value = assets.get(pack.source);
    if (!value) {
      const image = doc.createElement('img');
      image.src = pack.source;
      const atlas = createPbrAtlas(doc, pack.maps, pack.dimensions[0], pack.dimensions[1]);
      value = {
        pack,
        image,
        atlas,
        ready: Promise.all([
          image
            .decode()
            .then(() => true)
            .catch(() => false),
          atlas.prepare(),
        ]).then((results) => !disposed && results.every(Boolean)),
      };
      assets.set(pack.source, value);
    }
    return value;
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
        frame: frame ?? [0, 0, ...pack.dimensions],
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
      if (!jobs.size) return;
      const target = await preparePainter();
      if (!target || disposed) return;
      for (const value of jobs.values()) {
        if (value.version === version || !value.asset.atlas.ready) continue;
        const material = value.asset.atlas.material(value.frame);
        if (!material) continue;
        const [, , width, height] = value.frame;
        canvas.width = width;
        canvas.height = height;
        target.begin();
        setSceneLighting(target, rig.lighting(width, height));
        drawMaterialStamp(target, {
          texture: {
            source: value.colour ?? value.asset.image,
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
    attributeFilter: ['src', 'style'],
  });
  refresh();
  return {
    refresh,
    async prepare() {
      await Promise.all([...assets.values()].map((value) => value.ready));
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
      for (const value of assets.values()) {
        value.atlas.dispose();
        value.image.removeAttribute('src');
      }
      assets.clear();
      jobs.clear();
      styles.clear();
      images.clear();
      variables.clear();
      canvas.width = canvas.height = 0;
    },
  };
}
