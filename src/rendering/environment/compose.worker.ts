import { createLocalEnvironmentRenderer } from './local-renderer.ts';
import { createWorkerDocument } from './worker-canvas.ts';
import { closeLayers } from './worker-types.ts';
import type { ComposedLayer, ComposeRequest, ComposeResponse } from './worker-types.ts';

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<ComposeRequest>) => void) | null;
  postMessage(message: ComposeResponse, transfer: Transferable[]): void;
};
const workerDocument = createWorkerDocument();
const renderer = createLocalEnvironmentRenderer(workerDocument);
let pending = Promise.resolve();
scope.onmessage = ({ data }) => {
  pending = pending.then(async () => {
    const layers: ComposedLayer[] = [],
      foreground: ComposedLayer[] = [];
    const started = performance.now();
    let assetsAt = started,
      composedAt = started;
    try {
      if (data.kind === 'prepare') {
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
        const completed = renderer.exportLayers();
        const transfer = async (entry: (typeof completed.layers)[number]) => {
          const copy = (
            source: HTMLCanvasElement | HTMLImageElement | ImageBitmap,
            colour = false,
          ) =>
            createImageBitmap(source, {
              premultiplyAlpha: colour ? 'premultiply' : 'none',
              colorSpaceConversion: 'none',
            });
          const layer: ComposedLayer = { colour: await copy(entry.colour, true) };
          try {
            for (const kind of ['normal', 'surface', 'emissive'] as const)
              if (entry.material?.[kind]) layer[kind] = await copy(entry.material[kind]!.source);
          } catch (error) {
            closeLayers([layer]);
            throw error;
          }
          return layer;
        };
        // Preserve ownership if any transfer fails: completed bitmaps are closed below.
        for (const entry of completed.layers) layers.push(await transfer(entry));
        for (const entry of completed.foreground) foreground.push(await transfer(entry));
      }
      const snapshot = {
        ...renderer.snapshot(),
        decodedBytes: workerDocument.decodedSnapshot().bytes,
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
