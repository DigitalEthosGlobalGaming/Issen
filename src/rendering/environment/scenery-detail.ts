export type SceneryDetail = 'low' | 'normal' | 'high';

export function sceneryLowQuality(detail: SceneryDetail | undefined, legacy: boolean) {
  return detail ? detail === 'low' : legacy;
}

/** Explicit tiers change decorative population; absent detail preserves legacy callers. */
export function sceneryCount(
  lowQuality: boolean,
  detail: SceneryDetail | undefined,
  low: number,
  normal: number,
  high: number,
  legacyLow = low,
) {
  return detail === 'low'
    ? low
    : detail === 'normal'
      ? normal
      : detail === 'high'
        ? high
        : lowQuality
          ? legacyLow
          : high;
}

export function documentSceneryDetail(doc: Document): SceneryDetail | undefined {
  const value = doc.documentElement.dataset.graphicsScenery;
  return value === 'low' || value === 'normal' || value === 'high' ? value : undefined;
}
