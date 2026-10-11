import type { WebGLRenderer, TextureSource } from 'pixi.js';
import { rgbaMipBytes } from '../../platform/pixel-memory.ts';

/** Nominal storage for the uncompressed formats used by Issen and Pixi targets. */
export function texturePixelBytes(format: string): number {
  if (format === 'depth32float-stencil8') return 8;
  if (format === 'depth24plus' || format === 'depth24plus-stencil8' || format === 'depth32float')
    return 4;
  if (format === 'depth16unorm') return 2;
  if (format === 'stencil8') return 1;
  const match = /^(rgba|bgra|rg|r)(8|16|32)/.exec(format);
  if (!match) return 16; // Conservative for an unexpected format; no physical residency claim.
  return (({ rgba: 4, bgra: 4, rg: 2, r: 1 }[match[1]!] ?? 4) * Number(match[2])) / 8;
}

/** Pending source storage, deduplicated and replaced by residency after native init. */
export function pendingTextureBytes(sources: Iterable<TextureSource>, rendererUid: number) {
  let bytes = 0;
  for (const source of new Set(sources)) {
    if (source._gpuData?.[rendererUid]) continue;
    bytes +=
      (rgbaMipBytes(source.pixelWidth, source.pixelHeight, source.autoGenerateMipmaps) *
        texturePixelBytes(source.format)) /
      4;
  }
  return bytes;
}

/** Pixi 8.22's managed textures include source, HDR, filter, history and back-buffer textures. */
export function rendererGpuMemory(renderer: WebGLRenderer<HTMLCanvasElement>) {
  let bytes = 0;
  const sources = new Set(renderer.texture.managedTextures.filter(Boolean));
  for (const source of sources)
    bytes +=
      (rgbaMipBytes(source.pixelWidth, source.pixelHeight, source.autoGenerateMipmaps) *
        texturePixelBytes(source.format)) /
      4;

  const renderbufferBytes = rendererRenderbufferBytes(renderer);
  return {
    sources: sources.size,
    bytes: bytes + renderbufferBytes,
    textureBytes: bytes,
    renderbufferBytes,
  };
}

function rendererRenderbufferBytes(renderer: WebGLRenderer<HTMLCanvasElement>) {
  // Pixi exposes textures publicly but keeps stencil/MSAA renderbuffers in this hash.
  // Read descriptors only: no GL queries, binding changes or new native allocations.
  const hash: unknown = Reflect.get(renderer.renderTarget, '_gpuRenderTargetHash');
  const surfaces: unknown = Reflect.get(renderer.renderTarget, '_renderSurfaceToRenderTargetHash');
  const formats = new Map<string, string[]>();
  if (surfaces instanceof Map)
    for (const target of surfaces.values())
      if (target && Array.isArray(target.colorAttachments))
        formats.set(
          String(target.uid),
          target.colorAttachments.map(
            (attachment: { texture?: { format?: string } }) =>
              attachment.texture?.format ?? 'unknown',
          ),
        );
  let renderbufferBytes = 0;
  if (hash && typeof hash === 'object')
    for (const [id, target] of Object.entries(hash)) {
      if (!target || typeof target !== 'object') continue;
      const pixels = Number(target.width) * Number(target.height);
      if (!(pixels > 0)) continue;
      if (target.depthStencilRenderBuffer) renderbufferBytes += pixels * 4 * (target.msaa ? 4 : 1);
      // Pixi 8.22 allocates four samples for these buffers. Match attachment
      // formats; missing descriptors retain the conservative RGBA32F estimate.
      if (Array.isArray(target.msaaRenderBuffer))
        target.msaaRenderBuffer.forEach((buffer: unknown, index: number) => {
          if (buffer)
            renderbufferBytes +=
              pixels * texturePixelBytes(formats.get(id)?.[index] ?? 'unknown') * 4;
        });
    }
  return renderbufferBytes;
}

/** Observe Pixi8.22's owned residency hash; restore its methods on disposal. */
export function createGpuMemoryLedger(renderer: WebGLRenderer<HTMLCanvasElement>) {
  type Hash = {
    items: Record<string, TextureSource | null>;
    add(source: TextureSource): boolean;
    remove(source: TextureSource, ...args: unknown[]): void;
  };
  const hash = Reflect.get(renderer.texture, '_managedTextures') as Hash;
  const add = hash.add,
    remove = hash.remove;
  const entries = new Map<
    TextureSource,
    { bytes: number; update: () => void; unload: () => void }
  >();
  let bytes = 0;
  function forget(source: TextureSource) {
    const entry = entries.get(source);
    if (!entry) return;
    bytes -= entry.bytes;
    source.off('update', entry.update);
    source.off('resize', entry.update);
    source.off('unload', entry.unload);
    entries.delete(source);
  }
  function watch(source: TextureSource) {
    if (entries.has(source)) return;
    const entry = {
      bytes: 0,
      update: () => {
        const next =
          (rgbaMipBytes(source.pixelWidth, source.pixelHeight, source.autoGenerateMipmaps) *
            texturePixelBytes(source.format)) /
          4;
        bytes += next - entry.bytes;
        entry.bytes = next;
      },
      unload: () => forget(source),
    };
    entries.set(source, entry);
    source.on('update', entry.update);
    source.on('resize', entry.update);
    source.on('unload', entry.unload);
    entry.update();
  }
  function added(this: Hash, source: TextureSource) {
    const result = add.call(this, source);
    watch(source);
    return result;
  }
  function removed(this: Hash, source: TextureSource, ...args: unknown[]) {
    remove.call(this, source, ...args);
    forget(source);
  }
  hash.add = added;
  hash.remove = removed;
  for (const source of Object.values(hash.items))
    if (source) {
      source.off('unload', remove, hash);
      source.once('unload', removed, hash);
      watch(source);
    }
  return {
    snapshot() {
      const renderbufferBytes = rendererRenderbufferBytes(renderer);
      return {
        sources: entries.size,
        bytes: bytes + renderbufferBytes,
        textureBytes: bytes,
        renderbufferBytes,
      };
    },
    dispose() {
      for (const source of [...entries.keys()]) {
        source.off('unload', removed, hash);
        source.once('unload', remove, hash);
        forget(source);
      }
      if (hash.add === added) hash.add = add;
      if (hash.remove === removed) hash.remove = remove;
    },
  };
}
