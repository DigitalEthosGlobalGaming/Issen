import { Rectangle, Texture } from 'pixi.js';
import type { TextureSource } from 'pixi.js';
import type { SceneTexture } from '../scene-frame.ts';
import { observeSceneTextureRetirement } from '../texture-revision.ts';

interface PreparedSource {
  texture: Texture;
  frames: Map<string, Texture>;
  revision: number;
  lastFrame: number;
  stopRetirement: () => void;
}

/** Renderer-owned GPU resources. Never takes ownership of decoded source pixels. */
export class SceneTextureStore {
  private readonly sources = new Map<SceneTexture['source'], PreparedSource>();
  private readonly dataSources = new Map<SceneTexture['source'], PreparedSource>();
  private frame = 0;
  private readonly retained = new Map<SceneTexture['source'], number>();
  private readonly retired = new Set<SceneTexture['source']>();
  private frameStarted = false;

  constructor(private readonly beforeRelease?: (source: TextureSource) => void) {}

  beginFrame(): void {
    this.releaseRetired();
    this.frameStarted = true;
    this.frame++;
  }

  /** Pending uploads survive ordinary frame collection until publication or cancellation. */
  retainSources(inputs: Iterable<SceneTexture['source']>): () => void {
    const sources = new Set(inputs);
    for (const source of sources) this.retained.set(source, (this.retained.get(source) ?? 0) + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      for (const source of sources) {
        const count = this.retained.get(source) ?? 0;
        if (count <= 1) this.retained.delete(source);
        else this.retained.set(source, count - 1);
      }
    };
  }

  private prepare(source: SceneTexture['source'], revision: number, data = false): PreparedSource {
    const store = data ? this.dataSources : this.sources;
    let prepared = store.get(source);
    if (!prepared) {
      prepared = {
        texture: Texture.from(source, true),
        frames: new Map(),
        revision,
        lastFrame: this.frame,
        stopRetirement: observeSceneTextureRetirement(source, (preserveFrame) => {
          if (
            preserveFrame &&
            this.frameStarted &&
            (this.sources.get(source)?.lastFrame === this.frame ||
              this.dataSources.get(source)?.lastFrame === this.frame)
          )
            this.retired.add(source);
          else this.releaseSources([source]);
        }),
      };
      if (data) prepared.texture.source.alphaMode = 'no-premultiply-alpha';
      store.set(source, prepared);
    }
    prepared.lastFrame = this.frame;
    if (prepared.revision !== revision) {
      for (const texture of prepared.frames.values()) texture.destroy(false);
      prepared.frames.clear();
      prepared.texture.source.resize(source.width, source.height);
      prepared.texture.source.update();
      prepared.revision = revision;
    }
    return prepared;
  }
  touch(source: SceneTexture['source'], revision: number): boolean {
    const prepared = this.sources.get(source);
    if (!prepared || prepared.revision !== revision) return false;
    prepared.lastFrame = this.frame;
    return true;
  }
  getData(input: SceneTexture): Texture {
    return this.get(input, true);
  }
  get(input: SceneTexture, data = false): Texture {
    if (input.frame) return this.getFrame(input.source, input.revision, ...input.frame, data);
    const prepared = this.prepare(input.source, input.revision, data);
    return prepared.texture;
  }
  getFrame(
    source: SceneTexture['source'],
    revision: number,
    x: number,
    y: number,
    width: number,
    height: number,
    data = false,
  ): Texture {
    const prepared = this.prepare(source, revision, data);
    const key = `${x}:${y}:${width}:${height}`;
    let texture = prepared.frames.get(key);
    if (!texture) {
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
    for (const store of [this.sources, this.dataSources])
      for (const [source, prepared] of store) {
        if (this.retained.has(source) || this.frame - prepared.lastFrame <= 120) continue;
        this.release(prepared);
        store.delete(source);
      }
  }

  get size(): number {
    return this.sources.size + this.dataSources.size;
  }

  /** Queued/replay sources retire when that frame ends or is abandoned. */
  releaseRetired(): void {
    this.releaseSources(this.retired);
    this.retired.clear();
  }

  get retirementSnapshot(): { sources: number; bytes: number } {
    let bytes = 0;
    for (const source of this.retired)
      for (const store of [this.sources, this.dataSources]) {
        const prepared = store.get(source);
        if (prepared)
          bytes += prepared.texture.source.pixelWidth * prepared.texture.source.pixelHeight * 4;
      }
    return { sources: this.retired.size, bytes };
  }

  /** A completed offscreen export no longer needs its source textures. */
  releaseSources(inputs: Iterable<SceneTexture['source']>): void {
    for (const source of inputs) {
      this.retired.delete(source);
      for (const store of [this.sources, this.dataSources]) {
        const prepared = store.get(source);
        if (!prepared) continue;
        this.release(prepared);
        store.delete(source);
      }
    }
  }

  private release(prepared: PreparedSource): void {
    prepared.stopRetirement();
    this.beforeRelease?.(prepared.texture.source);
    for (const texture of prepared.frames.values()) texture.destroy(false);
    prepared.texture.destroy(true);
  }

  dispose(): void {
    for (const prepared of this.sources.values()) this.release(prepared);
    for (const prepared of this.dataSources.values()) this.release(prepared);
    this.sources.clear();
    this.dataSources.clear();
    this.retained.clear();
    this.retired.clear();
  }
}
