import { markScenePhase, measureScenePhase } from '../../platform/scene-timing.ts';
import type { SceneDrawing } from '../scene-drawing.ts';
import type { TextureUpload, WarmSceneTextures } from '../texture-upload.ts';
import type { EnvironmentFrame } from './local-renderer.ts';
import { createAssetMaterials } from '../asset-materials.ts';
import { createCachedMaterials } from '../cached-materials.ts';
import { drawMaterialStamp } from '../scene-material.ts';
import { drawEnvironmentMotion } from './motion.ts';
import { closeLayers, compositionKey, composedLayerBytes } from './worker-types.ts';
import { createSceneImagePreload } from './image-preload.ts';
import { documentImageBudget } from '../../platform/main-images.ts';
import { trackPixelSource } from '../../platform/pixel-memory.ts';
import type {
  ComposedLayer,
  ComposeRequest,
  ComposeResponse,
  EnvironmentSnapshot,
} from './worker-types.ts';

const FOG_URL = new URL('./assets/fog-wisps-atlas.webp', import.meta.url).href;
const emptySnapshot = (): EnvironmentSnapshot => ({
  foreground: { layers: 0, pixels: 0 },
  backend: 'loading',
  builds: 0,
  loadedImages: 0,
  width: 0,
  height: 0,
  layers: 0,
  pixels: 0,
});

/** One worker and one completed scene per owner; queued changes replace older requests. */
export function createWorkerEnvironmentRenderer(
  doc: Document,
  warmWorkerScene?: WarmSceneTextures,
) {
  let worker: Worker | undefined;
  let workerGeneration = 0;
  const fogMaps = createAssetMaterials(doc, { fog: FOG_URL });
  const fogBindings = createCachedMaterials();
  let fog: HTMLImageElement | undefined;
  let fogPending: Promise<void> | undefined;
  let disposed = false,
    running = false;
  let sequence = 0,
    preparedStage = -1;
  let preparePending: Promise<void> | undefined;
  let preparing = false;
  let desired: EnvironmentFrame | undefined, completed: EnvironmentFrame | undefined;
  let currentKey = '';
  let layers: ComposedLayer[] = [],
    foreground: ComposedLayer[] = [];
  let snapshot = emptySnapshot();
  let workerFailure: string | undefined;
  const requests = new Map<
    number,
    { resolve: (response: ComposeResponse) => void; timer: ReturnType<typeof setTimeout> }
  >();
  const waiters = new Map<string, Set<(success: boolean) => void>>();
  const uploads = new Map<AbortController, string>();
  const imagePreload = createSceneImagePreload(
    doc,
    () =>
      !disposed &&
      !workerFailure &&
      !running &&
      !preparing &&
      preparedStage === completed?.stage &&
      snapshot.backend === 'layered'
        ? completed
        : undefined,
    (stage) => ({
      ready: send({ kind: 'preload', stage }).then((response) => response.ok),
      release: () => {
        if (!disposed && !workerFailure) void send({ kind: 'preload' });
      },
    }),
  );
  const cancelUploads = (key?: string) => {
    for (const [controller, pendingKey] of uploads) if (pendingKey !== key) controller.abort();
  };
  const settle = (key: string, success: boolean) => {
    for (const resolve of waiters.get(key) ?? []) resolve(success);
    waiters.delete(key);
  };
  function release() {
    closeLayers([...layers, ...foreground]);
    layers = [];
    foreground = [];
    completed = undefined;
    currentKey = '';
  }
  function failWorker(reason: string) {
    if (disposed || workerFailure) return;
    workerFailure = reason;
    workerGeneration++;
    running = preparing = false;
    imagePreload.cancel();
    cancelUploads();
    worker?.terminate();
    worker = undefined;
    release();
    snapshot = { ...emptySnapshot(), backend: 'unavailable', texturesWarmed: false };
    for (const [id, request] of requests) {
      clearTimeout(request.timer);
      request.resolve({ id, ok: false, layers: [], foreground: [], snapshot: emptySnapshot() });
    }
    requests.clear();
    for (const key of waiters.keys()) settle(key, false);
  }
  function startWorker() {
    if (disposed) return false;
    workerGeneration++;
    try {
      if (
        typeof Worker === 'undefined' ||
        typeof OffscreenCanvas === 'undefined' ||
        typeof createImageBitmap === 'undefined'
      )
        throw Error('This browser does not support worker scenery preparation');
      const incoming = new Worker(new URL('./compose.worker.ts', import.meta.url), {
        type: 'module',
        name: 'issen-scenery',
      });
      worker = incoming;
      incoming.addEventListener('error', (event) => {
        event.preventDefault();
        if (worker === incoming) failWorker(event.message || 'Scenery worker failed');
      });
      incoming.addEventListener('messageerror', () => {
        if (worker === incoming) failWorker('Scenery worker response could not be read');
      });
      incoming.addEventListener('message', ({ data }: MessageEvent<ComposeResponse>) => {
        if (worker !== incoming || disposed) {
          closeLayers([...data.layers, ...data.foreground]);
          return;
        }
        if (data.phase === 'assets-ready') {
          if (requests.has(data.id)) markScenePhase('assets-ready', 'false:' + data.key);
          return;
        }
        const request = requests.get(data.id);
        if (!request) {
          closeLayers([...data.layers, ...data.foreground]);
          return;
        }
        clearTimeout(request.timer);
        requests.delete(data.id);
        request.resolve(data);
      });
      return true;
    } catch (error) {
      failWorker(String(error));
      return false;
    }
  }
  function retry() {
    if (disposed) return false;
    if (!workerFailure) return !!worker;
    workerFailure = undefined;
    preparedStage = -1;
    preparePending = undefined;
    snapshot = emptySnapshot();
    return startWorker();
  }
  function send(
    request:
      | Omit<Extract<ComposeRequest, { kind: 'prepare' }>, 'id'>
      | Omit<Extract<ComposeRequest, { kind: 'compose' }>, 'id'>
      | Omit<Extract<ComposeRequest, { kind: 'preload' }>, 'id'>,
  ) {
    if (disposed || workerFailure || !worker)
      return Promise.resolve<ComposeResponse>({
        id: ++sequence,
        ok: false,
        layers: [],
        foreground: [],
        snapshot,
        error: workerFailure,
      });
    return new Promise<ComposeResponse>((resolve) => {
      const id = ++sequence;
      const timer = setTimeout(() => failWorker('Scenery worker timed out'), 45000);
      requests.set(id, { resolve, timer });
      try {
        worker!.postMessage({ ...request, id, decodedBudget: documentImageBudget(doc) });
      } catch (error) {
        failWorker(String(error));
      }
    });
  }
  function prepareFog(): Promise<void> {
    return (fogPending ??= (async () => {
      fog = trackPixelSource(doc, doc.createElement('img'), 'decoded');
      fog.src = FOG_URL;
      try {
        await Promise.all([fog.decode(), fogMaps.prepare()]);
        if (!disposed && fogMaps.ready('fog'))
          fogBindings.bind(fog, (frame) => fogMaps.material('fog', frame));
      } catch {
        /* Keep the unavailable-image path visible through the scene owner. */
      }
    })());
  }
  async function warmLayers(
    frame: EnvironmentFrame,
    nextLayers: readonly ComposedLayer[],
    nextForeground: readonly ComposedLayer[],
  ): Promise<boolean> {
    if (!warmWorkerScene) return true;
    const key = compositionKey(frame),
      controller = new AbortController();
    uploads.set(controller, key);
    const sources: TextureUpload[] = [];
    for (const layer of [...nextLayers, ...nextForeground])
      for (const kind of ['colour', 'normal', 'surface', 'emissive'] as const) {
        const source = layer[kind];
        if (source)
          sources.push({
            texture: { source, revision: 0 },
            data: kind === 'normal' || kind === 'surface',
          });
      }
    if (frame.stage === 0 && fog?.naturalWidth) {
      sources.push({ texture: { source: fog, revision: 0 } });
      const material = fogMaps.material('fog', [0, 0, fog.naturalWidth, fog.naturalHeight]);
      for (const kind of ['normal', 'mask', 'surface', 'emissive'] as const)
        if (material?.[kind]) sources.push({ texture: material[kind], data: kind !== 'emissive' });
    }
    const timingKey = 'false:' + key;
    markScenePhase('texture-warm-start', timingKey);
    try {
      const ready = await warmWorkerScene(sources, controller.signal);
      if (controller.signal.aborted || disposed || !desired || compositionKey(desired) !== key)
        return false;
      if (!ready) throw Error('Scenery texture initialization failed');
      markScenePhase('textures-warmed', timingKey, {
        mode: 'paced-source-init',
        prewarmed: true,
        sources: sources.length,
      });
      measureScenePhase(
        'texture-warm',
        'issen:texture-warm-start:' + timingKey,
        'issen:textures-warmed:' + timingKey,
        timingKey,
      );
      return true;
    } finally {
      uploads.delete(controller);
    }
  }
  async function pump() {
    if (running || disposed || workerFailure || doc.hidden || !desired) return;
    const frame = { ...desired },
      key = compositionKey(frame),
      generation = workerGeneration;
    if (key === currentKey) return;
    imagePreload.cancel();
    running = true;
    snapshot.backend = 'loading';
    let incoming: ComposeResponse | undefined,
      accepted = false;
    try {
      if (frame.stage === 0) await prepareFog();
      if (disposed || workerFailure || generation !== workerGeneration) return;
      const timingKey = 'false:' + key;
      markScenePhase('compose-sent', timingKey, { stage: frame.stage });
      const response = await send({ kind: 'compose', key, frame });
      incoming = response;
      markScenePhase('compose-received', timingKey, {
        stage: frame.stage,
        ...response.snapshot.timings,
      });
      measureScenePhase(
        'compose-roundtrip',
        'issen:compose-sent:' + timingKey,
        'issen:compose-received:' + timingKey,
        timingKey,
      );
      if (generation !== workerGeneration) return;
      if (disposed || workerFailure || !desired || compositionKey(desired) !== key) {
        settle(key, false);
        return;
      }
      if (!response.ok) {
        failWorker(response.error || 'Scenery worker could not compose the selected scene');
        return;
      }
      if (!(await warmLayers(frame, response.layers, response.foreground))) {
        if (generation === workerGeneration) settle(key, false);
        return;
      }
      if (
        generation !== workerGeneration ||
        disposed ||
        !desired ||
        compositionKey(desired) !== key
      )
        return;
      release();
      layers = response.layers;
      foreground = response.foreground;
      completed = frame;
      if (!preparing && preparedStage !== frame.stage) {
        preparedStage = frame.stage;
        preparePending = undefined;
      }
      currentKey = key;
      snapshot = { ...response.snapshot, texturesWarmed: !!warmWorkerScene };
      accepted = true;
      settle(key, true);
    } catch (error) {
      if (generation === workerGeneration) {
        failWorker(String(error));
        settle(key, false);
      }
    } finally {
      if (incoming && !accepted) closeLayers([...incoming.layers, ...incoming.foreground]);
      if (generation === workerGeneration) {
        running = false;
        if (desired && compositionKey(desired) !== key) void pump();
      }
    }
  }
  function queue(frame: EnvironmentFrame) {
    if (
      !Number.isFinite(frame.width) ||
      !Number.isFinite(frame.height) ||
      frame.width <= 0 ||
      frame.height <= 0 ||
      !Number.isFinite(frame.dpr)
    )
      return false;
    if (disposed || workerFailure) return false;
    const nextKey = compositionKey(frame);
    desired = { ...frame };
    cancelUploads(nextKey);
    for (const key of waiters.keys()) if (key !== nextKey) settle(key, false);
    void pump();
    return true;
  }
  async function prepare(stage = 0): Promise<void> {
    imagePreload.cancel();
    if (disposed) return;
    if (preparePending && preparedStage === stage) return preparePending;
    preparedStage = stage;
    preparing = true;
    const generation = workerGeneration;
    const request = send({ kind: 'prepare', stage })
      .then(async (response) => {
        if (disposed || generation !== workerGeneration) return;
        if (!response.ok) {
          failWorker(response.error || 'Scenery worker could not prepare the selected scene');
          return;
        }
        if (!disposed && !running) snapshot = response.snapshot;
      })
      .finally(() => {
        if (preparePending === request) preparing = false;
      });
    preparePending = request;
    return preparePending;
  }
  async function compose(frame: EnvironmentFrame): Promise<boolean> {
    if (disposed || workerFailure) return false;
    const key = compositionKey(frame),
      generation = workerGeneration;
    if (key === currentKey) {
      queue(frame);
      try {
        return (await warmLayers(frame, layers, foreground)) && generation === workerGeneration;
      } catch (error) {
        if (generation === workerGeneration) failWorker(String(error));
        return false;
      }
    }
    const result = new Promise<boolean>((resolve) => {
      const group = waiters.get(key) ?? new Set();
      group.add(resolve);
      waiters.set(key, group);
    });
    if (!queue(frame)) settle(key, false);
    return await result;
  }
  function stamp(
    ctx: SceneDrawing,
    layer: ComposedLayer,
    x: number,
    y: number,
    width: number,
    height: number,
  ) {
    drawMaterialStamp(ctx, {
      texture: { source: layer.colour, revision: 0 },
      x,
      y,
      width,
      height,
      material: {
        normal: layer.normal ? { source: layer.normal, revision: 0 } : undefined,
        surface: layer.surface ? { source: layer.surface, revision: 0 } : undefined,
        emissive: layer.emissive ? { source: layer.emissive, revision: 0 } : undefined,
        surfaceCoverage: true,
        normalY: -1,
        lighting: 1,
        depth: 0,
        fog: 0,
        fogColor: [0, 0, 0],
      },
    });
  }
  const onVisibility = () => {
    if (!doc.hidden) void pump();
  };
  doc.addEventListener('visibilitychange', onVisibility);
  startWorker();
  return {
    prepare,
    compose,
    retry,
    draw(ctx: SceneDrawing, frame: EnvironmentFrame): boolean {
      if (disposed) return false;
      if (!queue(frame) || !layers.length || !completed) return false;
      ctx.save();
      try {
        const motion =
          frame.reducedMotion || frame.reducedFlashes || frame.lowQuality
            ? 0
            : Math.sin(frame.time * 0.12);
        layers.forEach((layer, index) =>
          stamp(
            ctx,
            layer,
            motion * (index === 1 ? 1.5 : index === 2 ? 3 : 0),
            0,
            frame.width,
            frame.height,
          ),
        );
        drawEnvironmentMotion(ctx, { ...frame, stage: completed.stage }, fog);
        return true;
      } finally {
        ctx.restore();
      }
    },
    drawForeground(ctx: SceneDrawing, frame: EnvironmentFrame): boolean {
      if (disposed) return false;
      if (frame.stage !== 4 || completed?.stage !== 4 || !foreground.length) return false;
      const edge = frame.width * (frame.height >= frame.width * 0.9 ? 0.2 : 0.24);
      const time = frame.reducedMotion || frame.reducedFlashes ? 0 : frame.time;
      ctx.save();
      try {
        foreground.forEach((layer, side) => {
          const outward = Math.sin(time * 0.48 + side * 1.4) * Math.min(frame.width * 0.002, 2);
          stamp(ctx, layer, side ? frame.width - edge + outward : -outward, 0, edge, frame.height);
        });
        return true;
      } finally {
        ctx.restore();
      }
    },
    get backend() {
      return snapshot.backend;
    },
    snapshot: () => ({
      ...snapshot,
      transferredBytes: composedLayerBytes([...layers, ...foreground]),
      imagePreload: imagePreload.snapshot(),
      worker: !!worker && !workerFailure && !disposed,
      pending: running,
      workerFailure,
      stage: completed?.stage,
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      imagePreload.dispose();
      cancelUploads();
      workerGeneration++;
      worker?.terminate();
      worker = undefined;
      doc.removeEventListener('visibilitychange', onVisibility);
      release();
      fogBindings.dispose();
      fogMaps.dispose();
      fog?.removeAttribute('src');
      for (const [id, request] of requests) {
        clearTimeout(request.timer);
        request.resolve({ id, ok: false, layers: [], foreground: [], snapshot: emptySnapshot() });
      }
      requests.clear();
      for (const key of waiters.keys()) settle(key, false);
      snapshot = emptySnapshot();
      desired = undefined;
    },
  };
}
