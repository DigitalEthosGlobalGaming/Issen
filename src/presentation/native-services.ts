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
import {
  documentSceneMemory,
  reclaimSceneMemory,
  registerSceneMemory,
} from '../platform/scene-memory.ts';
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
    ownsUploadReservation: !!painter,
    warmWorkerScene: painter ? (sources, signal) => painter.warmScene(sources, signal) : undefined,
    retainWorkerSources: painter ? (sources) => painter.retainTextureSources(sources) : undefined,
  });
  lifecycle.add(environmentRenderer.dispose);
  const demonRealmRenderer = createDemonRealmRenderer(ownerDocument, {
    warmScene: painter
      ? (sources, signal) => painter.warmScene(sources, signal, { sceneryFilters: true })
      : undefined,
    retainSources: painter ? (sources) => painter.retainTextureSources(sources) : undefined,
  });
  lifecycle.add(demonRealmRenderer.dispose);
  const inkCharm = createInkCharmRenderer(ownerDocument);
  const inkCompanion = createInkCompanionRenderer(ownerDocument);
  const inkEnemy = createInkEnemyRenderer(ownerDocument);
  const inkPlayer = createInkPlayerRenderer(ownerDocument);
  const inkSword = createInkSwordRenderer(ownerDocument);
  const figureLifetime = new AbortController();
  let backgroundLifetime: AbortController | undefined;
  let backgroundReservation = 0;
  let releaseBackgroundSources: (() => void) | undefined;
  const backgroundOwner = {
    get memorySnapshot() {
      return {
        decodedBytes: 0,
        canvasBytes: 0,
        transferredBytes: 0,
        reservedBytes: backgroundReservation,
      };
    },
  };
  registerSceneMemory(ownerDocument, backgroundOwner);
  function cancelBackgroundFigures() {
    backgroundLifetime?.abort();
    backgroundLifetime = undefined;
    backgroundReservation = 0;
    releaseBackgroundSources?.();
    releaseBackgroundSources = undefined;
  }
  let figureRequest = 0,
    releaseFigureSources: (() => void) | undefined;
  lifecycle.add(() => {
    cancelBackgroundFigures();
    figureLifetime.abort();
    releaseFigureSources?.();
  });
  async function prepareFigureArtwork(
    ids: readonly string[],
    palettes: readonly Palette[],
    signal: AbortSignal,
    selection?: { robe: string; charm?: string; charmColor?: string; pet?: string },
    options: { background?: boolean } = {},
  ) {
    cancelBackgroundFigures();
    let background: AbortController | undefined;
    if (options.background) {
      // Both bounded enemy tone/variant stores (8M pixels) plus GPU variants.
      // Keep the full reserve until completion; actual allocations remain counted too.
      const reserve = 64 * 1024 * 1024;
      const memory = reclaimSceneMemory(ownerDocument, reserve);
      if (memory.committedBytes + reserve > memory.budget) return false;
      background = backgroundLifetime = new AbortController();
      backgroundReservation = reserve;
      signal.addEventListener(
        'abort',
        () => {
          if (backgroundLifetime === background) cancelBackgroundFigures();
        },
        { once: true },
      );
    }
    const request = ++figureRequest;
    const lifetime = AbortSignal.any([
      signal,
      figureLifetime.signal,
      ...(background ? [background.signal] : []),
    ]);
    let accepted = false;
    let release: (() => void) | undefined;
    try {
      const [enemy, weapons, player, charm, companion] = await Promise.all([
        inkEnemy.prepareUploads(palettes, lifetime),
        inkSword.prepareUploads(ids, lifetime),
        selection === undefined
          ? Promise.resolve([])
          : inkPlayer.prepareUploads(selection.robe, lifetime),
        inkCharm.prepareUploads(selection?.charm, selection?.charmColor, lifetime),
        selection === undefined
          ? Promise.resolve([])
          : inkCompanion.prepareUploads(selection.pet ?? 'nopet', lifetime),
      ]);
      if (
        !enemy ||
        !weapons ||
        !player ||
        !charm ||
        !companion ||
        lifetime.aborted ||
        request !== figureRequest
      )
        return false;
      if (!painter) {
        accepted = true;
        backgroundReservation = 0;
        return true;
      }
      const uploads = [...enemy, ...weapons, ...player, ...charm, ...companion];
      release = painter.retainTextureSources(uploads.map(({ texture }) => texture.source));
      if (
        !(await painter.warmScene(uploads, lifetime)) ||
        lifetime.aborted ||
        request !== figureRequest
      )
        return false;
      if (options.background) {
        releaseBackgroundSources = release;
        backgroundReservation = 0;
      } else {
        releaseFigureSources?.();
        releaseFigureSources = release;
      }
      accepted = true;
      return true;
    } finally {
      if (!accepted) {
        release?.();
        if (background && backgroundLifetime === background) cancelBackgroundFigures();
      }
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
    memorySnapshot: () => {
      registerSceneMemory(ownerDocument, backgroundOwner);
      return documentSceneMemory(ownerDocument);
    },
    reclaimMemory: () => reclaimSceneMemory(ownerDocument, 32 * 1024 * 1024),
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
