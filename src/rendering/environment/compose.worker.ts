import { createLocalEnvironmentRenderer } from './local-renderer.ts';
import { createWorkerDocument } from './worker-canvas.ts';
import { copyComposedLayers } from './layer-transfer.ts';
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
  return { workerDocument, renderer: createLocalEnvironmentRenderer(workerDocument) };
}
let pending = Promise.resolve();
let imagePreload: ReturnType<ReturnType<typeof createWorkerDocument>['prefetchImages']>;
scope.onmessage = ({ data }) => {
  const { workerDocument, renderer } = (service ??= createService(data.decodedBudget));
  // Cancellation and policy changes bypass the compose queue.
  imagePreload?.release();
  imagePreload = undefined;
  workerDocument.stopImagePreload();
  if (data.kind === 'preload') {
    const lease =
      data.stage !== undefined && Number.isInteger(data.stage) && data.stage >= 0 && data.stage <= 8
        ? workerDocument.prefetchImages(sceneImageUrls(data.stage))
        : undefined;
    imagePreload = lease;
    void (lease?.ready ?? Promise.resolve(false)).then((ready) => {
      scope.postMessage(
        {
          id: data.id,
          ok: ready,
          layers: [],
          foreground: [],
          snapshot: { ...renderer.snapshot(), decodedLoader: workerDocument.decodedSnapshot() },
        },
        [],
      );
    });
    return;
  }
  pending = pending.then(async () => {
    const layers: ComposedLayer[] = [],
      foreground: ComposedLayer[] = [];
    const started = performance.now();
    let assetsAt = started,
      composedAt = started;
    try {
      if (data.kind === 'prepare') {
        // An exported current scene owns its pixels; released inputs are not a
        // reason to invalidate its key. Changed compose keys reacquire normally.
        const current = renderer.snapshot();
        if (current.stage !== data.stage || current.backend !== 'layered')
          await renderer.prepare(data.stage);
        assetsAt = composedAt = performance.now();
      } else if (
        await renderer.compose(data.frame, () => {
          assetsAt = performance.now();
          scope.postMessage(
            {
              id: data.id,
              ok: true,
              key: data.key,
              phase: 'assets-ready',
              layers: [],
              foreground: [],
              snapshot: renderer.snapshot(),
            },
            [],
          );
        })
      ) {
        composedAt = performance.now();
        // Live motion uses transferred planes and the main thread's own raw inputs.
        renderer.releaseExportInputs();
        const completed = renderer.exportLayers();
        const copied = await copyComposedLayers([...completed.layers, ...completed.foreground]);
        layers.push(...copied.slice(0, completed.layers.length));
        foreground.push(...copied.slice(completed.layers.length));
      }
      const snapshot = {
        ...renderer.snapshot(),
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
        ok: snapshot.backend === 'layered' && (data.kind === 'prepare' || layers.length === 3),
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
    } catch (error) {
      closeLayers([...layers, ...foreground]);
      scope.postMessage(
        {
          id: data.id,
          ok: false,
          layers: [],
          foreground: [],
          snapshot: renderer.snapshot(),
          error: String(error),
        },
        [],
      );
    }
  });
};
