import { expect, test } from '@playwright/test';

test('sharing selects host, native share, and download fallbacks without opening dialogs', async ({
  page,
}) => {
  await page.goto('/');
  const results = await page.evaluate(async () => {
    const modulePath = '/src/platform/sharing.ts';
    const { createSharing } = await import(modulePath);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 8;
    canvas.getContext('2d')!.fillRect(0, 0, 8, 8);
    const results = [];
    const originalClick = HTMLAnchorElement.prototype.click;
    const originalCreate = URL.createObjectURL,
      originalRevoke = URL.revokeObjectURL;
    const originalTimeout = window.setTimeout;
    let clicks: string[] = [],
      shared: string[] = [],
      saved: string[] = [],
      revoked: string[] = [];
    let cleanup: (() => void) | null = null;
    HTMLAnchorElement.prototype.click = function () {
      if (!this.isConnected || this.href !== 'blob:test-card')
        throw new Error('Invalid download link');
      clicks.push(this.download);
    };
    URL.createObjectURL = (blob) => {
      if (!(blob instanceof Blob) || blob.type !== 'image/png') throw new Error('Invalid PNG blob');
      return 'blob:test-card';
    };
    URL.revokeObjectURL = (url) => {
      revoked.push(url);
    };
    window.setTimeout = ((callback: TimerHandler, delay?: number, ...args: unknown[]) => {
      if (delay === 30000 && typeof callback === 'function') {
        cleanup = () => callback();
        return 0;
      }
      return originalTimeout(callback, delay, ...args);
    }) as typeof window.setTimeout;
    try {
      for (const scenario of [
        'host',
        'declined',
        'rate_limited',
        'host-error',
        'host-unavailable',
        'native',
        'native-abort',
        'native-error',
        'download',
        'no-blob',
      ]) {
        clicks = [];
        shared = [];
        saved = [];
        revoked = [];
        cleanup = null;
        const useHost = [
          'host',
          'declined',
          'rate_limited',
          'host-error',
          'host-unavailable',
        ].includes(scenario);
        Object.defineProperty(window, 'claude', {
          configurable: true,
          value: useHost
            ? {
                async use(name: string) {
                  if (name !== 'downloads') throw new Error('Wrong host capability');
                  if (scenario === 'host-unavailable') throw new Error('Unavailable');
                  return {
                    async save({ filename, data }: { filename: string; data: Blob }) {
                      if (data.type !== 'image/png') throw new Error('Invalid host payload');
                      saved.push(filename);
                      if (scenario !== 'host') throw { code: scenario };
                    },
                  };
                },
              }
            : undefined,
        });
        const native = [
          'host-error',
          'host-unavailable',
          'native',
          'native-abort',
          'native-error',
        ].includes(scenario);
        Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => native });
        Object.defineProperty(navigator, 'share', {
          configurable: true,
          value: async (data: ShareData) => {
            if (data.title !== 'Issen' || data.files?.[0]?.type !== 'image/png')
              throw new Error('Invalid share payload');
            shared.push(data.files![0]!.name);
            if (scenario === 'native-abort') throw new DOMException('Cancelled', 'AbortError');
            if (scenario === 'native-error') throw new Error('Unavailable');
          },
        });
        const target =
          scenario === 'no-blob'
            ? Object.assign(document.createElement('canvas'), {
                toBlob(callback: BlobCallback) {
                  callback(null);
                },
              })
            : canvas;
        const message = await createSharing()(target, 123);
        const revokeLater = cleanup as (() => void) | null;
        if (clicks.length && revoked.length) throw new Error('Download URL revoked too early');
        revokeLater?.();
        if (document.querySelector('a[download="issen-123.png"]'))
          throw new Error('Download link leaked');
        results.push({
          scenario,
          message: message ?? null,
          saved: saved.length,
          shared: shared.length,
          downloaded: clicks.length,
          revoked: revoked.length,
        });
      }
    } finally {
      HTMLAnchorElement.prototype.click = originalClick;
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      window.setTimeout = originalTimeout;
    }
    return results;
  });
  const row = (
    scenario: string,
    message: string | null,
    saved = 0,
    shared = 0,
    downloaded = 0,
  ) => ({ scenario, message, saved, shared, downloaded, revoked: downloaded });
  const downloadMessage = 'If nothing downloaded, press and hold the image to save it.';
  expect(results).toEqual([
    row('host', 'Saved.', 1),
    row('declined', 'Not saved.', 1),
    row('rate_limited', 'A save prompt is already open.', 1),
    row('host-error', null, 1, 1),
    row('host-unavailable', null, 0, 1),
    row('native', null, 0, 1),
    row('native-abort', null, 0, 1),
    row('native-error', downloadMessage, 0, 1, 1),
    row('download', downloadMessage, 0, 0, 1),
    row('no-blob', 'Press and hold the image to save it.'),
  ]);
});
