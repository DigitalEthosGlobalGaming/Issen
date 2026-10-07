import { mount } from './ui/mount';
import { startGame } from './game.ts';
import { createArtworkPreloader } from './platform/artwork-preload.ts';
import { mountStartupLoading, STARTUP_LOGO_URL } from './ui/startup-loading.ts';
import { mountChangelogLink } from './ui/changelog-link.ts';
import { SceneSurface } from './rendering/scene-surface.ts';
import { createLightingRig } from './rendering/lighting-rig.ts';
import { createUiMaterialLighting } from './ui/material-lighting.ts';
import { assetMaterialCatalog } from './rendering/asset-material-catalog.ts';

const artwork = import.meta.glob<string>(
  '/src/**/*.{png,jpg,jpeg,webp,avif,gif,svg,PNG,JPG,JPEG,WEBP,AVIF,GIF,SVG}',
  { eager: true, query: '?url', import: 'default' },
);
const publicArtwork = import.meta.glob<string>(
  '/public/**/*.{png,jpg,jpeg,webp,avif,gif,svg,PNG,JPG,JPEG,WEBP,AVIF,GIF,SVG}',
  { query: '?url', import: 'default' },
);
// Material owners decode selected maps separately from source artwork.
const materialMaps = new Set(assetMaterialCatalog.flatMap((pack) => Object.values(pack.maps)));
const urls = [
  ...Object.values(artwork),
  ...Object.keys(publicArtwork).map(
    (path) => `${import.meta.env.BASE_URL}${path.slice('/public/'.length)}`,
  ),
].filter((url) => !materialMaps.has(url));

export class MainGame {
  private root: HTMLElement | null = null;
  private stop: (() => void) | null = null;
  private stopChangelog: (() => void) | null = null;
  private disposed = false;
  private starting: Promise<void> | null = null;
  private readonly surfaces = new Map<string, SceneSurface>();
  private readonly useWebGL = new URLSearchParams(location.search).get('renderer') !== 'canvas';
  private readonly loading = mountStartupLoading(() => {
    void this.begin();
  });
  private readonly lightingRig = createLightingRig();
  private readonly uiMaterialLighting = createUiMaterialLighting(
    document,
    this.lightingRig,
    this.useWebGL,
  );
  private readonly preloader = createArtworkPreloader(urls, undefined, this.loading.update, [
    STARTUP_LOGO_URL,
  ]);

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
      // Select before acquiring a context. Canvas remains an explicit comparison
      // path, and each unsupported WebGL surface falls back during initialization.
      for (const id of ['c', 'prevC', 'supportPreview']) {
        const htmlElement = this.root.querySelector<HTMLCanvasElement>(`#${id}`)!;
        const surface = new SceneSurface(htmlElement, id !== 'c');
        this.surfaces.set(id, surface);
        await surface.initialize(this.useWebGL);
        if (this.disposed) return;
      }
      this.stop = startGame(this.surfaces, { rig: this.lightingRig, ui: this.uiMaterialLighting });
      this.loading.remove();
    } catch (error) {
      this.releaseRoot();
      if (!this.disposed) {
        console.error('Issen startup failed:', error);
        this.loading.fail('Issen could not start. Retry loading to try again.');
      }
    }
  }

  private releaseRoot(): void {
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
    this.preloader.dispose();
    this.loading.remove();
    this.releaseRoot();
    this.uiMaterialLighting.dispose();
  }
}
