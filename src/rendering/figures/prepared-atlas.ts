import { createPbrAtlas, type PbrAtlasSources } from '../pbr-atlas.ts';
import type { SceneMaterial } from '../scene-frame.ts';
import { trackPixelSource } from '../../platform/pixel-memory.ts';
import { retireSceneTexture } from '../texture-revision.ts';
import { nextVisibleFrame, paceTextureUploads } from '../texture-upload.ts';

type Frame = readonly [number, number, number, number];
/** Low-memory figure inputs become finite aligned part planes, not a second atlas. */
export function createPreparedFigureAtlas(
  doc: Document,
  sources: PbrAtlasSources,
  width: number,
  height: number,
  frames: readonly Frame[],
  compact: boolean,
) {
  const atlas = createPbrAtlas(doc, sources, width, height);
  const parts = new Map<string, { colour: HTMLCanvasElement; material: SceneMaterial }>();
  const canvases: HTMLCanvasElement[] = [];
  const lifetime = new AbortController();
  let ready = false,
    pending: Promise<boolean> | undefined;
  function copy(source: CanvasImageSource, frame: Frame) {
    const canvas = trackPixelSource(doc, doc.createElement('canvas'), 'canvas');
    const ratio = 256 / Math.max(frame[2], frame[3]);
    canvas.width = Math.max(1, Math.round(frame[2] * ratio));
    canvas.height = Math.max(1, Math.round(frame[3] * ratio));
    canvases.push(canvas);
    canvas.getContext('2d')!.drawImage(source, ...frame, 0, 0, canvas.width, canvas.height);
    return canvas;
  }
  function prepare(): Promise<boolean> {
    if (lifetime.signal.aborted) return Promise.resolve(false);
    return (pending ??= (async () => {
      if (!(await atlas.prepare()) || lifetime.signal.aborted) return false;
      if (!compact) return (ready = true);
      const complete = await paceTextureUploads(frames, lifetime.signal, {
        nextFrame: (signal) => nextVisibleFrame(doc, signal),
        ready: () => !doc.hidden && !lifetime.signal.aborted,
        generation: () => 0,
        now: () => performance.now(),
        upload: (frame) => {
          const material = atlas.material(frame)!;
          const prepared = { ...material };
          for (const kind of ['normal', 'surface', 'emissive'] as const) {
            const input = material[kind];
            if (input) prepared[kind] = { source: copy(input.source, frame), revision: 0 };
          }
          parts.set(frame.join(','), { colour: copy(atlas.diffuse!, frame), material: prepared });
        },
      });
      if (!complete || lifetime.signal.aborted) return false;
      atlas.dispose();
      return (ready = true);
    })());
  }
  return {
    prepare,
    get ready() {
      return ready;
    },
    colour(frame: Frame) {
      if (!ready) return;
      const part = parts.get(frame.join(','));
      return part
        ? { source: part.colour, frame: [0, 0, part.colour.width, part.colour.height] as Frame }
        : atlas.diffuse
          ? { source: atlas.diffuse, frame }
          : undefined;
    },
    material(frame: Frame) {
      return ready ? (parts.get(frame.join(','))?.material ?? atlas.material(frame)) : null;
    },
    dispose() {
      lifetime.abort();
      ready = false;
      atlas.dispose();
      for (const canvas of canvases) {
        retireSceneTexture(canvas);
        canvas.width = canvas.height = 0;
      }
      canvases.length = 0;
      parts.clear();
    },
  };
}
