import { createEnvironmentRenderer } from '../rendering/environment/index.ts';
import { createDemonRealmRenderer } from '../rendering/environment/demon-realm.ts';
import { createInkCharmRenderer } from '../rendering/figures/ink-charms.ts';
import { createInkCompanionRenderer } from '../rendering/figures/ink-companions.ts';
import { createInkEnemyRenderer } from '../rendering/figures/ink-enemy.ts';
import { createInkPlayerRenderer } from '../rendering/figures/ink-player.ts';
import { createInkSwordRenderer } from '../rendering/figures/ink-sword.ts';
import { createLightingRig } from '../rendering/lighting-rig.ts';
import { createUiMaterialLighting } from '../ui/material-lighting.ts';
import { disposeUiArt } from '../rendering/ui-art.ts';
import type { PixiScenePainter } from '../rendering/pixi/scene-painter.ts';

export interface PreparedLighting {
  rig: ReturnType<typeof createLightingRig>;
  ui: ReturnType<typeof createUiMaterialLighting>;
}
/** Own native renderer services and their existing disposal order for one game. */
export function createNativeServices(
  ownerDocument: Document,
  lifecycle: { add(cleanup: () => void): void },
  lighting?: PreparedLighting,
  painter?: Pick<PixiScenePainter, 'warmTextures'>,
) {
  const environmentRenderer = createEnvironmentRenderer(ownerDocument, {
    warmWorkerScene: painter
      ? (sources, signal) => painter.warmTextures(sources, signal)
      : undefined,
  });
  lifecycle.add(environmentRenderer.dispose);
  const demonRealmRenderer = createDemonRealmRenderer(ownerDocument);
  lifecycle.add(demonRealmRenderer.dispose);
  const inkCharm = createInkCharmRenderer(ownerDocument);
  const inkCompanion = createInkCompanionRenderer(ownerDocument);
  const inkEnemy = createInkEnemyRenderer(ownerDocument);
  const inkPlayer = createInkPlayerRenderer(ownerDocument);
  const inkSword = createInkSwordRenderer(ownerDocument);
  const lightingRig = lighting?.rig ?? createLightingRig();
  const uiMaterialLighting = lighting?.ui ?? createUiMaterialLighting(ownerDocument, lightingRig);
  if (!lighting) lifecycle.add(uiMaterialLighting.dispose);
  lifecycle.add(() => disposeUiArt(ownerDocument));
  lifecycle.add(inkCharm.dispose);
  lifecycle.add(inkCompanion.dispose);
  lifecycle.add(inkEnemy.dispose);
  lifecycle.add(inkPlayer.dispose);
  lifecycle.add(inkSword.dispose);
  return {
    environmentRenderer,
    demonRealmRenderer,
    inkCharm,
    inkCompanion,
    inkEnemy,
    inkPlayer,
    inkSword,
    lightingRig,
    uiMaterialLighting,
  };
}
