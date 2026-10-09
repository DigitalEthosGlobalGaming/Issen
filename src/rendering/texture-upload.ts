import type { SceneTexture, SceneMaterial } from './scene-frame.ts';

export interface TextureUpload {
  texture: SceneTexture;
  data?: boolean;
}
/** Use the same colour/data interpretation as material drawing. */
export function materialTextureUploads(
  texture: SceneTexture,
  material?: SceneMaterial | null,
): TextureUpload[] {
  const uploads: TextureUpload[] = [{ texture }];
  for (const kind of ['normal', 'surface', 'mask', 'emissive'] as const)
    if (material?.[kind]) uploads.push({ texture: material[kind], data: kind !== 'emissive' });
  return uploads;
}
export type WarmSceneTextures = (
  uploads: readonly TextureUpload[],
  signal: AbortSignal,
) => Promise<boolean>;

/** Yield between bounded batches; a native upload itself cannot be interrupted. */
export async function paceTextureUploads<T>(
  uploads: readonly T[],
  signal: AbortSignal,
  ports: {
    nextFrame(signal: AbortSignal): Promise<boolean>;
    ready(): boolean;
    generation(): number;
    upload(value: T): void;
    now(): number;
  },
  budget = 4,
): Promise<boolean> {
  let cursor = 0,
    generation = ports.generation();
  while (cursor < uploads.length) {
    if (signal.aborted || !(await ports.nextFrame(signal)) || signal.aborted) return false;
    if (!ports.ready()) continue;
    if (generation !== ports.generation()) {
      generation = ports.generation();
      cursor = 0;
    }
    const started = ports.now();
    do {
      if (signal.aborted || !ports.ready()) break;
      ports.upload(uploads[cursor++]!);
    } while (cursor < uploads.length && ports.now() - started < budget);
    if (generation !== ports.generation()) cursor = 0;
  }
  return !signal.aborted && ports.ready();
}

/** Hidden documents retain no animation-frame request; disposal cancels the wait. */
export function nextVisibleFrame(doc: Document, signal: AbortSignal): Promise<boolean> {
  if (signal.aborted || !doc.defaultView) return Promise.resolve(false);
  const win = doc.defaultView;
  return new Promise((resolve) => {
    let frame: number | undefined;
    const finish = (ready: boolean) => {
      if (frame !== undefined) win.cancelAnimationFrame(frame);
      doc.removeEventListener('visibilitychange', visibility);
      signal.removeEventListener('abort', abort);
      resolve(ready);
    };
    const schedule = () => {
      if (!doc.hidden && frame === undefined)
        frame = win.requestAnimationFrame(() => {
          frame = undefined;
          if (!doc.hidden) finish(true);
        });
    };
    const visibility = () => {
      if (doc.hidden && frame !== undefined) {
        win.cancelAnimationFrame(frame);
        frame = undefined;
      }
      schedule();
    };
    const abort = () => finish(false);
    doc.addEventListener('visibilitychange', visibility);
    signal.addEventListener('abort', abort, { once: true });
    schedule();
  });
}
