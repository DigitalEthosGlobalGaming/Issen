import landmarks from './generated/landmarks/manifest.json';
import scenery from './generated/scenery/manifest.json';
import drift from './generated/drift/manifest.json';
import figures from './generated/figures/manifest.json';
import ui from './generated/ui/manifest.json';
import reference from './generated/reference/manifest.json';
import type { PackedManifest } from './packed-assets.ts';
const manifests = { landmarks, scenery, drift, figures, ui, reference };
export type PackedDomain = keyof typeof manifests;
export const packedMaterialEntries = Object.entries(manifests).flatMap(([domain, manifest]) =>
  Object.keys((manifest as unknown as PackedManifest).sprites).map((id) => ({
    key: `${domain}/${id}`,
    id,
    domain: domain as PackedDomain,
    label: `${domain}: ${id.replaceAll('.', ' ').replaceAll('-', ' ')}`,
  })),
);
export async function packedDomainStore(doc: Document, domain: PackedDomain) {
  switch (domain) {
    case 'landmarks':
      return (await import('./environment/packed-landmarks.ts')).packedLandmarks(doc);
    case 'scenery':
      return (await import('./environment/packed-scenery.ts')).packedScenery(doc);
    case 'drift':
      return (await import('./scene/packed-drift.ts')).packedDrift(doc);
    case 'figures':
      return (await import('./figures/packed-figures.ts')).packedFigures(doc);
    case 'ui':
      return (await import('../ui/packed-ui.ts')).packedUi(doc);
    case 'reference':
      return (await import('./packed-reference.ts')).packedReference(doc);
  }
}
