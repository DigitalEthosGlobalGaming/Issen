import { createLocalEnvironmentRenderer } from '../../../src/rendering/environment/local-renderer.ts';
import { createWorkerDocument } from '../../../src/rendering/environment/worker-canvas.ts';
import { copyComposedLayers } from '../../../src/rendering/environment/layer-transfer.ts';
import { closeLayers } from '../../../src/rendering/environment/worker-types.ts';
import { sceneImageUrls } from '../../../src/rendering/environment/asset-sources.ts';
import type {
  ComposedLayer,
  ComposeRequest,
  ComposeResponse,
} from '../../../src/rendering/environment/worker-types.ts';

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<ComposeRequest>) => void) | null;
  postMessage(message: ComposeResponse, transfer: Transferable[]): void;
};
const workerDocument = createWorkerDocument();
// Compare only the material bake backend. Match production's static scenery and
// exported resource lifetime so reused native canvases do not change sampling.
const renderer = createLocalEnvironmentRenderer(workerDocument, {
  gpuComposedLayers: false,
  liveMotion: false,
});
let pending = Promise.resolve();
let imagePreload: ReturnType<typeof workerDocument.prefetchImages>;
scope.onmessage = ({ data }) => {
  // Cancellation and policy changes bypass the compose queue.
  imagePreload?.release();
  imagePreload = undefined;
  workerDocument.stopImagePreload();
  if (data.kind === 'preload') {
    const lease =
      data.stage !== undefined && Number.isInteger(data.stage) && data.stage >= 0 && data.stage <= 8
        ? workerDocument.prefetchImages(sceneImageUrls(data.stage, false))
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
    let exportedSnapshot: ReturnType<typeof renderer.snapshot> | undefined;
    try {
      if (data.kind === 'trim') {
        workerDocument.releaseUnusedImages();
      } else if (data.kind === 'prepare') {
        await renderer.prepare(data.stage);
        assetsAt = composedAt = performance.now();
      } else if (
        (workerDocument.releaseUnusedImages(0, sceneImageUrls(data.frame.stage, false)),
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
        }))
      ) {
        composedAt = performance.now();
        // Live motion uses transferred planes and the main thread's own raw inputs.
        renderer.releaseExportInputs();
        const completed = renderer.exportLayers();
        const copied = await copyComposedLayers([...completed.layers, ...completed.foreground]);
        layers.push(...copied.slice(0, completed.layers.length));
        foreground.push(...copied.slice(completed.layers.length));
        exportedSnapshot = renderer.snapshot();
        renderer.releaseExportLayers();
        workerDocument.releaseUnusedImages(data.retainedBytes ?? 0);
      }
      const snapshot = {
        ...(exportedSnapshot ?? renderer.snapshot()),
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
