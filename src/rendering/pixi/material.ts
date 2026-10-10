import { Matrix, Mesh, MeshGeometry, Texture, UniformGroup } from 'pixi.js';
import { createGeometryMaterial } from './geometry-material.ts';
import { createCompositeMaterial } from './composite-material.ts';
import type { LightTargets } from './light-buffer.ts';
import { normalTransform } from '../scene-frame.ts';
import type { SceneLighting, SceneSprite } from '../scene-frame.ts';
import type { SceneTextureStore } from './texture-store.ts';
import { setShaderResource } from './shader-resources.ts';
import type { BindGroup, TextureSource } from 'pixi.js';
import { ChangeTracker } from './change-tracker.ts';

const textureNames = ['uDiffuse', 'uNormal', 'uMask', 'uSurface', 'uEmissive'] as const;

const vertex = `
precision highp float;
in vec2 aPosition;
in vec2 aUV;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;
uniform vec4 uWorldColorAlpha;
uniform vec4 uColor;
out vec2 vUV;
out vec2 vPosition;
out vec4 vColor;
void main() {
  vec3 world = uWorldTransformMatrix * uTransformMatrix * vec3(aPosition, 1.0);
  gl_Position = vec4((uProjectionMatrix * world).xy, 0.0, 1.0);
  vUV = aUV;
  vPosition = world.xy;
  vColor = uColor * uWorldColorAlpha;
}`;

function setUvRect(out: Float32Array, texture: Texture): void {
  if (texture.rotate || texture.trim)
    throw new Error('Material textures require unrotated, untrimmed frames.');
  const frame = texture.frame;
  out[0] = frame.x / texture.source.width;
  out[1] = frame.y / texture.source.height;
  out[2] = frame.width / texture.source.width;
  out[3] = frame.height / texture.source.height;
}
/** Shared geometry data and one ordered light-lookup material; no per-sprite BRDF. */
export function createMaterialMesh(sharedLights?: BindGroup) {
  const uniforms = new UniformGroup({
    uDiffuseRect: { value: new Float32Array([0, 0, 1, 1]), type: 'vec4<f32>' },
    uNormalRect: { value: new Float32Array([0, 0, 1, 1]), type: 'vec4<f32>' },
    uMaskRect: { value: new Float32Array([0, 0, 1, 1]), type: 'vec4<f32>' },
    uSurfaceRect: { value: new Float32Array([0, 0, 1, 1]), type: 'vec4<f32>' },
    uEmissiveRect: { value: new Float32Array([0, 0, 1, 1]), type: 'vec4<f32>' },
    uNormalMatrix: { value: new Float32Array([1, 0, 0, 1]), type: 'mat2x2<f32>' },
    uMaterial: { value: new Float32Array(4), type: 'vec4<f32>' },
    uFog: { value: new Float32Array(4), type: 'vec4<f32>' },
    uHasMask: { value: 0, type: 'f32' },
    uHasSurface: { value: 0, type: 'f32' },
    uHasEmissive: { value: 0, type: 'f32' },
  });
  const compositeMaterial = createCompositeMaterial(vertex, uniforms, sharedLights);
  const shader = compositeMaterial.shader;
  const geometryMaterial = createGeometryMaterial(vertex, uniforms);
  let cutoff = 0.5;
  const geometry = new MeshGeometry({
    positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
  });
  const mesh = new Mesh({ geometry, shader });
  const matrix = new Matrix();
  let texturesBound = false;
  const geometryInputs = new ChangeTracker();
  let geometryRevision = 0;
  return {
    mesh,
    get geometryRevision() {
      return geometryRevision;
    },
    programs: [geometryMaterial.shader.glProgram, shader.glProgram] as const,
    releaseLightTargets: compositeMaterial.releaseLightTargets,
    prepareComposite(targets: Readonly<LightTargets>): void {
      compositeMaterial.update(shader, targets);
    },
    beginGeometry(depthRange: number): () => void {
      let alpha = mesh.alpha;
      for (let parent = mesh.parent; parent; parent = parent.parent) alpha *= parent.alpha;
      geometryMaterial.update(shader, depthRange, cutoff, alpha);
      const blend = mesh.blendMode;
      const stateBlend = mesh.state.blend;
      const stateBlendMode = mesh.state.blendMode;
      mesh.shader = geometryMaterial.shader;
      mesh.blendMode = 'none';
      mesh.state.blend = false;
      return () => {
        mesh.shader = shader;
        mesh.blendMode = blend;
        mesh.state.blendMode = stateBlendMode;
        mesh.state.blend = stateBlend;
      };
    },
    releaseTextures(source?: TextureSource): void {
      if (!texturesBound) return;
      let released = false;
      for (const name of textureNames)
        if (!source || shader.resources[name] === source) {
          released = true;
          setShaderResource(
            shader.resources,
            name,
            name === 'uEmissive' ? Texture.EMPTY.source : Texture.WHITE.source,
          );
        }
      geometryMaterial.releaseTextures(source);
      if (released) {
        geometryInputs.clear();
        geometryRevision++;
      }
      if (!source) texturesBound = false;
    },
    update(sprite: SceneSprite, lights: SceneLighting, textures: SceneTextureStore): void {
      const material = sprite.material!;
      cutoff = Math.max(0, Math.min(1, material.alphaCutoff ?? 0.5));
      const diffuse = textures.get(sprite.texture);
      const normal = material.normal ? textures.getData(material.normal) : Texture.WHITE;
      const mask = material.mask ? textures.getData(material.mask) : Texture.WHITE;
      const surface = material.surface ? textures.getData(material.surface) : Texture.WHITE;
      const emissive = material.emissive ? textures.get(material.emissive) : Texture.EMPTY;
      setShaderResource(shader.resources, 'uDiffuse', diffuse.source);
      setShaderResource(shader.resources, 'uNormal', normal.source);
      setShaderResource(shader.resources, 'uMask', mask.source);
      setShaderResource(shader.resources, 'uSurface', surface.source);
      setShaderResource(shader.resources, 'uEmissive', emissive.source);
      texturesBound = true;
      const u = uniforms.uniforms;
      setUvRect(u.uDiffuseRect, diffuse);
      setUvRect(u.uNormalRect, normal);
      setUvRect(u.uMaskRect, mask);
      setUvRect(u.uSurfaceRect, surface);
      setUvRect(u.uEmissiveRect, emissive);
      const transform = sprite.transform;
      normalTransform(
        transform,
        u.uNormalMatrix,
        sprite.width / diffuse.frame.width,
        sprite.height / diffuse.frame.height,
      );
      u.uMaterial[0] = material.lighting * (lights.materialLighting ?? 1);
      u.uMaterial[1] = material.normal ? 1 : 0;
      u.uMaterial[2] = material.depth;
      u.uMaterial[3] = material.normalY ?? 1;
      for (let j = 0; j < 3; j++) u.uFog[j] = material.fogColor[j]!;
      u.uFog[3] = material.fog;
      u.uHasMask = material.mask ? 1 : 0;
      u.uHasSurface = material.surface ? (material.surfaceCoverage ? 2 : 1) : 0;
      u.uHasEmissive = material.emissive ? 1 : 0;
      uniforms.update();
      const t = sprite.transform;
      matrix.set(
        t.a * sprite.width,
        t.b * sprite.width,
        t.c * sprite.height,
        t.d * sprite.height,
        t.tx,
        t.ty,
      );
      mesh.setFromMatrix(matrix);
      mesh.alpha = sprite.alpha;
      mesh.tint = sprite.tint;
      mesh.blendMode = sprite.blend;
      geometryInputs.begin();
      for (let i = 0; i < 4; i++) {
        const source = shader.resources[textureNames[i]!] as TextureSource;
        geometryInputs.value(source);
        geometryInputs.value(source._resourceId);
      }
      geometryInputs.value(sprite.texture.revision);
      geometryInputs.value(material.normal?.revision);
      geometryInputs.value(material.mask?.revision);
      geometryInputs.value(material.surface?.revision);
      geometryInputs.numbers(u.uDiffuseRect);
      geometryInputs.numbers(u.uNormalRect);
      geometryInputs.numbers(u.uMaskRect);
      geometryInputs.numbers(u.uSurfaceRect);
      geometryInputs.numbers(u.uNormalMatrix);
      geometryInputs.numbers(u.uMaterial);
      geometryInputs.value(u.uHasMask);
      geometryInputs.value(u.uHasSurface);
      geometryInputs.value(cutoff);
      geometryInputs.value(sprite.tint);
      if (geometryInputs.finish()) geometryRevision++;
    },
    dispose(): void {
      mesh.destroy();
      geometry.destroy();
      geometryMaterial.dispose();
      compositeMaterial.dispose();
    },
  };
}
