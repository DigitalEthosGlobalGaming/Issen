import { createLocalEnvironmentRenderer } from './local-renderer.ts';
import { createWorkerDocument } from './worker-canvas.ts';
import { copyComposedLayers, exportedLayerBytes } from './layer-transfer.ts';
import { closeLayers } from './worker-types.ts';
import { sceneImageUrls } from './asset-sources.ts';
import type { ComposedLayer, ComposeRequest, ComposeResponse } from './worker-types.ts';

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<ComposeRequest>) => void) | null;
  postMessage(message: ComposeResponse, transfer: Transferable[]): void;
};
let service:
  | {
      workerDocument: ReturnType<typeof createWorkerDocument>;
      renderer: ReturnType<typeof createLocalEnvironmentRenderer>;
    }
  | undefined;
function createService(decodedBudget?: number) {
  const workerDocument = createWorkerDocument(decodedBudget);
  return {
    workerDocument,
    renderer: createLocalEnvironmentRenderer(workerDocument, { liveMotion: false }),
  };
}
function observeDecodeProgress(
  workerDocument: ReturnType<typeof createWorkerDocument>,
  renderer: ReturnType<typeof createLocalEnvironmentRenderer>,
  data: Exclude<ComposeRequest, { kind: 'cancel' }>,
) {
  let previous = -1;
  return workerDocument.observeMemory(() => {
    const decodedLoader = workerDocument.decodedSnapshot();
    if (previous === decodedLoader.bytes) return;
    previous = decodedLoader.bytes;
    scope.postMessage(
      {
        id: data.id,
        ok: true,
        phase: 'decode-progress',
        key: data.kind === 'compose' ? data.key : undefined,
        layers: [],
        foreground: [],
        snapshot: {
          ...renderer.snapshot(),
          ...workerDocument.canvasSnapshot(),
          decodedLoader,
          exportBytes,
        },
      },
      [],
    );
  });
}
let exportBytes = 0;
let pending = Promise.resolve();
let imagePreload: ReturnType<ReturnType<typeof createWorkerDocument>['prefetchImages']>;
const queued = new Set<number>(),
  cancelled = new Set<number>();
scope.onmessage = ({ data }) => {
  if (data.kind === 'cancel') {
    if (queued.has(data.requestId)) cancelled.add(data.requestId);
    return;
  }
  const { workerDocument, renderer } = (service ??= createService(data.decodedBudget));
  // Cancellation and policy changes bypass the compose queue.
  imagePreload?.release();
  imagePreload = undefined;
  workerDocument.stopImagePreload();
  if (data.kind === 'preload') {
    const stopProgress = observeDecodeProgress(workerDocument, renderer, data);
    const lease =
      data.stage !== undefined && Number.isInteger(data.stage) && data.stage >= 0 && data.stage <= 8
        ? workerDocument.prefetchImages(sceneImageUrls(data.stage, false))
        : undefined;
    imagePreload = lease;
    void (lease?.ready ?? Promise.resolve(false)).then((ready) => {
      stopProgress();
      scope.postMessage(
        {
          id: data.id,
          ok: ready,
          layers: [],
          foreground: [],
          snapshot: {
            ...renderer.snapshot(),
            decodedLoader: workerDocument.decodedSnapshot(),
            ...workerDocument.canvasSnapshot(),
            exportBytes,
          },
        },
        [],
      );
    });
    return;
  }
  queued.add(data.id);
  pending = pending.then(async () => {
    const stopProgress = observeDecodeProgress(workerDocument, renderer, data);
    const layers: ComposedLayer[] = [],
      foreground: ComposedLayer[] = [];
    const started = performance.now();
    let assetsAt = started,
      composedAt = started;
    let exportedSnapshot: ReturnType<typeof renderer.snapshot> | undefined;
    try {
      if (cancelled.has(data.id))
        throw new DOMException('Scenery preparation cancelled', 'AbortError');
      if (data.kind === 'trim') {
        workerDocument.releaseUnusedImages();
      } else if (data.kind === 'prepare') {
        // An exported current scene owns its pixels; released inputs are not a
        // reason to invalidate its key. Changed compose keys reacquire normally.
        const current = renderer.snapshot();
        if (current.stage !== data.stage || current.backend !== 'layered')
          await renderer.prepare(data.stage);
        assetsAt = composedAt = performance.now();
      } else {
        // Keep reusable incoming pixels, but never overlap unrelated raw kits.
        workerDocument.releaseUnusedImages(0, sceneImageUrls(data.frame.stage, false));
        if (
          await renderer.compose(data.frame, () => {
            if (cancelled.has(data.id))
              throw new DOMException('Scenery preparation cancelled', 'AbortError');
            assetsAt = performance.now();
            scope.postMessage(
              {
                id: data.id,
                ok: true,
                key: data.key,
                phase: 'assets-ready',
                layers: [],
                foreground: [],
                snapshot: {
                  ...renderer.snapshot(),
                  ...workerDocument.canvasSnapshot(),
                  decodedLoader: workerDocument.decodedSnapshot(),
                },
              },
              [],
            );
          })
        ) {
          composedAt = performance.now();
          const completed = renderer.exportLayers();
          const entries = [...completed.layers, ...completed.foreground];
          exportBytes = exportedLayerBytes(entries);
          scope.postMessage(
            {
              id: data.id,
              ok: true,
              key: data.key,
              phase: 'composed',
              layers: [],
              foreground: [],
              snapshot: {
                ...renderer.snapshot(),
                ...workerDocument.canvasSnapshot(),
                decodedLoader: workerDocument.decodedSnapshot(),
                exportBytes,
              },
            },
            [],
          );
          // Live motion uses transferred planes and the main thread's own raw inputs.
          renderer.releaseExportInputs();
          const copied = await copyComposedLayers(entries);
          layers.push(...copied.slice(0, completed.layers.length));
          foreground.push(...copied.slice(completed.layers.length));
          exportedSnapshot = renderer.snapshot();
          // Independent copies now own these pixels. Retire worker output before
          // the receiver uploads it, rather than overlapping both representations.
          renderer.releaseExportLayers();
          // Raw inputs are unpinned. Retain only the caller's admitted cache
          // allowance; low-memory owners still release the complete raw kit.
          workerDocument.releaseUnusedImages(
            (data.decodedBudget ?? 0) > 256 * 1024 * 1024
              ? Math.max(0, Math.min(data.retainedBytes ?? 0, (data.decodedBudget ?? 0) / 2))
              : 0,
          );
          if (cancelled.has(data.id))
            throw new DOMException('Scenery preparation cancelled', 'AbortError');
        }
      }
      const snapshot = {
        ...(exportedSnapshot ?? renderer.snapshot()),
        ...workerDocument.canvasSnapshot(),
        exportBytes: 0,
        decodedBytes: workerDocument.decodedSnapshot().bytes,
        decodedLoader: workerDocument.decodedSnapshot(),
        timings: {
          assets: assetsAt - started,
          compose: composedAt - assetsAt,
          transfer: performance.now() - composedAt,
        },
      };
      const response: ComposeResponse = {
        id: data.id,
        ok:
          data.kind === 'trim' ||
          (snapshot.backend === 'layered' && (data.kind === 'prepare' || layers.length === 3)),
        key: data.kind === 'compose' ? data.key : undefined,
        layers,
        foreground,
        snapshot,
      };
      const bitmaps = [...layers, ...foreground].flatMap((layer) =>
        [layer.colour, layer.normal, layer.surface, layer.emissive].filter(
          (value): value is ImageBitmap => !!value,
        ),
      );
      scope.postMessage(response, bitmaps);
      exportBytes = 0;
    } catch (error) {
      closeLayers([...layers, ...foreground]);
      exportBytes = 0;
      if (cancelled.has(data.id)) {
        renderer.releaseExportInputs();
        workerDocument.releaseUnusedImages();
      }
      scope.postMessage(
        {
          id: data.id,
          ok: false,
          layers: [],
          foreground: [],
          snapshot: {
            ...renderer.snapshot(),
            ...workerDocument.canvasSnapshot(),
            decodedLoader: workerDocument.decodedSnapshot(),
          },
          error: String(error),
        },
        [],
      );
    } finally {
      exportBytes = 0;
      stopProgress();
      queued.delete(data.id);
      cancelled.delete(data.id);
    }
  });
};
