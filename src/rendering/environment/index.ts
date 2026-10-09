import { createWorkerEnvironmentRenderer } from './worker-renderer.ts';
import type { WorkerSceneOptions } from './worker-renderer.ts';
import type { WarmSceneTextures } from '../texture-upload.ts';
export type { EnvironmentFrame, EnvironmentBackend } from './local-renderer.ts';

/** Scenery always composes in its owned worker; failure requires explicit retry. */
export function createEnvironmentRenderer(
  doc: Document,
  options: WorkerSceneOptions & { warmWorkerScene?: WarmSceneTextures } = {},
) {
  return createWorkerEnvironmentRenderer(doc, options.warmWorkerScene, options);
}
