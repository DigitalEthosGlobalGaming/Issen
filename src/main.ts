import './styles/index.css';
import { mount } from './ui/mount';
import { startGame } from './game.ts';
import { createArtworkPreloader } from './platform/artwork-preload.ts';
import { mountStartupLoading } from './ui/startup-loading.ts';
import { mountChangelogLink } from './ui/changelog-link.ts';

const artwork = import.meta.glob<string>(
  '/src/**/*.{png,jpg,jpeg,webp,avif,gif,svg,PNG,JPG,JPEG,WEBP,AVIF,GIF,SVG}',
  { eager: true, query: '?url', import: 'default' },
);
const publicArtwork = import.meta.glob<string>(
  '/public/**/*.{png,jpg,jpeg,webp,avif,gif,svg,PNG,JPG,JPEG,WEBP,AVIF,GIF,SVG}',
  { query: '?url', import: 'default' },
);
const urls = [
  ...Object.values(artwork),
  ...Object.keys(publicArtwork).map(
    (path) => `${import.meta.env.BASE_URL}${path.slice('/public/'.length)}`,
  ),
];
let root: HTMLElement | null = null;
let stop: (() => void) | null = null;
let stopChangelog: (() => void) | null = null;
let disposed = false;
const loading = mountStartupLoading(() => {
  void begin();
});
const preloader = createArtworkPreloader(urls, undefined, loading.update);
async function begin() {
  if ((await preloader.run()) && !disposed && !root) {
    loading.remove();
    root = mount();
    stopChangelog = mountChangelogLink(root);
    stop = startGame();
  }
}
void begin();
export function dispose(): void {
  disposed = true;
  preloader.dispose();
  loading.remove();
  stop?.();
  stopChangelog?.();
  root?.remove();
}

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(dispose);
}
