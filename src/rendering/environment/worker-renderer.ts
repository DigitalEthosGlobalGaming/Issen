import type { SceneDrawing } from '../scene-drawing.ts';
import type { EnvironmentFrame, createLocalEnvironmentRenderer } from './local-renderer.ts';
import { packedScenery, sceneryAtlas, type SceneryLease } from './packed-scenery.ts';
import type { PackedSceneryAtlas } from './packed-scene-atlas.ts';
import { createCachedMaterials } from '../cached-materials.ts';
import { drawMaterialStamp } from '../scene-material.ts';
import { drawEnvironmentMotion } from './motion.ts';
import { closeLayers, compositionKey } from './worker-types.ts';
import type {
  ComposedLayer,
  ComposeRequest,
  ComposeResponse,
  EnvironmentSnapshot,
} from './worker-types.ts';

type LocalRenderer = ReturnType<typeof createLocalEnvironmentRenderer>;
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
export function createWorkerEnvironmentRenderer(doc: Document, createLocal: () => LocalRenderer) {
  const worker = new Worker(new URL('./compose.worker.ts', import.meta.url), {
    type: 'module',
    name: 'issen-scenery',
  });
  let fogLease: SceneryLease | undefined;
  const fogBindings = createCachedMaterials();
  let fog: PackedSceneryAtlas | undefined;
  let fogPending: Promise<void> | undefined;
  let fallback: LocalRenderer | undefined;
  const getFallback = () => fallback;
  let disposed = false,
    running = false;
  let sequence = 0,
    preparedStage = -1;
  let preparePending: Promise<void> | undefined;
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
    if (disposed || fallback) return;
    workerFailure = reason;
    worker.terminate();
    release();
    fallback = createLocal();
    for (const [id, request] of requests) {
      clearTimeout(request.timer);
      request.resolve({ id, ok: false, layers: [], foreground: [], snapshot: emptySnapshot() });
    }
    requests.clear();
    for (const key of waiters.keys()) settle(key, false);
  }
  worker.addEventListener('error', (event) => {
    event.preventDefault();
    failWorker(event.message || 'Scenery worker failed');
  });
  worker.addEventListener('message', ({ data }: MessageEvent<ComposeResponse>) => {
    const request = requests.get(data.id);
    if (!request) {
      closeLayers([...data.layers, ...data.foreground]);
      return;
    }
    clearTimeout(request.timer);
    requests.delete(data.id);
    request.resolve(data);
  });
  function send(
    request:
      | Omit<Extract<ComposeRequest, { kind: 'prepare' }>, 'id'>
      | Omit<Extract<ComposeRequest, { kind: 'compose' }>, 'id'>,
  ) {
    return new Promise<ComposeResponse>((resolve) => {
      const id = ++sequence;
      const timer = setTimeout(() => failWorker('Scenery worker timed out'), 45000);
      requests.set(id, { resolve, timer });
      try {
        worker.postMessage({ ...request, id });
      } catch (error) {
        failWorker(String(error));
      }
    });
  }
  function prepareFog(): Promise<void> {
    return (fogPending ??= (async () => {
      const lease = packedScenery(doc).acquireGroup('fog');
      fogLease = lease;
      try {
        await lease.ready;
        if (!disposed) fog = sceneryAtlas('fog-wisps-atlas', lease, fogBindings);
      } catch {
        lease.release();
      }
    })());
  }

  async function pump() {
    if (running || disposed || fallback || doc.hidden || !desired) return;
    const frame = { ...desired },
      key = compositionKey(frame);
    if (key === currentKey) return;
    running = true;
    snapshot.backend = 'loading';
    try {
      if (frame.stage === 0) await prepareFog();
      if (disposed || fallback) return;
      const response = await send({ kind: 'compose', key, frame });
      if (disposed || fallback || !desired || compositionKey(desired) !== key) {
        closeLayers([...response.layers, ...response.foreground]);
        settle(key, false);
        return;
      }
      if (!response.ok) {
        closeLayers([...response.layers, ...response.foreground]);
        failWorker(response.error || 'Scenery worker could not compose the selected scene');
        return;
      }
      release();
      layers = response.layers;
      foreground = response.foreground;
      completed = frame;
      currentKey = key;
      snapshot = response.snapshot;
      settle(key, true);
    } catch (error) {
      failWorker(String(error));
      settle(key, false);
    } finally {
      running = false;
      if (desired && compositionKey(desired) !== key) void pump();
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
    const nextKey = compositionKey(frame);
    desired = { ...frame };
    for (const key of waiters.keys()) if (key !== nextKey) settle(key, false);
    void pump();
    return true;
  }
  async function prepare(stage = 0): Promise<void> {
    if (disposed) return;
    if (fallback) return fallback.prepare(stage);
    if (preparePending && preparedStage === stage) return preparePending;
    preparedStage = stage;
    preparePending = send({ kind: 'prepare', stage }).then(async (response) => {
      if (fallback) return fallback.prepare(stage);
      if (!disposed && !running) snapshot = response.snapshot;
    });
    return preparePending;
  }
  async function compose(frame: EnvironmentFrame): Promise<boolean> {
    if (disposed) return false;
    if (fallback) return fallback.compose(frame);
    const key = compositionKey(frame);
    if (key === currentKey) return true;
    const result = new Promise<boolean>((resolve) => {
      const group = waiters.get(key) ?? new Set();
      group.add(resolve);
      waiters.set(key, group);
    });
    if (!queue(frame)) settle(key, false);
    const ready = await result;
    const local = getFallback();
    return local && !disposed ? local.compose(frame) : ready;
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
  return {
    prepare,
    compose,
    draw(ctx: SceneDrawing, frame: EnvironmentFrame): boolean {
      if (disposed) return false;
      if (fallback) return fallback.draw(ctx, frame);
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
      if (fallback) return fallback.drawForeground(ctx, frame);
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
      return fallback?.backend ?? snapshot.backend;
    },
    snapshot: () => ({
      ...(fallback?.snapshot() ?? snapshot),
      worker: !fallback && !disposed,
      pending: running,
      workerFailure,
      stage: fallback?.snapshot().stage ?? completed?.stage,
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      worker.terminate();
      fallback?.dispose();
      doc.removeEventListener('visibilitychange', onVisibility);
      release();
      fogBindings.dispose();
      fogLease?.release();
      fog = undefined;
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
