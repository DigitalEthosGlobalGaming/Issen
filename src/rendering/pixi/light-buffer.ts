import {
  Container,
  Mesh,
  MeshGeometry,
  RenderTarget,
  Shader,
  Texture,
  TextureSource,
  UniformGroup,
} from 'pixi.js';
import type { WebGLRenderer } from 'pixi.js';
import type { GeometryTargets } from './geometry-buffer.ts';
import type { SceneLighting } from '../scene-frame.ts';
import { selectSceneLights } from '../light-budget.ts';
import { GraphicsUnsupportedError } from '../graphics-error.ts';
import { setShaderResource } from './shader-resources.ts';

export type LightDebugView = 'diffuse' | 'specular';
export interface LightTargets {
  readonly diffuse: Texture;
  readonly specular: Texture;
  readonly width: number;
  readonly height: number;
  readonly generation: number;
  readonly sceneWidth: number;
  readonly sceneHeight: number;
  readonly resolution: 1 | 0.5;
  /** Borrowed full-resolution normal/depth/coverage guide; the geometry owner releases it. */
  readonly guide: Texture;
}

/** Both extensions enable the same required RGBA16F format; no degraded format path. */
export function requireLightBuffers(gl: WebGL2RenderingContext): void {
  if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float'))
    throw new GraphicsUnsupportedError('WebGL2 HDR colour attachments are required.');
}

const vertex = `#version 300 es
in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;
void main() { vUV = aUV; gl_Position = vec4(aPosition * 2.0 - 1.0, 0.0, 1.0); }`;
const fragment = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uG0;
uniform sampler2D uG1;
uniform sampler2D uG2;
uniform vec3 uAmbient;
uniform vec3 uDirectional;
uniform vec3 uDirection;
uniform vec4 uPointPosition[16];
uniform vec4 uPointColor[16];
uniform float uCount;
uniform vec4 uFrame;
layout(location=0) out vec4 diffuseTarget;
layout(location=1) out vec4 specularTarget;
vec3 safeNormal(vec3 v) { return v * inversesqrt(max(dot(v,v), 0.000001)); }
vec3 decodeNormal(vec2 encoded) {
  vec2 xy = encoded * 2.0 - 1.0;
  vec3 n = vec3(xy, 1.0 - abs(xy.x) - abs(xy.y));
  if (n.z < 0.0) n.xy = (1.0 - abs(n.yx)) * mix(vec2(-1.0), vec2(1.0), step(vec2(0.0), n.xy));
  return safeNormal(n);
}
void addLight(vec3 normal, vec3 direction, vec3 light, vec3 albedo, vec3 surface,
              inout vec3 diffuse, inout vec3 specular) {
  float ndl = max(dot(normal, direction), 0.0);
  float ndv = max(normal.z, 0.0);
  if (ndl <= 0.0 || ndv <= 0.0) return;
  float roughness = clamp(surface.r, 0.08, 1.0);
  float metallic = clamp(surface.g, 0.0, 1.0);
  vec3 halfway = safeNormal(direction + vec3(0.0, 0.0, 1.0));
  float ndh = max(dot(normal, halfway), 0.0);
  float vdh = max(halfway.z, 0.0);
  float a = roughness * roughness, a2 = a * a;
  float denominator = ndh * ndh * (a2 - 1.0) + 1.0;
  float distribution = a2 / max(3.14159265 * denominator * denominator, 0.000001);
  float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
  float geometryL = ndl / (ndl * (1.0 - k) + k);
  float geometryV = ndv / (ndv * (1.0 - k) + k);
  vec3 f0 = mix(vec3(0.04), albedo, metallic);
  vec3 fresnel = f0 + (1.0 - f0) * pow(1.0 - vdh, 5.0);
  diffuse += light * (1.0 - metallic) * (1.0 - fresnel) * ndl;
  specular += light * distribution * geometryL * geometryV * fresnel
    / max(4.0 * ndl * ndv, 0.000001) * ndl * 3.14159265;
}
void main() {
  vec4 geometry = texture(uG0, vUV);
  vec4 surface = texture(uG1, vUV);
  vec3 albedo = texture(uG2, vUV).rgb;
  if (geometry.a <= 0.0 || surface.a <= 0.0 || uFrame.w <= 0.0) {
    diffuseTarget = vec4(1.0); specularTarget = vec4(0.0,0.0,0.0,1.0); return;
  }
  vec3 normal = decodeNormal(geometry.xy);
  // Canonical zero depth is byte 128, avoiding a half-step offset for flat artwork.
  float depth = (geometry.z - 128.0 / 255.0) * (2.0 * uFrame.z);
  vec3 diffuse = uAmbient * surface.b * (1.0 - surface.g);
  // Existing ambient metal energy is retained as an albedo-tinted specular approximation.
  vec3 specular = albedo * uAmbient * surface.b * surface.g;
  addLight(normal, safeNormal(uDirection), uDirectional, albedo, surface.rgb, diffuse, specular);
  vec2 position = vUV * uFrame.xy;
  for (int i = 0; i < 16; ++i) {
    if (float(i) >= uCount) break;
    vec3 offset = vec3(uPointPosition[i].xy - position, uPointPosition[i].z + depth);
    float falloff = max(0.0, 1.0 - length(offset.xy) / max(uPointPosition[i].w, 0.001));
    float strength = falloff * falloff * uPointColor[i].a;
    if (strength > 0.0)
      addLight(normal, safeNormal(offset), uPointColor[i].rgb * strength, albedo, surface.rgb, diffuse, specular);
  }
  diffuseTarget = vec4(clamp(diffuse, 0.0, 65504.0), 1.0);
  specularTarget = vec4(clamp(specular, 0.0, 65504.0), 1.0);
}`;

const linear = (value: number) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

/** Painter-owned native HDR MRT. Borrowed textures remain valid only for their generation. */
export class LightBuffer {
  private target?: RenderTarget;
  private snapshot?: Readonly<LightTargets>;
  private generation = 0;
  private disposed = false;
  private geometryAttached = false;
  private readonly uniforms = new UniformGroup({
    uAmbient: { value: new Float32Array(3), type: 'vec3<f32>' },
    uDirectional: { value: new Float32Array(3), type: 'vec3<f32>' },
    uDirection: { value: new Float32Array(3), type: 'vec3<f32>' },
    uPointPosition: { value: new Float32Array(64), type: 'vec4<f32>', size: 16 },
    uPointColor: { value: new Float32Array(64), type: 'vec4<f32>', size: 16 },
    uCount: { value: 0, type: 'f32' },
    uFrame: { value: new Float32Array(4), type: 'vec4<f32>' },
  });
  private readonly shader = Shader.from({
    gl: { vertex, fragment, name: 'issen-light-pass' },
    resources: {
      lightUniforms: this.uniforms,
      uG0: Texture.EMPTY.source,
      uG1: Texture.EMPTY.source,
      uG2: Texture.EMPTY.source,
    },
  });
  private readonly geometry = new MeshGeometry({
    positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
  });
  private readonly mesh = new Mesh({ geometry: this.geometry, shader: this.shader });
  private readonly root = new Container();
  private readonly debugShader = Shader.from({
    gl: {
      vertex: `#version 300 es
in vec2 aPosition; in vec2 aUV; out vec2 vUV;
void main() { vUV=aUV; gl_Position=vec4(aPosition.x*2.0-1.0,1.0-aPosition.y*2.0,0.0,1.0); }`,
      fragment: `#version 300 es
precision highp float; in vec2 vUV; uniform sampler2D uBuffer; out vec4 finalColor;
void main() { vec3 radiance=max(texture(uBuffer,vUV).rgb,vec3(0.0)); finalColor=vec4(radiance/(vec3(1.0)+radiance),1.0); }`,
      name: 'issen-light-debug',
    },
    resources: { uBuffer: Texture.EMPTY.source },
  });
  private readonly debugMesh = new Mesh({ geometry: this.geometry, shader: this.debugShader });
  private readonly debugRoot = new Container();
  constructor(private readonly renderer: WebGLRenderer<HTMLCanvasElement>) {
    this.mesh.state.blend = this.debugMesh.state.blend = false;
    this.root.addChild(this.mesh);
    this.debugRoot.addChild(this.debugMesh);
  }
  get targets(): Readonly<LightTargets> | undefined {
    return this.snapshot;
  }
  /** Detach geometry samplers before their owner releases a generation. */
  detachGeometry(): void {
    if (!this.geometryAttached) return;
    this.geometryAttached = false;
    setShaderResource(this.shader.resources, 'uG0', Texture.EMPTY.source);
    setShaderResource(this.shader.resources, 'uG1', Texture.EMPTY.source);
    setShaderResource(this.shader.resources, 'uG2', Texture.EMPTY.source);
  }
  resize(width: number, height: number, force = false, resolution: 1 | 0.5 = 1): void {
    if (this.disposed) return;
    width = Math.max(1, Math.round(width));
    height = Math.max(1, Math.round(height));
    const sceneWidth = width,
      sceneHeight = height;
    width = Math.max(1, Math.ceil(sceneWidth * resolution));
    height = Math.max(1, Math.ceil(sceneHeight * resolution));
    if (
      !force &&
      this.snapshot?.sceneWidth === sceneWidth &&
      this.snapshot.sceneHeight === sceneHeight &&
      this.snapshot.resolution === resolution
    )
      return;
    this.releaseTarget();
    const sources = [0, 1].map(
      () =>
        new TextureSource({
          width,
          height,
          format: 'rgba16float',
          alphaMode: 'no-premultiply-alpha',
          scaleMode: 'nearest',
          antialias: false,
        }),
    );
    this.target = new RenderTarget({
      colorTextures: sources,
      antialias: false,
      label: 'issen-light-buffer',
    });
    const [diffuse, specular] = sources.map((source) => new Texture({ source }));
    this.snapshot = Object.freeze({
      diffuse: diffuse!,
      specular: specular!,
      width,
      height,
      generation: ++this.generation,
      sceneWidth,
      sceneHeight,
      resolution,
      guide: Texture.EMPTY,
    });
    this.renderer.renderTarget.bind({ target: this.target, clear: true, clearColor: [0, 0, 0, 0] });
    const gl = this.renderer.gl as WebGL2RenderingContext;
    const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    this.renderer.renderTarget.bind({ target: this.renderer.view.renderTarget, clear: false });
    if (!complete) {
      this.releaseTarget();
      throw new GraphicsUnsupportedError('WebGL2 HDR framebuffer is incomplete.');
    }
  }
  render(geometry: Readonly<GeometryTargets>, lighting: SceneLighting): void {
    if (this.disposed) return;
    this.resize(geometry.width, geometry.height, false, lighting.lightResolution ?? 1);
    if (this.snapshot!.guide !== geometry.g0)
      this.snapshot = Object.freeze({ ...this.snapshot!, guide: geometry.g0 });
    setShaderResource(this.shader.resources, 'uG0', geometry.g0.source);
    setShaderResource(this.shader.resources, 'uG1', geometry.g1.source);
    setShaderResource(this.shader.resources, 'uG2', geometry.g2.source);
    this.geometryAttached = true;
    const u = this.uniforms.uniforms;
    u.uAmbient.set(lighting.ambient);
    u.uDirectional.set(lighting.directional);
    u.uDirection.set(lighting.direction);
    u.uFrame.set([
      geometry.width,
      geometry.height,
      geometry.depthRange,
      lighting.materialLighting ?? 1,
    ]);
    const points = selectSceneLights(
      lighting.points.map((light, index) => ({ id: String(index).padStart(3, '0'), light })),
      geometry.width,
      geometry.height,
    );
    u.uCount = points.length;
    u.uPointPosition.fill(0);
    u.uPointColor.fill(0);
    points.forEach((light, index) => {
      u.uPointPosition.set([light.x, light.y, light.z, light.radius], index * 4);
      u.uPointColor.set([...light.color.map(linear), light.intensity], index * 4);
    });
    this.uniforms.update();
    this.renderer.render({
      container: this.root,
      target: this.target!,
      clear: true,
      clearColor: [0, 0, 0, 0],
    });
  }
  renderDebug(view: LightDebugView): boolean {
    if (this.disposed || !this.snapshot) return false;
    setShaderResource(this.debugShader.resources, 'uBuffer', this.snapshot[view].source);
    this.renderer.render({ container: this.debugRoot, clear: true });
    return true;
  }
  private releaseTarget(): void {
    setShaderResource(this.debugShader.resources, 'uBuffer', Texture.EMPTY.source);
    const sources = this.target?.colorTextures.slice();
    if (this.snapshot)
      for (const texture of [this.snapshot.diffuse, this.snapshot.specular]) texture.destroy(false);
    this.snapshot = undefined;
    this.target?.destroy();
    this.target = undefined;
    // Explicit sources are not managed by RenderTarget.
    for (const source of sources ?? []) source.destroy();
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.detachGeometry();
    this.releaseTarget();
    this.root.removeChildren();
    this.debugRoot.removeChildren();
    this.mesh.destroy();
    this.debugMesh.destroy();
    this.geometry.destroy();
    this.shader.destroy();
    this.debugShader.destroy();
    this.root.destroy();
    this.debugRoot.destroy();
  }
}
