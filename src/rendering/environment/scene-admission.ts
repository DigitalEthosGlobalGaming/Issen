import { environmentRasterScale, foregroundRasterDensity } from './raster-policy.ts';
import { runtimeAssets } from '../../platform/runtime-assets.ts';
import { sceneImageUrls } from './asset-sources.ts';
import type { CompositionIdentity } from './worker-types.ts';
import { assetMaterialCatalog } from '../asset-material-catalog.ts';
import { workerDecodeSize } from './decode-size.ts';

const bytes = new Map(runtimeAssets.map((asset) => [asset.url, asset.width * asset.height * 4]));
const dimensions = new Map(
  assetMaterialCatalog.flatMap((pack) =>
    [pack.source, ...Object.values(pack.maps)].map((url) => [url, pack.dimensions] as const),
  ),
);
/** Conservative peak: decoded kit, new canvases, copied planes, uploads and cutout scratch. */
export function scenePreparationBytes(
  frame: CompositionIdentity,
  decodedBudget = Infinity,
): number | undefined {
  const { width, height } = frame;
  if (![width, height, frame.dpr].every((value) => Number.isFinite(value) && value > 0)) return;
  let inputBytes = 0;
  for (const url of sceneImageUrls(frame.stage)) {
    const size = bytes.get(url);
    if (!size) return;
    const nominal = dimensions.get(url);
    const decoded = nominal && workerDecodeSize(...nominal, decodedBudget);
    inputBytes += decoded ? decoded.width * decoded.height * 4 : size;
  }
  const scale = environmentRasterScale(frame, decodedBudget);
  let pixels = Math.max(1, Math.round(width * scale)) * Math.max(1, Math.round(height * scale)) * 3;
  if (frame.stage === 4) {
    const edge = width * (height >= width * 0.9 ? 0.2 : 0.24);
    const density = foregroundRasterDensity(width, height, frame.lowQuality, decodedBudget);
    pixels +=
      2 * Math.max(1, Math.floor(edge * density)) * Math.max(1, Math.floor(height * density));
  }
  return inputBytes + pixels * 4 * 4 * 3 + 20 * 1024 * 1024;
}
