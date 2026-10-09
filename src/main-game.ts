import { GraphicsUnsupportedError, GRAPHICS_ERROR_EVENT } from './rendering/graphics-error.ts';
import { mount } from './ui/mount';
import { startGame } from './game.ts';
import { createArtworkPreloader } from './platform/artwork-preload.ts';
import { mountStartupLoading, STARTUP_LOGO_URL } from './ui/startup-loading.ts';
import { mountChangelogLink } from './ui/changelog-link.ts';
import { SceneSurface } from './rendering/scene-surface.ts';
import { createLightingRig } from './rendering/lighting-rig.ts';
import { createUiMaterialLighting } from './ui/material-lighting.ts';
import { assetMaterialCatalog } from './rendering/asset-material-catalog.ts';
import { Capacitor } from '@capacitor/core';
import { startBackgroundAssets } from './platform/background-assets.ts';
import { runtimeAssets } from './platform/runtime-assets.ts';
import { INK_ENEMY_DEBUG_SOURCES } from './rendering/figures/ink-enemy.ts';
import { INK_COMPANION_SOURCES } from './rendering/figures/ink-companions.ts';
import { INK_OUTFIT_SOURCES } from './rendering/figures/outfit-kit.ts';

const artwork = import.meta.glob<string>(
  [
    '/src/**/*.{jpg,jpeg,webp,avif,gif,svg,JPG,JPEG,WEBP,AVIF,GIF,SVG}',
    '/src/**/*.compact.png',
    '!/src/**/pbr/**',
    '!/src/**/*-pbr/**',
  ],
  { eager: true, query: '?url', import: 'default' },
);
const publicArtwork = import.meta.glob<string>(
  '/public/**/*.{jpg,jpeg,webp,avif,gif,svg,JPG,JPEG,WEBP,AVIF,GIF,SVG}',
  { query: '?url', import: 'default' },
);
// Material owners decode selected maps separately from source artwork.
const materialMaps = new Set(assetMaterialCatalog.flatMap((pack) => Object.values(pack.maps)));
const runtimeUrlSet = new Set<string>(runtimeAssets.map((asset) => asset.url));
const enemyDebugSources = new Set<string>(Object.values(INK_ENEMY_DEBUG_SOURCES));
const companionSources = new Set<string>(Object.values(INK_COMPANION_SOURCES));
const outfitSources = new Set<string>(Object.values(INK_OUTFIT_SOURCES));
// These native artwork owners share decode leases instead of lifetime startup images.
const sharedSources = new Set(
  assetMaterialCatalog
    .filter((pack) =>
      [
        'src/rendering/figures/assets/player-ronin-simple.png',
        'src/rendering/figures/assets/charm-atlas.png',
        'src/ui/assets/world-ui-atlas.png',
      ].includes(pack.sourcePath),
    )
    .map((pack) => pack.source),
);
const urls = [
  ...Object.values(artwork),
  ...Object.keys(publicArtwork).map(
    (path) => `${import.meta.env.BASE_URL}${path.slice('/public/'.length)}`,
  ),
].filter((url) => {
  const canonical = new URL(url, document.baseURI).href;
  return (
    !materialMaps.has(canonical) &&
    !companionSources.has(canonical) &&
    !outfitSources.has(canonical) &&
    !sharedSources.has(canonical) &&
    !enemyDebugSources.has(canonical) &&
    runtimeUrlSet.has(canonical)
  );
});

export class MainGame {
  private root: HTMLElement | null = null;
  private stop: (() => void) | null = null;
  private stopChangelog: (() => void) | null = null;
  private stopAssets: (() => void) | null = null;
  private disposed = false;
  private starting: Promise<void> | null = null;
  private readonly surfaces = new Map<string, SceneSurface>();
  private readonly loading = mountStartupLoading(() => {
    void this.begin();
  });
  private readonly lightingRig = createLightingRig();
  private readonly uiMaterialLighting = createUiMaterialLighting(document, this.lightingRig);
  private readonly preloader = createArtworkPreloader(urls, undefined, this.loading.update, [
    STARTUP_LOGO_URL,
  ]);

  private readonly graphicsError = (event: Event): void => {
    if (!this.disposed)
      this.loading.graphics((event as CustomEvent<{ reload: boolean }>).detail.reload);
  };
  constructor() {
    document.addEventListener(GRAPHICS_ERROR_EVENT, this.graphicsError);
  }

  begin(): Promise<void> {
    if (this.disposed) return Promise.resolve();
    if (this.starting) return this.starting;
    if (this.root) return Promise.resolve();
    this.starting = this.prepare().finally(() => {
      this.starting = null;
    });
    return this.starting;
  }

  private async prepare(): Promise<void> {
    try {
      if (!(await this.preloader.run()) || this.disposed) return;

      this.root = mount();
      this.stopChangelog = mountChangelogLink(this.root);
      // Every scene surface requires its own WebGL2 renderer.
      for (const id of ['c', 'prevC', 'supportPreview']) {
        const htmlElement = this.root.querySelector<HTMLCanvasElement>(`#${id}`)!;
        const surface = new SceneSurface(htmlElement, id !== 'c');
        this.surfaces.set(id, surface);
        await surface.initialize();
        if (this.disposed) return;
      }
      this.stop = startGame(this.surfaces, { rig: this.lightingRig, ui: this.uiMaterialLighting });
      this.loading.remove();
      this.preloader.dispose();
      this.stopAssets = startBackgroundAssets(
        document,
        Capacitor.isNativePlatform() || import.meta.env.MODE === 'android',
      );
    } catch (error) {
      this.releaseRoot();
      if (!this.disposed) {
        console.error('Issen startup failed:', error);
        if (error instanceof GraphicsUnsupportedError) this.loading.graphics();
        else this.loading.fail('Issen could not start. Retry loading to try again.');
      }
    }
  }

  private releaseRoot(): void {
    this.stopAssets?.();
    this.stopAssets = null;
    this.stop?.();
    this.stop = null;
    for (const surface of this.surfaces.values()) surface.dispose();
    this.surfaces.clear();
    this.stopChangelog?.();
    this.stopChangelog = null;
    this.root?.remove();
    this.root = null;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    document.removeEventListener(GRAPHICS_ERROR_EVENT, this.graphicsError);
    this.preloader.dispose();
    this.loading.remove();
    this.releaseRoot();
    this.uiMaterialLighting.dispose();
  }
}
