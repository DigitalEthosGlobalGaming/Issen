import { Container, Mesh, MeshGeometry, RenderTarget, Shader, Texture } from 'pixi.js';
import type { WebGLRenderer } from 'pixi.js';
import { GraphicsUnsupportedError } from '../graphics-error.ts';

export type GeometryDebugView = 'none' | 'g0' | 'g1' | 'g2';
export interface GeometryTargets {
  readonly g0: Texture;
  readonly g1: Texture;
  readonly g2: Texture;
  readonly width: number;
  readonly height: number;
  readonly generation: number;
  /** Signed logical depth is encoded as 0.5 + depth / (2 * depthRange). */
  readonly depthRange: number;
}

/** Required native MRT; the startup surface reports this as one graphics error. */
export function requireGeometryBuffers(gl: WebGL2RenderingContext): void {
  if (gl.getParameter(gl.MAX_DRAW_BUFFERS) < 3 || gl.getParameter(gl.MAX_COLOR_ATTACHMENTS) < 3)
    throw new GraphicsUnsupportedError('Three WebGL2 colour attachments are required.');
}

/** One owner per painter; textures are read-only extension inputs, never caller-owned. */
export class GeometryBuffer {
  get programs() {
    return [this.debugShader.glProgram] as const;
  }
  private target?: RenderTarget;
  private snapshot?: Readonly<GeometryTargets>;
  private generation = 0;
  private disposed = false;
  private readonly debugShader = Shader.from({
    gl: {
      vertex: `#version 300 es
in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;
void main() { vUV = aUV; gl_Position = vec4(aPosition.x * 2.0 - 1.0, 1.0 - aPosition.y * 2.0, 0.0, 1.0); }`,
      fragment: `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uBuffer;
out vec4 finalColor;
void main() {
  vec4 value = texture(uBuffer, vUV);
  finalColor = vec4(value.rgb, 1.0);
}`,
      name: 'issen-geometry-debug',
    },
    resources: { uBuffer: Texture.EMPTY.source },
  });
  private readonly debugGeometry = new MeshGeometry({
    positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
  });
  private readonly debugMesh = new Mesh({ geometry: this.debugGeometry, shader: this.debugShader });
  private readonly debugRoot = new Container();

  constructor(private readonly renderer: WebGLRenderer<HTMLCanvasElement>) {
    this.debugMesh.state.blend = false;
    this.debugRoot.addChild(this.debugMesh);
  }
  get targets(): Readonly<GeometryTargets> | undefined {
    return this.snapshot;
  }
  resize(width: number, height: number, force = false): void {
    if (this.disposed) return;
    width = Math.max(1, Math.round(width));
    height = Math.max(1, Math.round(height));
    if (!force && this.snapshot?.width === width && this.snapshot.height === height) return;
    this.releaseTarget();
    this.target = new RenderTarget({
      width,
      height,
      colorTextures: 3,
      stencil: true,
      antialias: false,
      label: 'issen-g-buffer',
    });
    const [g0, g1, g2] = this.target.colorTextures.map((source) => {
      source.alphaMode = 'no-premultiply-alpha';
      source.style.scaleMode = 'nearest';
      return new Texture({ source });
    });
    this.snapshot = Object.freeze({
      g0: g0!,
      g1: g1!,
      g2: g2!,
      width,
      height,
      depthRange: Math.max(width, height),
      generation: ++this.generation,
    });
  }
  render(root: Container): void {
    if (this.disposed || !this.target) return;
    this.renderer.render({
      container: root,
      target: this.target,
      clear: true,
      clearColor: [0, 0, 0, 0],
    });
  }
  renderDebug(view: GeometryDebugView): boolean {
    if (this.disposed || !this.snapshot || view === 'none') return false;
    this.debugShader.resources.uBuffer = this.snapshot[view].source;
    this.renderer.render({ container: this.debugRoot, clear: true });
    return true;
  }
  private releaseTarget(): void {
    this.debugShader.resources.uBuffer = Texture.EMPTY.source;
    if (this.snapshot)
      for (const texture of [this.snapshot.g0, this.snapshot.g1, this.snapshot.g2])
        texture.destroy(false);
    this.snapshot = undefined;
    this.target?.destroy();
    this.target = undefined;
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.releaseTarget();
    this.debugRoot.removeChildren();
    this.debugMesh.destroy();
    this.debugGeometry.destroy();
    this.debugShader.destroy();
    this.debugRoot.destroy();
  }
}
