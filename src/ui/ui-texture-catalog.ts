import generated from '../rendering/generated/ui/manifest.json';
import { uiTextureSource } from './ui-texture.ts';
export interface UiTexturePack {
  sourcePath: string;
  source: string;
  dimensions: readonly [number, number];
  ids: readonly string[];
  frame?: readonly [number, number, number, number];
}
export const uiTextureCatalog: readonly UiTexturePack[] = Object.entries(
  generated.collections,
).flatMap(([sourcePath, collection]) => {
  const stem = sourcePath.split('/').pop()!.replace('.png', '');
  return [
    {
      sourcePath,
      source: uiTextureSource(stem),
      dimensions: collection.size as [number, number],
      ids: collection.sprites,
    },
    ...collection.sprites.map((id, cell) => ({
      sourcePath,
      source: uiTextureSource(stem, cell),
      dimensions: (
        generated.sprites as unknown as Record<string, { logicalSize: [number, number] }>
      )[id]!.logicalSize,
      frame: (
        generated.sprites as unknown as Record<
          string,
          { sourceFrame: [number, number, number, number] }
        >
      )[id]!.sourceFrame,
      ids: [id],
    })),
  ];
});
