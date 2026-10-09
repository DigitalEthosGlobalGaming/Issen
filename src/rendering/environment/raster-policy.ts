import type { CompositionIdentity } from './worker-types.ts';

/** Bound raster backing without changing world coordinates or scenery recipes. */
export function environmentRasterScale(frame: CompositionIdentity, decodedBudget: number) {
  const compact = decodedBudget <= 256 * 1024 * 1024;
  return Math.min(
    Math.max(1, frame.dpr),
    frame.lowQuality || compact ? 1 : 1.5,
    2560 / frame.width,
    1920 / frame.height,
    Math.sqrt((compact ? 600_000 : 1_000_000) / (frame.width * frame.height)),
  );
}

export function foregroundRasterDensity(
  width: number,
  height: number,
  lowQuality: boolean,
  decodedBudget: number,
) {
  const compact = decodedBudget <= 256 * 1024 * 1024;
  const edge = width * (height >= width * 0.9 ? 0.2 : 0.24);
  return Math.min(
    lowQuality || compact ? 1 : 1.5,
    Math.sqrt((compact ? 240_000 : 2_000_000) / (2 * edge * height)),
  );
}
