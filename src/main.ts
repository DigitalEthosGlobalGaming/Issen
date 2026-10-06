import './styles/index.css';
import { mount } from './ui/mount';
import { startGame } from './game.ts';
import { createArtworkPreloader } from './platform/artwork-preload.ts';
import { mountStartupLoading, STARTUP_LOGO_URL } from './ui/startup-loading.ts';
import { mountChangelogLink } from './ui/changelog-link.ts';
import { createSceneSurface, type SceneSurface } from './rendering/scene-surface.ts';
import { createLightingRig } from './rendering/lighting-rig.ts';
import { createUiMaterialLighting } from './ui/material-lighting.ts';

// Bootstrap owns only the loading logo. Runtime and UI owners prepare their
// selected dependencies; authoring/reference artwork is never preloaded globally.
const urls = [STARTUP_LOGO_URL];
let root: HTMLElement | null = null;
let stop: (() => void) | null = null;
let stopChangelog: (() => void) | null = null;
let disposed = false;
const loading = mountStartupLoading(() => {
  void begin();
});
const lightingRig = createLightingRig();
const uiMaterialLighting = createUiMaterialLighting(
  document,
  lightingRig,
  new URLSearchParams(location.search).get('renderer') !== 'canvas',
);
const preloader = createArtworkPreloader(urls, undefined, loading.update, [STARTUP_LOGO_URL]);
async function begin() {
  if ((await preloader.run()) && !disposed && !root) {
    root = mount();
    stopChangelog = mountChangelogLink(root);
    // Select before acquiring a context. Canvas remains an explicit comparison
    // path, and each unsupported WebGL surface falls back during initialization.
    if (new URLSearchParams(location.search).get('renderer') !== 'canvas') {
      if (disposed) return;
      const surfaces = new Map<string, SceneSurface>();
      for (const id of ['c', 'prevC', 'supportPreview']) {
        const surface = await createSceneSurface(
          root.querySelector<HTMLCanvasElement>(`#${id}`)!,
          true,
          id !== 'c',
        );
        surfaces.set(id, surface);
        if (disposed) {
          for (const prepared of surfaces.values()) prepared.dispose();
          return;
        }
      }
      stop = startGame(surfaces, { rig: lightingRig, ui: uiMaterialLighting });
    } else stop = startGame(undefined, { rig: lightingRig, ui: uiMaterialLighting });
    loading.remove();
  }
}
void begin();
export function dispose(): void {
  disposed = true;
  preloader.dispose();
  loading.remove();
  stop?.();
  uiMaterialLighting.dispose();
  stopChangelog?.();
  root?.remove();
}

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(dispose);
}
