import { exportSave, prepareImport, type ImportPlan } from '../../platform/save-transfer.ts';
import { snapshotProfile, importProfile, isTestProfile } from '../../platform/storage.ts';

export function bindSaveTransfer(
  root: HTMLElement,
  version: string,
  flush: () => void,
): () => void {
  const doc = root.ownerDocument;
  const button = (id: string) => root.querySelector<HTMLButtonElement>('#' + id)!;
  const input = root.querySelector<HTMLInputElement>('#saveFile')!;
  const dialog = root.querySelector<HTMLDialogElement>('#importSaveDialog')!;
  const message = root.querySelector<HTMLElement>('#saveTransferMessage')!;
  const summary = root.querySelector<HTMLElement>('#importSaveSummary')!;
  const warnings = root.querySelector<HTMLElement>('#importSaveWarnings')!;
  const confirm = button('bConfirmImportSave');
  const events = new AbortController();
  let plan: ImportPlan | null = null;
  let backup = '';
  function download(content: string, suffix = '') {
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const link = doc.createElement('a');
    link.href = url;
    link.download = `issen-save${isTestProfile() ? '-testing' : ''}${suffix}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    doc.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  button('bDownloadSave').addEventListener(
    'click',
    () => {
      try {
        flush();
        download(exportSave(snapshotProfile(), version, isTestProfile()));
        message.textContent = 'Save downloaded.';
      } catch {
        message.textContent = 'Unable to read your save. Please try again.';
      }
    },
    { signal: events.signal },
  );
  button('bImportSave').addEventListener('click', () => input.click(), { signal: events.signal });
  button('bPreviousSave').addEventListener(
    'click',
    () => {
      try {
        const previous = snapshotProfile().importBackup;
        if (!previous || typeof previous !== 'object') {
          message.textContent = 'No previous import backup yet.';
          return;
        }
        download(
          exportSave(previous as Record<string, unknown>, version, isTestProfile()),
          '-previous',
        );
      } catch {
        message.textContent = 'Unable to read the previous backup.';
      }
    },
    { signal: events.signal },
  );
  input.addEventListener(
    'change',
    async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      try {
        if (file.size > 8_000_000) throw new Error('This save file is too large.');
        flush();
        const current = snapshotProfile();
        backup = exportSave(current, version, isTestProfile());
        plan = prepareImport(await file.text(), current);
        summary.textContent = plan.summary;
        warnings.textContent = [
          ...plan.warnings,
          ...(plan.sourceProfile !== (isTestProfile() ? 'testing' : 'player')
            ? [
                'This file comes from a different profile type. It will merge into the currently active profile.',
              ]
            : []),
        ].join(' ');
        confirm.disabled = false;
        dialog.showModal();
        button('bCancelImportSave').focus();
      } catch (error) {
        message.textContent = error instanceof Error ? error.message : 'Unable to read this save.';
      }
    },
    { signal: events.signal },
  );
  dialog.addEventListener('keydown', (event) => event.stopPropagation(), { signal: events.signal });
  button('bCancelImportSave').addEventListener(
    'click',
    () => {
      plan = null;
      dialog.close();
    },
    { signal: events.signal },
  );
  button('bDownloadSaveBackup').addEventListener(
    'click',
    () => download(backup, '-before-import'),
    { signal: events.signal },
  );
  confirm.addEventListener(
    'click',
    () => {
      if (!plan) return;
      confirm.disabled = true;
      if (importProfile(plan.data)) {
        location.reload();
      } else {
        warnings.textContent =
          'Import could not be saved. Your previous save is backed up for recovery. Please reload before trying again.';
      }
    },
    { signal: events.signal },
  );
  return () => {
    events.abort();
    dialog.close();
  };
}
