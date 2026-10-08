import {
  Shader,
  Texture,
  UniformGroup,
  Matrix,
  compileHighShaderGlProgram,
  colorBitGl,
  generateTextureBatchBitGl,
  getBatchSamplersUniformGroup,
  localUniformBitGl,
  roundPixelsBitGl,
  textureBitGl,
} from 'pixi.js';
import type { Graphics, WebGLRenderer } from 'pixi.js';
import type { GeometryTargets } from './geometry-buffer.ts';
import type { LightTargets } from './light-buffer.ts';
import { lightingCompositeFunctions } from './lighting-composite-glsl.ts';
import { GraphicsUnsupportedError } from '../graphics-error.ts';
import { setShaderResource } from './shader-resources.ts';

function createLookupUniforms(batchTextures: number) {
  return new UniformGroup({
    uLightDiffuse: { value: batchTextures, type: 'i32' },
    uLightSpecular: { value: batchTextures + 1, type: 'i32' },
    uLightGuide: { value: batchTextures + 2, type: 'i32' },
    uLightResolution: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
    uLightSize: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
    uArtworkLighting: { value: 0, type: 'f32' },
  });
}

/** Native vectors and prepared colour art share the material light lookup.
 * Authored colour/fog/text use neutral lighting amount; this is material data,
 * with the same accumulation inputs and composite, never another render path.
 */
export class ArtworkMaterials {
  readonly uniforms: ReturnType<typeof createLookupUniforms>;
  readonly graphicsShader: Shader;
  private readonly meshProgram;
  private readonly batchTextures: number;
  private readonly meshes = new Set<ReturnType<ArtworkMaterials['createMesh']>>();
  private disposed = false;
  private targetsAttached = false;
  constructor(private readonly renderer: WebGLRenderer<HTMLCanvasElement>) {
    // Reserve diffuse/specular and a geometry guide for the later half-res lookup.
    // WebGL2 guarantees 16 fragment samplers; every context uses this same budget.
    this.batchTextures = Math.min(renderer.limits.maxBatchableTextures, 13);
    this.restore();
    this.uniforms = createLookupUniforms(this.batchTextures);
    const lookup = {
      name: 'issen-shared-light-lookup',
      vertex: {
        header: 'out vec2 vScenePosition;',
        end: 'vScenePosition = (worldTransformMatrix * modelMatrix * vec3(position, 1.0)).xy;',
      },
      fragment: {
        header: `in vec2 vScenePosition; uniform float uArtworkLighting; ${lightingCompositeFunctions}`,
        end: `vec3 original = clamp(finalColor.rgb / max(finalColor.a, 0.0001), 0.0, 1.0);
          vec3 display = sceneLightColour(original, vScenePosition, vec3(0.0));
          finalColor.rgb = mix(finalColor.rgb, display * finalColor.a, clamp(uArtworkLighting, 0.0, 1.0));`,
      },
    };
    this.graphicsShader = new Shader({
      glProgram: compileHighShaderGlProgram({
        name: 'issen-vector-light-composite',
        bits: [
          colorBitGl,
          generateTextureBatchBitGl(this.batchTextures),
          localUniformBitGl,
          roundPixelsBitGl,
          lookup,
        ],
      }),
      resources: {
        localUniforms: new UniformGroup({
          uColor: { value: new Float32Array([1, 1, 1, 1]), type: 'vec4<f32>' },
          uTransformMatrix: { value: new Matrix(), type: 'mat3x3<f32>' },
          uRound: { value: 0, type: 'f32' },
        }),
        batchSamplers: getBatchSamplersUniformGroup(this.batchTextures),
        lookupUniforms: this.uniforms,
      },
    });
    this.meshProgram = compileHighShaderGlProgram({
      name: 'issen-artwork-light-composite',
      bits: [localUniformBitGl, textureBitGl, roundPixelsBitGl, lookup],
    });
  }
  restore(): void {
    if (this.renderer.limits.maxBatchableTextures < this.batchTextures)
      throw new GraphicsUnsupportedError('The scene texture budget is unavailable after restore.');
    this.renderer.limits.maxBatchableTextures = this.batchTextures;
  }
  attach(graphics: Graphics): void {
    const context = graphics.context;
    if (context.customShader === this.graphicsShader) return;
    context.customShader = this.graphicsShader;
    context.dirty = true;
    context.emit('update', context, 16);
  }
  createMesh() {
    const textureUniforms = new UniformGroup({
      uTextureMatrix: { value: new Matrix(), type: 'mat3x3<f32>' },
    });
    const shader = Object.assign(
      new Shader({
        glProgram: this.meshProgram,
        resources: {
          uTexture: Texture.EMPTY.source,
          textureUniforms,
          lookupUniforms: this.uniforms,
        },
      }),
      { texture: Texture.EMPTY },
    );
    const binding = {
      shader,
      update(texture: Texture) {
        texture.textureMatrix.update();
        setShaderResource(shader.resources, 'uTexture', texture.source);
        textureUniforms.uniforms.uTextureMatrix = texture.textureMatrix.mapCoord;
        textureUniforms.update();
      },
      releaseTexture() {
        setShaderResource(shader.resources, 'uTexture', Texture.EMPTY.source);
      },
      dispose: () => {
        shader.destroy();
        this.meshes.delete(binding);
      },
    };
    this.meshes.add(binding);
    return binding;
  }
  prepare(geometry: Readonly<GeometryTargets>, light: Readonly<LightTargets>): void {
    this.uniforms.uniforms.uLightSize.set([geometry.width, geometry.height]);
    this.uniforms.uniforms.uLightResolution.set([light.width, light.height]);
    this.uniforms.update();
    this.renderer.texture.bind(light.diffuse.source, this.batchTextures);
    this.renderer.texture.bind(light.specular.source, this.batchTextures + 1);
    this.renderer.texture.bind(geometry.g0.source, this.batchTextures + 2);
    this.targetsAttached = true;
  }
  detachTargets(): void {
    if (!this.targetsAttached) return;
    this.targetsAttached = false;
    for (let unit = this.batchTextures; unit < this.batchTextures + 3; unit++)
      this.renderer.texture.bind(Texture.EMPTY.source, unit);
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.detachTargets();
    for (const binding of [...this.meshes]) binding.dispose();
    this.graphicsShader.destroy();
  }
}
