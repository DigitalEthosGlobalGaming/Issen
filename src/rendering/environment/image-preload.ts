import { observeAssetBackground } from '../../platform/asset-background.ts';
import { compositionKey, type CompositionIdentity } from './worker-types.ts';

type Preload = { ready: Promise<boolean>; release(): void; active?(): boolean };

/** Quiet-frame image leases are independent of the current composition target. */
export function createSceneImagePreload(
  doc: Document,
  current: () => CompositionIdentity | undefined,
  start: (stage: number, next: CompositionIdentity) => Preload | undefined,
  options: {
    retainReadyWhenBusy?: boolean;
    allowCurrentScene?: boolean;
    predict?: (
      current: CompositionIdentity,
      next?: Readonly<CompositionIdentity>,
    ) => { identity: Readonly<CompositionIdentity>; key: string } | undefined;
  } = {},
) {
  let key: string | undefined, lease: Preload | undefined;
  let status: 'none' | 'pending' | 'ready' | 'denied' = 'none';
  function cancel() {
    lease?.release();
    lease = undefined;
    key = undefined;
    status = 'none';
  }
  const stop = observeAssetBackground((stage, quiet, work, budget, _nextStage, next) => {
    if (lease?.active?.() === false) cancel();
    const active = current();
    const predicted = active && options.predict ? options.predict(active, next) : undefined;
    if (options.predict) next = predicted?.identity;
    if (
      doc.hidden ||
      ((!quiet || work > budget * 0.75) && !(options.retainReadyWhenBusy && status === 'ready')) ||
      !Number.isFinite(work) ||
      !Number.isFinite(budget) ||
      budget <= 0 ||
      !active ||
      active.stage !== stage ||
      !next ||
      next.width !== active.width ||
      next.height !== active.height ||
      next.dpr !== active.dpr ||
      next.lowQuality !== active.lowQuality ||
      !Number.isInteger(next.stage) ||
      next.stage < 0 ||
      next.stage > 8 ||
      (!options.allowCurrentScene && compositionKey(next) === compositionKey(active))
    ) {
      cancel();
      return;
    }
    const nextKey = predicted?.key ?? compositionKey(next);
    if (key === nextKey && (lease || status === 'ready')) return;
    cancel();
    key = nextKey;
    const incoming = start(next.stage, next);
    if (!incoming) {
      status = 'denied';
      return;
    }
    lease = incoming;
    status = 'pending';
    void incoming.ready.then(
      (ready) => {
        if (lease !== incoming) return;
        status = ready ? 'ready' : 'denied';
        if (!ready) {
          incoming.release();
          lease = undefined;
        }
      },
      () => {
        if (lease !== incoming) return;
        incoming.release();
        lease = undefined;
        status = 'denied';
      },
    );
  });
  const visibility = () => {
    if (doc.hidden) cancel();
  };
  doc.addEventListener('visibilitychange', visibility);
  return {
    consume(matchingKey: string) {
      if (key !== matchingKey || !lease) return false;
      lease = undefined;
      key = undefined;
      status = 'none';
      return true;
    },
    cancel,
    snapshot: () => ({ key, status }),
    dispose() {
      cancel();
      stop();
      doc.removeEventListener('visibilitychange', visibility);
    },
  };
}
