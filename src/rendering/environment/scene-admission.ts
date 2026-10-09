import { runtimeAssets } from '../../platform/runtime-assets.ts';
import { sceneImageUrls } from './asset-sources.ts';
import type { CompositionIdentity } from './worker-types.ts';

const bytes = new Map(runtimeAssets.map((asset) => [asset.url, asset.width * asset.height * 4]));
/** Conservative peak: decoded kit, new canvases, copied planes, uploads and cutout scratch. */
export function scenePreparationBytes(frame: CompositionIdentity): number | undefined {
  const { width, height } = frame;
  if (![width, height, frame.dpr].every((value) => Number.isFinite(value) && value > 0)) return;
  let inputBytes = 0;
  for (const url of sceneImageUrls(frame.stage)) {
    const size = bytes.get(url);
    if (!size) return;
    inputBytes += size;
  }
  const scale = Math.min(
    Math.max(1, frame.dpr),
    frame.lowQuality ? 1 : 1.5,
    2560 / width,
    1920 / height,
    Math.sqrt(1_000_000 / (width * height)),
  );
  let pixels = Math.max(1, Math.round(width * scale)) * Math.max(1, Math.round(height * scale)) * 3;
  if (frame.stage === 4) {
    const edge = width * (height >= width * 0.9 ? 0.2 : 0.24);
    const density = Math.min(
      frame.lowQuality ? 1 : 1.5,
      Math.sqrt(2_000_000 / (2 * edge * height)),
    );
    pixels +=
      2 * Math.max(1, Math.floor(edge * density)) * Math.max(1, Math.floor(height * density));
  }
  return inputBytes + pixels * 4 * 4 * 3 + 20 * 1024 * 1024;
}
