import './startup-loading.css';
import type { ArtworkProgress } from '../platform/artwork-preload.ts';

export function mountStartupLoading(retry: () => void) {
  const element = document.createElement('main');
  element.className = 'startup-loading';
  element.setAttribute('aria-labelledby', 'startup-heading');
  element.innerHTML = `<section><p class="startup-mark" aria-hidden="true">一閃</p><h1 id="startup-heading">Preparing Issen</h1><p role="status" aria-live="polite">Loading artwork…</p><progress aria-label="Artwork loading" max="1" value="0"></progress><p class="startup-error" role="alert"></p><button type="button" hidden>Retry loading</button></section>`;
  const status = element.querySelector<HTMLElement>('[role=status]')!;
  const progress = element.querySelector('progress')!;
  const error = element.querySelector<HTMLElement>('[role=alert]')!;
  const button = element.querySelector('button')!;
  button.addEventListener('click', retry);
  document.body.append(element);
  return {
    update(state: ArtworkProgress) {
      progress.max = Math.max(1, state.total);
      progress.value = state.loaded;
      status.textContent = `${state.loaded} of ${state.total} artwork images ready`;
      const blocked = state.pending === 0 && state.failed.length > 0;
      error.textContent = blocked
        ? `${state.failed.length} artwork image${state.failed.length === 1 ? '' : 's'} could not load. Check your connection or local installation, then retry.`
        : '';
      button.hidden = !blocked;
    },
    remove() {
      button.removeEventListener('click', retry);
      element.remove();
    },
  };
}
