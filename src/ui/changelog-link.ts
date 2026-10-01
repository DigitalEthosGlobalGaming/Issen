import { nextReleaseNotice } from '../platform/release-notice.ts';
import { store } from '../platform/storage.ts';

export function mountChangelogLink(root: HTMLElement): () => void {
  const link = root.querySelector<HTMLAnchorElement>('#changelogLink');
  const version = root.querySelector('.title-version')?.textContent?.trim();
  if (!link || !version) return () => {};
  const key = 'issen.releaseNotice';
  const notice = nextReleaseNotice(store.get(key, null), version);
  store.set(key, notice);
  const update = () => {
    link.classList.toggle('has-update', notice.unread);
    link.setAttribute('aria-label', notice.unread ? 'Changelog — new update' : 'Changelog');
    link.title = notice.unread ? 'Updated since your last visit' : 'See what changed';
  };
  const acknowledge = () => {
    notice.unread = false;
    store.set(key, notice);
    update();
  };
  update();
  link.addEventListener('click', acknowledge);
  return () => link.removeEventListener('click', acknowledge);
}
