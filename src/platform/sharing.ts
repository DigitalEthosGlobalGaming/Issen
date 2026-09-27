interface Downloads {
  save(options: { filename: string; data: Blob }): Promise<void>;
}
interface HostWindow extends Window {
  claude?: { use(name: 'downloads'): Promise<Downloads> };
}

export function createSharing() {
  const host = (window as HostWindow).claude;
  const downloads =
    host && typeof host.use === 'function'
      ? host.use('downloads').catch(() => null)
      : Promise.resolve(null);

  return async function saveCard(
    canvas: HTMLCanvasElement,
    score: number,
  ): Promise<string | undefined> {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return 'Press and hold the image to save it.';
    const filename = `issen-${score}.png`;
    const integration = await downloads;
    if (integration) {
      try {
        await integration.save({ filename, data: blob });
        return 'Saved.';
      } catch (error) {
        const code =
          typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
        if (code === 'declined') return 'Not saved.';
        if (code === 'rate_limited') return 'A save prompt is already open.';
      }
    }
    try {
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Issen' });
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
    }
    try {
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      try {
        link.click();
      } finally {
        link.remove();
        // Give the browser time to begin consuming the download URL.
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
      }
    } catch {
      /* The user can still save the displayed image manually. */
    }
    return 'If nothing downloaded, press and hold the image to save it.';
  };
}
