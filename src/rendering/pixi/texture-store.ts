import { Rectangle, Texture } from 'pixi.js';
import type { SceneTexture } from '../scene-frame.ts';

interface PreparedSource {
  texture: Texture;
  frames: Map<string, Texture>;
  revision: number;
  lastFrame: number;
}

/** Renderer-owned GPU resources. Never takes ownership of decoded source pixels. */
export class SceneTextureStore {
  private readonly sources = new Map<SceneTexture['source'], PreparedSource>();
  private frame = 0;

  beginFrame(): void {
    this.frame++;
  }

  get(input: SceneTexture): Texture {
    let prepared = this.sources.get(input.source);
    if (!prepared) {
      prepared = {
        texture: Texture.from(input.source, true),
        frames: new Map(),
        revision: input.revision,
        lastFrame: this.frame,
      };
      this.sources.set(input.source, prepared);
    }
    prepared.lastFrame = this.frame;
    if (prepared.revision !== input.revision) {
      for (const texture of prepared.frames.values()) texture.destroy(false);
      prepared.frames.clear();
      prepared.texture.source.resize(input.source.width, input.source.height);
      prepared.texture.source.update();
      prepared.revision = input.revision;
    }
    if (!input.frame) return prepared.texture;
    const key = input.frame.join(':');
    let texture = prepared.frames.get(key);
    if (!texture) {
      const [x, y, width, height] = input.frame;
      texture = new Texture({
        source: prepared.texture.source,
        frame: new Rectangle(x, y, width, height),
      });
      prepared.frames.set(key, texture);
    }
    return texture;
  }

  /** Drop unused stage resources, keeping a short grace period for transitions. */
  collect(): void {
    for (const [source, prepared] of this.sources) {
      if (this.frame - prepared.lastFrame <= 120) continue;
      this.release(prepared);
      this.sources.delete(source);
    }
  }

  get size(): number {
    return this.sources.size;
  }

  private release(prepared: PreparedSource): void {
    for (const texture of prepared.frames.values()) texture.destroy(false);
    prepared.texture.destroy(true);
  }

  dispose(): void {
    for (const prepared of this.sources.values()) this.release(prepared);
    this.sources.clear();
  }
}
