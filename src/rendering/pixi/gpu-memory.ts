import type { WebGLRenderer } from 'pixi.js';
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

/** Pixi 8.22's managed textures include source, HDR, filter, history and back-buffer textures. */
export function rendererGpuMemory(renderer: WebGLRenderer<HTMLCanvasElement>) {
  let bytes = 0;
  const sources = new Set(renderer.texture.managedTextures.filter(Boolean));
  for (const source of sources)
    bytes +=
      (rgbaMipBytes(source.pixelWidth, source.pixelHeight, source.autoGenerateMipmaps) *
        texturePixelBytes(source.format)) /
      4;

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
  return {
    sources: sources.size,
    bytes: bytes + renderbufferBytes,
    textureBytes: bytes,
    renderbufferBytes,
  };
}
