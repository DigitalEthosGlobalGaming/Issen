import './startup-loading.css';
import type { ArtworkProgress } from '../platform/artwork-preload.ts';
import logoUrl from './assets/issen-logo.webp';

export const STARTUP_LOGO_URL = logoUrl;

export function mountStartupLoading(retry: () => void) {
  const element = document.createElement('main');
  element.className = 'startup-loading';
  element.setAttribute('aria-labelledby', 'startup-heading');
  element.innerHTML = `<section><img class="startup-logo" alt="Issen" width="600" height="400" fetchpriority="high" decoding="async"><h1 id="startup-heading">Preparing Issen</h1><p role="status" aria-live="polite">Loading artwork…</p><progress aria-label="Artwork loading" max="1" value="0"></progress><p class="startup-error" role="alert"></p><button type="button" hidden>Retry loading</button></section>`;
  element.querySelector('img')!.src = logoUrl;
  const status = element.querySelector<HTMLElement>('[role=status]')!;
  const progress = element.querySelector('progress')!;
  const error = element.querySelector<HTMLElement>('[role=alert]')!;
  const button = element.querySelector('button')!;
  let action = retry;
  const activate = () => action();
  button.addEventListener('click', activate);
  document.body.append(element);
  return {
    update(state: ArtworkProgress) {
      element.querySelector('h1')!.textContent = 'Preparing Issen';
      progress.hidden = false;
      button.textContent = 'Retry loading';
      action = retry;
      progress.max = Math.max(1, state.total);
      progress.value = state.loaded;
      status.textContent = `${state.loaded} of ${state.total} artwork images ready`;
      const blocked = state.pending === 0 && state.failed.length > 0;
      error.textContent = blocked
        ? `${state.failed.length} artwork image${state.failed.length === 1 ? '' : 's'} could not load. Check your connection or local installation, then retry.`
        : '';
      button.hidden = !blocked;
    },
    fail(message: string) {
      error.textContent = message;
      button.hidden = false;
    },
    scene() {
      button.addEventListener('click', activate);
      element.querySelector('h1')!.textContent = 'Scene unavailable';
      status.textContent = 'This scene could not be prepared.';
      progress.hidden = true;
      error.textContent =
        'Try again. If this continues, update your browser or Android System WebView.';
      button.textContent = 'Retry';
      button.hidden = false;
      action = retry;
      if (!element.isConnected) document.body.append(element);
    },
    graphics(reload = false) {
      button.addEventListener('click', activate);
      element.querySelector('h1')!.textContent = 'Graphics not supported';
      status.textContent = 'This device’s graphics are not supported by Issen.';
      progress.hidden = true;
      error.textContent = 'Try again after closing other apps or updating your browser.';
      button.textContent = reload ? 'Reload' : 'Retry';
      button.hidden = false;
      action = reload ? () => location.reload() : retry;
      if (!element.isConnected) document.body.append(element);
    },
    remove() {
      button.removeEventListener('click', activate);
      element.remove();
    },
  };
}
