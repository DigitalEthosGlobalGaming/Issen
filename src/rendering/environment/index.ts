import { createLocalEnvironmentRenderer } from './local-renderer.ts';
import { createWorkerEnvironmentRenderer } from './worker-renderer.ts';
export type { EnvironmentFrame, EnvironmentBackend } from './local-renderer.ts';

/** Explicit document ownership; unsupported browsers retain the Canvas path. */
export function createEnvironmentRenderer(doc: Document, options: { worker?: boolean } = {}) {
  const createLocal = () => createLocalEnvironmentRenderer(doc);
  if (
    options.worker !== false &&
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined'
  ) {
    try {
      return createWorkerEnvironmentRenderer(doc, createLocal);
    } catch {
      /* Canvas composition remains available when worker creation is denied. */
    }
  }
  const local = createLocal();
  return {
    ...local,
    get backend() {
      return local.backend;
    },
    snapshot: () => ({
      ...local.snapshot(),
      worker: false,
      pending: false,
      workerFailure: undefined,
      stage: local.snapshot().backend === 'layered' ? local.snapshot().stage : undefined,
    }),
  };
}
