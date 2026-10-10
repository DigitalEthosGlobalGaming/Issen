import {
  Container,
  Graphics,
  GraphicsPath,
  Matrix,
  MeshSimple,
  Rectangle,
  Texture,
  UniformGroup,
} from 'pixi.js';
import type { Mesh, Geometry, Shader } from 'pixi.js';
import { ChangeTracker } from './change-tracker.ts';
import { sceneTextureRevision } from '../texture-revision.ts';

/** Screen-space cache keeps scene-light lookup and blur radii in viewport pixels. */
export class StaticFilterCache {
  readonly container = new Container();
  private readonly inputs = new ChangeTracker();
  private stable = 0;
  private width = 0;
  private height = 0;

  constructor(readonly item: Graphics | Mesh<Geometry, Shader>) {
    this.container.addChild(item);
  }

  private record(value: unknown): void {
    if (value instanceof Texture) {
      this.inputs.value(value.source);
      this.inputs.value(value.source._resourceId);
      const resource = value.source.resource;
      if (resource instanceof HTMLCanvasElement) this.inputs.value(sceneTextureRevision(resource));
      this.record(value.frame);
    } else if (value instanceof Matrix) {
      this.inputs.value(value.a);
      this.inputs.value(value.b);
      this.inputs.value(value.c);
      this.inputs.value(value.d);
      this.inputs.value(value.tx);
      this.inputs.value(value.ty);
    } else if (value instanceof GraphicsPath) this.record(value.instructions);
    else if (value instanceof UniformGroup) this.record(value.uniforms);
    else if (Array.isArray(value)) {
      this.inputs.value(value.length);
      for (const entry of value) this.record(entry);
    } else if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
      this.inputs.numbers(value as unknown as ArrayLike<number>);
    } else if (value instanceof Rectangle) {
      this.inputs.value(value.x);
      this.inputs.value(value.y);
      this.inputs.value(value.width);
      this.inputs.value(value.height);
    } else if (
      value &&
      typeof value === 'object' &&
      Object.getPrototypeOf(value) === Object.prototype
    ) {
      for (const key in value) {
        this.inputs.value(key);
        this.record(Reflect.get(value, key));
      }
    } else this.inputs.value(value);
  }

  prepare(
    width: number,
    height: number,
    filter: string,
    lightingGeneration: number,
    contentRevision: number,
    allowance: number,
    antialias: boolean,
  ): number {
    const item = this.item;
    this.inputs.begin();
    this.inputs.value(filter);
    this.inputs.value(lightingGeneration);
    this.inputs.value(contentRevision);
    this.inputs.value(width);
    this.inputs.value(height);
    this.inputs.value(antialias);
    item.updateLocalTransform();
    this.record(item.localTransform);
    this.inputs.value(item.alpha);
    this.inputs.value(item.tint);
    this.inputs.value(item.blendMode);
    if (item instanceof Graphics) this.record(item.context.instructions);
    else {
      if (item instanceof MeshSimple) {
        this.record(item.texture);
        this.record(item.vertices);
        this.record(item.geometry.uvs);
      } else {
        // Material geometry is retained; mutable uniforms and source revisions carry its content.
        const resources = item.shader!.resources;
        this.record(resources.materialUniforms);
        for (const key of ['uDiffuse', 'uNormal', 'uMask', 'uSurface', 'uEmissive']) {
          const source = resources[key];
          this.inputs.value(source);
          this.inputs.value(source?._resourceId);
        }
      }
    }
    const changed = this.inputs.finish();
    if (changed) {
      this.stable = 0;
      this.release();
    } else this.stable++;
    const bytes =
      2 ** Math.ceil(Math.log2(Math.max(1, width))) *
      2 ** Math.ceil(Math.log2(Math.max(1, height))) *
      (antialias ? 20 : 4);
    if (bytes > allowance || item.blendMode !== 'normal') {
      this.release();
      return 0;
    }
    if (this.stable < 1) return 0;
    if (!this.container.isCachedAsTexture) {
      if (width !== this.width || height !== this.height) {
        this.width = width;
        this.height = height;
        this.container.boundsArea = new Rectangle(0, 0, width, height);
      }
      this.container.cacheAsTexture({ resolution: 1, antialias });
    }
    return bytes;
  }

  release(): void {
    if (this.container.isCachedAsTexture) this.container.cacheAsTexture(false);
  }

  reset(): void {
    this.release();
    this.inputs.clear();
    this.stable = 0;
  }

  dispose(): void {
    this.release();
    this.inputs.clear();
    this.container.removeChildren();
    this.container.destroy();
  }
}
