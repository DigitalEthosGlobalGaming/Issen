import {
  playerProfiles,
  currentProfile,
  createPlayerProfile,
  renamePlayerProfile,
  switchPlayerProfile,
  switchTestProfile,
  isTestProfile,
} from '../../platform/storage.ts';

export function bindProfileManagement(root: HTMLElement, flush: () => void): () => void {
  const select = root.querySelector<HTMLSelectElement>('#playerProfile')!;
  const name = root.querySelector<HTMLInputElement>('#profileName')!;
  const message = root.querySelector<HTMLElement>('#profileMessage')!;
  const button = (id: string) => root.querySelector<HTMLButtonElement>('#' + id)!;
  const events = new AbortController();
  function render() {
    const current = currentProfile();
    select.replaceChildren();
    for (const profile of [...playerProfiles(), { id: 'testing', name: 'Testing' }]) {
      const option = root.ownerDocument.createElement('option');
      option.value = profile.id;
      option.textContent = profile.name;
      select.append(option);
    }
    select.value = current.id;
    name.value = current.name;
    button('bRenameProfile').disabled = isTestProfile();
    const deleting = current.id !== 'default' && current.id !== 'testing';
    button('bResetProfile').textContent = deleting ? 'Delete profile' : 'Reset profile';
    root.querySelector<HTMLElement>('#resetProfileTitle')!.textContent = deleting
      ? `Delete ${current.name}?`
      : `Reset ${current.name}?`;
    root.querySelector<HTMLElement>('#resetProfileWarning')!.textContent =
      'This deletes all progress, equipment and settings for this profile. Other profiles stay saved. This cannot be undone.';
    button('bConfirmResetProfile').textContent = deleting
      ? 'Delete profile and progress'
      : 'Delete all progress';
  }
  select.addEventListener(
    'change',
    () => {
      flush();
      const ok =
        select.value === 'testing' ? switchTestProfile(true) : switchPlayerProfile(select.value);
      if (!ok) {
        message.textContent = 'Unable to switch profiles. Please try again.';
        render();
      }
    },
    { signal: events.signal },
  );
  button('bCreateProfile').addEventListener(
    'click',
    () => {
      try {
        flush();
        const id = createPlayerProfile(name.value);
        if (!switchPlayerProfile(id))
          throw new Error('Profile created. Select it to try switching again.');
      } catch (error) {
        message.textContent =
          error instanceof Error ? error.message : 'Unable to create this profile.';
        render();
      }
    },
    { signal: events.signal },
  );
  button('bRenameProfile').addEventListener(
    'click',
    () => {
      try {
        renamePlayerProfile(name.value);
        message.textContent = 'Profile renamed.';
        render();
      } catch (error) {
        message.textContent =
          error instanceof Error ? error.message : 'Unable to rename this profile.';
      }
    },
    { signal: events.signal },
  );
  render();
  return () => events.abort();
}
