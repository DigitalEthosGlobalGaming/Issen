import { documentPixelMemory } from './pixel-memory.ts';
import {
  documentImageBudget,
  trimMainImages,
  mainImageReservation,
  setMainImageReclaimer,
} from './main-images.ts';

type SceneOwner = {
  readonly memorySnapshot: {
    decodedBytes: number;
    canvasBytes: number;
    transferredBytes: number;
    reservedBytes: number;
  };
};
const owners = new WeakMap<Document, Set<WeakRef<SceneOwner>>>();
const registered = new WeakMap<Document, WeakSet<SceneOwner>>();
const monitored = new WeakSet<Document>();
// Matches foreground figure preparation's working allowance. Optional jobs must
// leave this room for drawing/cache growth while cancelled worker work settles.
export const sceneGameplayHeadroomBytes = 32 * 1024 * 1024;
function monitorMainDecodes(doc: Document) {
  if (monitored.has(doc)) return;
  monitored.add(doc);
  setMainImageReclaimer(doc, () => {
    reclaimSceneMemory(doc);
  });
}
export function reclaimSceneMemory(doc: Document, additionalBytes = 0) {
  const before = documentSceneMemory(doc);
  if (before.committedBytes + additionalBytes <= before.budget) return before;
  trimMainImages(doc, before.committedBytes + additionalBytes - before.budget);
  return documentSceneMemory(doc);
}
/** Reclaim for optional work without consuming required gameplay's allowance. */
export function reclaimBackgroundSceneMemory(doc: Document, additionalBytes = 0) {
  return reclaimSceneMemory(doc, additionalBytes + sceneGameplayHeadroomBytes);
}
export function registerSceneMemory(doc: Document, owner: SceneOwner) {
  monitorMainDecodes(doc);
  let seen = registered.get(doc);
  if (!seen) registered.set(doc, (seen = new WeakSet()));
  if (seen.has(owner)) return;
  seen.add(owner);
  let entries = owners.get(doc);
  if (!entries) owners.set(doc, (entries = new Set()));
  entries.add(new WeakRef(owner));
}

/** Shared across live/preview owners; reservations cover work not yet in a worker response. */
export function documentSceneMemory(doc: Document) {
  monitorMainDecodes(doc);
  const main = documentPixelMemory(doc).snapshot();
  let workerDecodedBytes = 0,
    workerCanvasBytes = 0,
    transferredBytes = 0,
    reservedBytes = mainImageReservation(doc);
  const entries = owners.get(doc);
  for (const entry of entries ?? []) {
    const owner = entry.deref();
    if (!owner) {
      entries!.delete(entry);
      continue;
    }
    const scene = owner.memorySnapshot;
    workerDecodedBytes += scene.decodedBytes;
    workerCanvasBytes += scene.canvasBytes;
    transferredBytes += scene.transferredBytes;
    reservedBytes += scene.reservedBytes;
  }
  const accountedBytes =
    main.decodedBytes +
    main.canvasBytes +
    main.gpuBytes +
    workerDecodedBytes +
    workerCanvasBytes +
    transferredBytes;
  // CPU backing plus GPU backing, with a separate reserve for opaque native overhead.
  const budget = documentImageBudget(doc) * 2;
  const overheadBytes = 64 * 1024 * 1024 + main.browserReserveBytes;
  return {
    ...main,
    workerDecodedBytes,
    workerCanvasBytes,
    transferredBytes,
    accountedBytes,
    reservedBytes,
    overheadBytes,
    budget,
    gameplayHeadroomBytes: sceneGameplayHeadroomBytes,
    backgroundBudget: budget - sceneGameplayHeadroomBytes,
    committedBytes: accountedBytes + reservedBytes + overheadBytes,
  };
}
