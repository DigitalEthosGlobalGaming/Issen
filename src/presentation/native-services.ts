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
import { documentSceneMemory } from '../platform/scene-memory.ts';
import type { Palette } from '../rendering/palette.ts';

export interface PreparedLighting {
  rig: ReturnType<typeof createLightingRig>;
  ui: ReturnType<typeof createUiMaterialLighting>;
}
/** Own native renderer services and their existing disposal order for one game. */
export function createNativeServices(
  ownerDocument: Document,
  lifecycle: { add(cleanup: () => void): void },
  lighting?: PreparedLighting,
  painter?: Pick<PixiScenePainter, 'warmScene' | 'retainTextureSources'>,
) {
  const environmentRenderer = createEnvironmentRenderer(ownerDocument, {
    warmWorkerScene: painter ? (sources, signal) => painter.warmScene(sources, signal) : undefined,
    retainWorkerSources: painter ? (sources) => painter.retainTextureSources(sources) : undefined,
  });
  lifecycle.add(environmentRenderer.dispose);
  const demonRealmRenderer = createDemonRealmRenderer(ownerDocument);
  lifecycle.add(demonRealmRenderer.dispose);
  const inkCharm = createInkCharmRenderer(ownerDocument);
  const inkCompanion = createInkCompanionRenderer(ownerDocument);
  const inkEnemy = createInkEnemyRenderer(ownerDocument);
  const inkPlayer = createInkPlayerRenderer(ownerDocument);
  const inkSword = createInkSwordRenderer(ownerDocument);
  const figureLifetime = new AbortController();
  let figureRequest = 0,
    releaseFigureSources: (() => void) | undefined;
  lifecycle.add(() => {
    figureLifetime.abort();
    releaseFigureSources?.();
  });
  async function prepareFigureArtwork(
    ids: readonly string[],
    palettes: readonly Palette[],
    signal: AbortSignal,
  ) {
    const request = ++figureRequest;
    const lifetime = AbortSignal.any([signal, figureLifetime.signal]);
    const [enemy, weapons] = await Promise.all([
      inkEnemy.prepareUploads(palettes, lifetime),
      inkSword.prepareUploads(ids, lifetime),
    ]);
    if (!enemy || !weapons || lifetime.aborted || request !== figureRequest) return false;
    if (!painter) return true;
    const uploads = [...enemy, ...weapons];
    const release = painter.retainTextureSources(uploads.map(({ texture }) => texture.source));
    let accepted = false;
    try {
      if (
        !(await painter.warmScene(uploads, lifetime)) ||
        lifetime.aborted ||
        request !== figureRequest
      )
        return false;
      releaseFigureSources?.();
      releaseFigureSources = release;
      accepted = true;
      return true;
    } finally {
      if (!accepted) release();
    }
  }
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
    memorySnapshot: () => documentSceneMemory(ownerDocument),
    prepareFigureArtwork,
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
