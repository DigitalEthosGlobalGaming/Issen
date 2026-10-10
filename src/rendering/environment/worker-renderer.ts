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
import {
  reclaimSceneMemory,
  reclaimBackgroundSceneMemory,
  registerSceneMemory,
  documentSceneMemory,
} from '../../platform/scene-memory.ts';
import { scenePreparationBytes } from './scene-admission.ts';
import { retireSceneTexture } from '../texture-revision.ts';
import { releaseSceneryCutouts } from './scene-kit.ts';
import type {
  ComposedLayer,
  ComposeRequest,
  ComposeResponse,
  EnvironmentSnapshot,
} from './worker-types.ts';

const FOG_URL = new URL('./assets/fog-wisps-atlas.webp', import.meta.url).href;
export type WorkerSceneOptions = {
  ownsUploadReservation?: boolean;
  retainWorkerSources?: (sources: Iterable<TextureUpload['texture']['source']>) => () => void;
};
type NextSlot = {
  key: string;
  frame: EnvironmentFrame;
  controller: AbortController;
  response?: ComposeResponse;
  ready: Promise<boolean>;
  reservedBytes: number;
  fogReservedBytes?: number;
  releaseSources?: () => void;
  foreground: boolean;
  adopted: boolean;
  finished: boolean;
  requestId?: number;
};
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
  options: WorkerSceneOptions = {},
) {
  let worker: Worker | undefined;
  let workerGeneration = 0;
  const fogMaps = createAssetMaterials<string>(doc, { fog: FOG_URL });
  const fogBindings = createCachedMaterials();
  let fog: HTMLImageElement | undefined;
  let fogPending: Promise<void> | undefined;
  let disposed = false,
    running = false;
  let suspended = false,
    fogGeneration = 0;
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
  let workerResources: Pick<
    EnvironmentSnapshot,
    'decodedLoader' | 'canvasBytes' | 'canvases' | 'exportBytes'
  > = {};
  let resourceRequestId = 0;
  let cacheTrim: Promise<ComposeResponse> | undefined;
  let cacheTrimStage: number | undefined;
  const nextSlots = new Set<NextSlot>();
  const incomingResponses = new Set<ComposeResponse>();
  let nextSlot: NextSlot | undefined,
    backgroundPending = false,
    admissionAt = 0;
  let promotions = 0;
  const failureListeners = new Set<() => void>();
  const requests = new Map<
    number,
    {
      resolve: (response: ComposeResponse) => void;
      timer: ReturnType<typeof setTimeout>;
      timingPrefix: string;
    }
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
    (_stage, next) => startNext(next),
    { retainReadyWhenBusy: true },
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
  function releaseOutgoingMaterials() {
    for (const layer of [...layers, ...foreground])
      for (const kind of ['normal', 'surface', 'emissive'] as const) {
        const source = layer[kind];
        if (!source) continue;
        retireSceneTexture(source);
        source.close();
        delete layer[kind];
      }
    // Retain outgoing colour for responsive loading. Returning to this identity
    // must compose its full material planes again before scene readiness.
    currentKey = '';
  }
  function failWorker(reason: string) {
    if (disposed || workerFailure) return;
    workerFailure = reason;
    workerGeneration++;
    running = preparing = false;
    imagePreload.cancel();
    cancelNext();
    cancelUploads();
    worker?.terminate();
    worker = undefined;
    release();
    snapshot = { ...emptySnapshot(), backend: 'unavailable', texturesWarmed: false };
    workerResources = {};
    for (const [id, request] of requests) {
      clearTimeout(request.timer);
      request.resolve({ id, ok: false, layers: [], foreground: [], snapshot: emptySnapshot() });
    }
    requests.clear();
    for (const key of waiters.keys()) settle(key, false);
    for (const listener of failureListeners) listener();
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
        const request = requests.get(data.id);
        if (!request) {
          closeLayers([...data.layers, ...data.foreground]);
          return;
        }
        resourceRequestId = data.id;
        workerResources = {
          decodedLoader: data.snapshot.decodedLoader,
          canvasBytes: data.snapshot.canvasBytes,
          canvases: data.snapshot.canvases,
          exportBytes: data.snapshot.exportBytes,
        };
        if (data.phase) {
          if (data.phase === 'decode-progress') {
            reclaimSceneMemory(doc);
            return;
          }
          if (data.phase === 'assets-ready')
            markScenePhase('assets-ready', request.timingPrefix + data.key);
          else markScenePhase('composed', request.timingPrefix + data.key);
          return;
        }
        clearTimeout(request.timer);
        requests.delete(data.id);
        if (data.layers.length || data.foreground.length) incomingResponses.add(data);
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
    if (!workerFailure) return suspended ? resume() : !!worker;
    workerFailure = undefined;
    preparedStage = -1;
    preparePending = undefined;
    snapshot = emptySnapshot();
    suspended = false;
    return startWorker();
  }
  function suspend() {
    if (disposed || suspended) return;
    suspended = true;
    workerGeneration++;
    imagePreload.cancel();
    cancelNext();
    cancelUploads();
    worker?.terminate();
    worker = undefined;
    desired = undefined;
    running = preparing = false;
    backgroundPending = false;
    preparedStage = -1;
    preparePending = undefined;
    release();
    for (const request of requests.values()) {
      clearTimeout(request.timer);
      request.resolve({ id: 0, ok: false, layers: [], foreground: [], snapshot: emptySnapshot() });
    }
    requests.clear();
    for (const key of waiters.keys()) settle(key, false);
    releaseFog();
    snapshot = emptySnapshot();
    workerResources = {};
  }
  function releaseFog() {
    fogGeneration++;
    fogBindings.releaseSources();
    fogMaps.select({});
    if (fog) {
      releaseSceneryCutouts([fog]);
      retireSceneTexture(fog);
      fog.removeAttribute('src');
    }
    fog = undefined;
    fogPending = undefined;
  }
  function trimFog() {
    if (completed?.stage !== 0 && desired?.stage !== 0 && nextSlot?.frame.stage !== 0) releaseFog();
  }
  function resume() {
    if (!suspended) return true;
    if (disposed || workerFailure) return false;
    suspended = false;
    return startWorker();
  }
  function send(
    request:
      | Omit<Extract<ComposeRequest, { kind: 'prepare' }>, 'id'>
      | Omit<Extract<ComposeRequest, { kind: 'compose' }>, 'id'>
      | Omit<Extract<ComposeRequest, { kind: 'trim' }>, 'id'>
      | Omit<Extract<ComposeRequest, { kind: 'preload' }>, 'id'>,
    timingPrefix = 'false:',
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
      requests.set(id, { resolve, timer, timingPrefix });
      try {
        const decodedBudget = documentImageBudget(doc);
        const memory = documentSceneMemory(doc);
        // Foreground raw inputs already belong to its preparation peak. Bound
        // retention by current non-worker backing; the upload gate reclaims if
        // its actual response plus GPU backing needs that room. Next slots keep
        // zero raw cache so figure warming can use their reserved headroom.
        const retainedBytes =
          request.kind === 'compose' &&
          !timingPrefix.startsWith('next:') &&
          decodedBudget > 256 * 1024 * 1024
            ? Math.max(
                0,
                Math.min(
                  decodedBudget / 2,
                  memory.budget -
                    memory.committedBytes +
                    (workerResources.decodedLoader?.bytes ?? 0),
                ),
              )
            : 0;
        worker!.postMessage({ ...request, id, decodedBudget, retainedBytes });
      } catch (error) {
        failWorker(String(error));
      }
    });
  }
  function trimWorkerCache(stage?: number): Promise<ComposeResponse> {
    // A pressure trim and an incoming-source trim have different keep sets.
    // Complete the existing operation before issuing the requested policy.
    if (cacheTrim)
      return cacheTrimStage === stage ? cacheTrim : cacheTrim.then(() => trimWorkerCache(stage));
    cacheTrimStage = stage;
    return (cacheTrim = send({ kind: 'trim', stage }).finally(() => {
      cacheTrim = undefined;
    }));
  }
  function prepareFog(): Promise<void> {
    return (fogPending ??= (async () => {
      const generation = fogGeneration;
      const image = trackPixelSource(doc, doc.createElement('img'), 'decoded');
      fog = image;
      fogMaps.select({ fog: FOG_URL });
      image.src = FOG_URL;
      try {
        await Promise.all([image.decode(), fogMaps.prepare()]);
        if (!disposed && generation === fogGeneration && fogMaps.ready('fog'))
          fogBindings.bind(image, (frame) => fogMaps.material('fog', frame));
      } catch {
        /* Keep the unavailable-image path visible through the scene owner. */
      } finally {
        if (disposed || generation !== fogGeneration) {
          retireSceneTexture(image);
          image.removeAttribute('src');
        }
      }
    })());
  }
  async function warmLayers(
    frame: EnvironmentFrame,
    nextLayers: readonly ComposedLayer[],
    nextForeground: readonly ComposedLayer[],
    slot?: NextSlot,
  ): Promise<boolean> {
    if (!warmWorkerScene) return true;
    const key = compositionKey(frame),
      controller = slot?.controller ?? new AbortController();
    if (!slot) uploads.set(controller, key);
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
    if (slot && !slot.releaseSources)
      slot.releaseSources = options.retainWorkerSources?.(
        sources.map((upload) => upload.texture.source),
      );
    const timingKey = (slot ? 'next:' : 'false:') + key;
    markScenePhase('texture-warm-start', timingKey);
    try {
      if (slot && options.ownsUploadReservation) slot.reservedBytes = 0;
      const ready = await warmWorkerScene(sources, controller.signal);
      if (
        controller.signal.aborted ||
        disposed ||
        (slot ? nextSlot !== slot : !desired || compositionKey(desired) !== key)
      )
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
  function closeNext(slot: NextSlot) {
    slot.releaseSources?.();
    slot.releaseSources = undefined;
    if (slot.response && !slot.adopted)
      closeLayers([...slot.response.layers, ...slot.response.foreground]);
    nextSlots.delete(slot);
    if (nextSlot === slot) nextSlot = undefined;
    trimFog();
  }
  function cancelNext() {
    const slot = nextSlot;
    if (!slot) return;
    nextSlot = undefined;
    slot.controller.abort();
    if (!slot.requestId) {
      // Only fog decoding can have started before transport. The aborted
      // continuation cannot compose or upload, so keep its unfinished input
      // allowance without retaining storage for work which will never start.
      slot.reservedBytes = Math.min(slot.reservedBytes, (slot.fogReservedBytes ?? 0) / 2);
    }
    trimFog();
    if (slot.requestId && requests.has(slot.requestId))
      try {
        worker?.postMessage({ kind: 'cancel', id: ++sequence, requestId: slot.requestId });
      } catch {
        /* The pending transport will report its failure. */
      }
    if (slot.finished) closeNext(slot);
  }
  function startNext(next: import('./worker-types.ts').CompositionIdentity) {
    if (
      backgroundPending ||
      !completed ||
      !warmWorkerScene ||
      !options.retainWorkerSources ||
      performance.now() < admissionAt
    )
      return;
    const preparationBytes = scenePreparationBytes(next, documentImageBudget(doc));
    const estimate =
      preparationBytes === undefined
        ? undefined
        : preparationBytes + (next.stage === 0 && !fog?.naturalWidth ? 8 * 1774 * 887 * 4 : 0);
    const memory =
      estimate === undefined
        ? documentSceneMemory(doc)
        : reclaimBackgroundSceneMemory(doc, estimate);
    if (estimate === undefined || memory.committedBytes + estimate > memory.backgroundBudget) {
      if (workerResources.decodedLoader?.bytes && !workerResources.decodedLoader.pinned)
        void trimWorkerCache();
      admissionAt = performance.now() + 250;
      return;
    }
    const frame: EnvironmentFrame = { ...completed, ...next, time: 0 };
    const generation = workerGeneration;
    const slot: NextSlot = {
      key: compositionKey(frame),
      frame,
      controller: new AbortController(),
      ready: Promise.resolve(false),
      reservedBytes: estimate,
      fogReservedBytes: estimate - preparationBytes!,
      foreground: false,
      adopted: false,
      finished: false,
    };
    nextSlot = slot;
    nextSlots.add(slot);
    backgroundPending = true;
    slot.ready = (async () => {
      let accepted = false;
      try {
        if (frame.stage === 0) await prepareFog();
        if (slot.controller.signal.aborted || generation !== workerGeneration) return false;
        const timingKey = 'next:' + slot.key;
        markScenePhase('compose-sent', timingKey, { stage: frame.stage, background: true });
        slot.requestId = sequence + 1;
        const response = await send({ kind: 'compose', key: slot.key, frame }, 'next:');
        markScenePhase('compose-received', timingKey, {
          stage: frame.stage,
          ...response.snapshot.timings,
          background: true,
        });
        measureScenePhase(
          'compose-roundtrip',
          'issen:compose-sent:' + timingKey,
          'issen:compose-received:' + timingKey,
          timingKey,
        );
        slot.response = response;
        incomingResponses.delete(response);
        // Worker inputs are released before this response; reserve the remaining GPU upload.
        slot.reservedBytes = composedLayerBytes([...response.layers, ...response.foreground]);
        slot.fogReservedBytes = 0;
        if (
          slot.controller.signal.aborted ||
          generation !== workerGeneration ||
          nextSlot !== slot ||
          !response.ok
        )
          return false;
        if (!(await warmLayers(frame, response.layers, response.foreground, slot))) return false;
        if (slot.controller.signal.aborted || generation !== workerGeneration || nextSlot !== slot)
          return false;
        slot.reservedBytes = 0;
        accepted = true;
        return true;
      } catch (error) {
        if (!slot.controller.signal.aborted && generation === workerGeneration)
          failWorker(String(error));
        return false;
      } finally {
        slot.finished = true;
        if (generation === workerGeneration) backgroundPending = false;
        if (!accepted) closeNext(slot);
      }
    })();
    let memoryCheckAt = 0;
    return {
      ready: slot.ready,
      release: () => {
        if (!slot.adopted && nextSlot === slot) cancelNext();
      },
      active: () => {
        if (nextSlot !== slot || slot.controller.signal.aborted) return false;
        if (slot.foreground || performance.now() < memoryCheckAt) return true;
        memoryCheckAt = performance.now() + 250;
        const current = documentSceneMemory(doc);
        return current.committedBytes <= current.backgroundBudget;
      },
    };
  }
  async function pump() {
    if (running || disposed || workerFailure || doc.hidden || !desired) return;
    const frame = { ...desired },
      key = compositionKey(frame),
      generation = workerGeneration;
    if (key === currentKey) return;
    const prepared = nextSlot?.key === key ? nextSlot : undefined;
    if (prepared) {
      prepared.foreground = true;
      imagePreload.consume(key);
    } else {
      imagePreload.cancel();
      cancelNext();
    }
    running = true;
    snapshot.backend = 'loading';
    let incoming: ComposeResponse | undefined,
      accepted = false;
    const obsolete = () =>
      disposed ||
      workerFailure ||
      generation !== workerGeneration ||
      !desired ||
      compositionKey(desired) !== key;
    try {
      if (!prepared) {
        const estimate = scenePreparationBytes(frame, documentImageBudget(doc));
        if (estimate !== undefined) {
          if (workerResources.decodedLoader?.bytes) await trimWorkerCache(frame.stage);
          if (obsolete()) return;
          // Acknowledged remaining inputs now all belong to this incoming kit.
          const sharedBytes = workerResources.decodedLoader?.bytes ?? 0;
          const incomingBytes =
            Math.max(0, estimate - sharedBytes) +
            (frame.stage === 0 && !fog?.naturalWidth ? 8 * 1774 * 887 * 4 : 0);
          let pressure = reclaimSceneMemory(doc, incomingBytes);
          if (
            pressure.committedBytes + incomingBytes > pressure.budget &&
            workerResources.decodedLoader?.bytes
          ) {
            await trimWorkerCache();
            if (obsolete()) return;
            pressure = reclaimSceneMemory(doc, incomingBytes);
          }
          if (pressure.committedBytes + incomingBytes > pressure.budget) releaseOutgoingMaterials();
        }
      }
      if (frame.stage === 0) await prepareFog();
      if (obsolete()) return;
      const timingKey = 'false:' + key;
      const promoted = prepared && (await prepared.ready);
      if (obsolete()) return;
      markScenePhase('compose-sent', timingKey, { stage: frame.stage });
      const response = promoted ? prepared.response! : await send({ kind: 'compose', key, frame });
      incoming = response;
      incomingResponses.add(response);
      if (promoted) {
        prepared.adopted = true;
        closeNext(prepared);
      }
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
      const uploadBytes =
        composedLayerBytes([...response.layers, ...response.foreground]) +
        (frame.stage === 0 && fog?.naturalWidth ? 4 * fog.naturalWidth * fog.naturalHeight * 4 : 0);
      let pressure = reclaimSceneMemory(doc, uploadBytes);
      if (
        pressure.committedBytes + uploadBytes > pressure.budget &&
        workerResources.decodedLoader?.bytes
      ) {
        await trimWorkerCache();
        pressure = reclaimSceneMemory(doc, uploadBytes);
      }
      if (!promoted && pressure.committedBytes + uploadBytes > pressure.budget)
        releaseOutgoingMaterials();
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
      trimFog();
      accepted = true;
      if (promoted) promotions++;
      settle(key, true);
    } catch (error) {
      if (generation === workerGeneration) {
        failWorker(String(error));
        settle(key, false);
      }
    } finally {
      if (incoming && !accepted) closeLayers([...incoming.layers, ...incoming.foreground]);
      if (incoming) incomingResponses.delete(incoming);
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
    if (disposed || workerFailure || !resume()) return false;
    const nextKey = compositionKey(frame);
    desired = { ...frame };
    if (nextKey !== currentKey && nextSlot?.key !== nextKey) {
      imagePreload.cancel();
      cancelNext();
    }
    cancelUploads(nextKey);
    for (const key of waiters.keys()) if (key !== nextKey) settle(key, false);
    void pump();
    return true;
  }
  async function prepare(stage = 0): Promise<void> {
    imagePreload.cancel();
    if (disposed || !resume()) return;
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
  const onContextLost = () => {
    imagePreload.cancel();
    cancelNext();
  };
  doc.addEventListener('visibilitychange', onVisibility);
  doc.addEventListener('webglcontextlost', onContextLost, true);
  const owner = {
    prepare,
    compose,
    retry,
    suspend,
    observeFailure(listener: () => void) {
      failureListeners.add(listener);
      return () => {
        failureListeners.delete(listener);
      };
    },
    get memorySnapshot() {
      return {
        decodedBytes: workerResources.decodedLoader?.bytes ?? 0,
        canvasBytes: workerResources.canvasBytes ?? 0,
        transferredBytes:
          composedLayerBytes([...layers, ...foreground]) +
          [...nextSlots].reduce(
            (bytes, slot) =>
              bytes +
              (slot.response && !slot.adopted
                ? composedLayerBytes([...slot.response.layers, ...slot.response.foreground])
                : 0),
            0,
          ) +
          [...incomingResponses].reduce(
            (bytes, response) =>
              bytes + composedLayerBytes([...response.layers, ...response.foreground]),
            0,
          ),
        reservedBytes:
          (workerResources.exportBytes ?? 0) +
          [...nextSlots].reduce(
            (bytes, slot) =>
              bytes +
              Math.max(
                0,
                slot.reservedBytes -
                  // Newly decoded fog is already counted in the main pixel registry.
                  Math.min(
                    (slot.fogReservedBytes ?? 0) / 2,
                    (fog ? fog.naturalWidth * fog.naturalHeight * 4 : 0) + fogMaps.decodedBytes,
                  ) -
                  (!slot.response && slot.requestId === resourceRequestId
                    ? (workerResources.decodedLoader?.bytes ?? 0) +
                      (workerResources.canvasBytes ?? 0) +
                      (workerResources.exportBytes ?? 0)
                    : 0),
              ),
            0,
          ),
      };
    },
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
      ...workerResources,
      nextScene: {
        key: nextSlot?.key,
        ready: !!nextSlot?.finished,
        bytes: nextSlot?.response
          ? composedLayerBytes([...nextSlot.response.layers, ...nextSlot.response.foreground])
          : 0,
        reservedBytes: [...nextSlots].reduce((bytes, slot) => bytes + slot.reservedBytes, 0),
        promotions,
      },
      transferredBytes: composedLayerBytes([...layers, ...foreground]),
      imagePreload: imagePreload.snapshot(),
      worker: !!worker && !workerFailure && !disposed,
      suspended,
      pending: running,
      workerFailure,
      stage: completed?.stage,
    }),
    dispose() {
      if (disposed) return;
      suspend();
      disposed = true;
      imagePreload.dispose();
      cancelNext();
      cancelUploads();
      workerGeneration++;
      worker?.terminate();
      worker = undefined;
      doc.removeEventListener('visibilitychange', onVisibility);
      doc.removeEventListener('webglcontextlost', onContextLost, true);
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
      workerResources = {};
      failureListeners.clear();
      desired = undefined;
    },
  };
  registerSceneMemory(doc, owner);
  startWorker();
  return owner;
}
