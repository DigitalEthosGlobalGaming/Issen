import { runtimeAssets } from './runtime-assets.ts';
import { createAssetPrefetch, createCompressedAssetStore } from './compressed-assets.ts';
import { observeAssetBackground } from './asset-background.ts';

/** Start only after the loading overlay leaves; frames grant background work time. */
export function startBackgroundAssets(doc: Document, native = false) {
  const connection = (
    doc.defaultView?.navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }
  )?.connection;
  const store = createCompressedAssetStore({ cache: !native });
  const urls = [
    ...runtimeAssets.filter((asset) => asset.group !== 'environment'),
    ...runtimeAssets.filter((asset) => asset.group === 'environment'),
  ].map((asset) => asset.url);
  const prefetch = createAssetPrefetch({
    urls,
    read: store.read,
    report: (snapshot) => {
      doc.body.dataset.assetPrefetch = JSON.stringify(snapshot);
    },
  });
  let quiet = false,
    lastStage = -1,
    allowed = false,
    disposed = false;
  let lastNextStage: number | undefined;
  const policy = () => {
    const next = !native && !connection?.saveData && !doc.hidden && quiet;
    if (next === allowed) return;
    allowed = next;
    prefetch.pause(!allowed);
  };
  const stop = observeAssetBackground((stage, settled, work, budget, nextStage) => {
    quiet = settled && work <= budget * 0.75;
    if (stage !== lastStage || nextStage !== lastNextStage) {
      lastStage = stage;
      lastNextStage = nextStage;
      const select = (index: number) =>
        runtimeAssets
          .filter((asset) => (asset.stages as readonly number[]).includes(index))
          .map((asset) => asset.url);
      prefetch.prioritize([
        ...select(stage),
        ...(nextStage === undefined ? [] : select(nextStage)),
      ]);
    }
    policy();
  });
  doc.addEventListener('visibilitychange', policy);
  connection?.addEventListener('change', policy);
  if (!native && !connection?.saveData) void store.retainOnly(urls).catch(() => {});
  doc.body.dataset.assetPrefetch = JSON.stringify(prefetch.snapshot());
  return () => {
    if (disposed) return;
    disposed = true;
    stop();
    prefetch.dispose();
    doc.removeEventListener('visibilitychange', policy);
    connection?.removeEventListener('change', policy);
    delete doc.body.dataset.assetPrefetch;
  };
}
