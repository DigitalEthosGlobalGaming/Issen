import { reportGraphicsError } from '../rendering/graphics-error.ts';
import { assetMaterialCatalog } from '../rendering/asset-material-catalog.ts';
import { createPbrAtlas } from '../rendering/pbr-atlas.ts';
import type { createLightingRig } from '../rendering/lighting-rig.ts';
import type { PixiScenePainter } from '../rendering/pixi/scene-painter.ts';
import { drawMaterialStamp, setSceneLighting } from '../rendering/scene-material.ts';
import { registerUiTextureRenderer } from './material-textures.ts';
import { createMainImageOwner } from '../platform/main-images.ts';
import { observeAssetBackground } from '../platform/asset-background.ts';
import { trackPixelSource } from '../platform/pixel-memory.ts';
import {
  reclaimSceneMemory,
  reclaimBackgroundSceneMemory,
  registerSceneMemory,
} from '../platform/scene-memory.ts';

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
    wake: (() => void) | undefined,
    cancelExport: (() => void) | undefined;
  const allowed = () => foregroundRequests > 0 || (quiet && !doc.hidden);
  const resume = () => {
    if (!allowed()) cancelExport?.();
    if (allowed()) {
      wake?.();
      if (deferred && performance.now() >= retryAt) schedule();
    }
  };
  const stopBackground = observeAssetBackground((_stage, settled, work, budget) => {
    quiet = settled && work <= budget * 0.75;
    resume();
  });
  doc.addEventListener('visibilitychange', resume);
  async function grant(current = () => true) {
    while (!allowed() && !disposed && current()) {
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
  const canvas = trackPixelSource(doc, doc.createElement('canvas'), 'canvas');
  canvas.width = canvas.height = 1;
  let painter: PixiScenePainter | null = null;
  let painterPending: Promise<PixiScenePainter | null> | undefined;
  let renderPending: Promise<void> | undefined;
  let disposed = false,
    scheduled = false,
    rendering = false,
    dirty = false,
    version = 0,
    deferred = false,
    retryAt = 0;
  let allocation: { urls: string[]; inputs: number; output: number; gpu: number } | undefined;
  function pendingBytes(plan: NonNullable<typeof allocation>) {
    return (
      Math.max(0, plan.inputs - decodedImages.bytesFor(plan.urls)) +
      Math.max(0, plan.gpu - (painter?.memorySnapshot.bytes ?? 0)) +
      Math.max(0, plan.output - canvas.width * canvas.height * 4) +
      Math.max(0, plan.output * 3 - (painter?.memorySnapshot.browserReserveBytes ?? 0)) +
      plan.output * 2
    );
  }
  const exportMemory = {
    get memorySnapshot() {
      return {
        decodedBytes: 0,
        canvasBytes: 0,
        transferredBytes: 0,
        // CSS output may own both decoded pixels and a browser-uploaded copy.
        // This is an estimate, not an observation of native residency.
        reservedBytes: disposed
          ? 0
          : [...jobs.values()].reduce(
              (bytes, value) => bytes + (value.url ? value.frame[2] * value.frame[3] * 8 : 0),
              0,
            ) + (allocation ? pendingBytes(allocation) : 0),
      };
    },
  };
  registerSceneMemory(doc, exportMemory);
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
        ownedColour = trackPixelSource(doc, doc.createElement('canvas'), 'canvas');
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
    deferred = false;
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
        const urls = [pack.source, pack.maps.normal, pack.maps.surface, pack.maps.emissive].filter(
          (url): url is string => !!url,
        );
        const inputs = new Set(urls).size * pack.dimensions[0] * pack.dimensions[1] * 4;
        const output = value.frame[2] * value.frame[3] * 4;
        // Uploaded inputs plus RGBA geometry, HDR lights, stencil and back buffers.
        // Ten RGBA planes conservatively cover this unfiltered single-stamp export.
        const plan = { urls, inputs, output, gpu: inputs + output * 10 };
        // Publish before reclamation too: evicting an input from this pack moves
        // its bytes back into the plan instead of creating fictitious headroom.
        allocation = plan;
        const memory = reclaimBackgroundSceneMemory(doc);
        if (memory.committedBytes > memory.backgroundBudget) {
          allocation = undefined;
          deferred = true;
          retryAt = performance.now() + 250;
          continue;
        }
        // Publish the whole job before the first await so next-scene admission
        // sees future decode/upload storage. Residency replaces this reservation.
        const lease = decodedImages.acquire(pack.source);
        const atlas = createPbrAtlas(doc, pack.maps, ...pack.dimensions, {
          colour: false,
          images: decodedImages,
        });
        let cancelled = false;
        const cancel = () => {
          cancelled = true;
          atlas.dispose();
          lease.release();
          decodedImages.cancelUnused(urls);
          allocation = undefined;
          deferred = true;
          retryAt = performance.now() + 250;
          wake?.();
        };
        cancelExport = cancel;
        try {
          const [source, maps] = await Promise.allSettled([lease.ready, atlas.prepare()]);
          if (
            disposed ||
            cancelled ||
            source.status !== 'fulfilled' ||
            maps.status !== 'fulfilled' ||
            !maps.value
          )
            continue;
          const material = atlas.material(value.frame);
          if (!material) continue;
          await grant(() => !cancelled);
          if (disposed) return;
          if (cancelled) continue;
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
          cancelExport = undefined;
          atlas.dispose();
          lease.release();
          // CSS owns the exported pixels. Do not retain the full-size lighting
          // targets while waiting for the next quiet frame or after the last job.
          target.suspend();
          allocation = undefined;
          reclaimSceneMemory(doc);
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
      gpuMemory: painter?.memorySnapshot,
      exportPixels: canvas.width * canvas.height,
      reservedBytes: exportMemory.memorySnapshot.reservedBytes,
      deferred,
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelExport?.();
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
